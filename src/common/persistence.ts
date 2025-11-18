import { Store } from "./reactive";

/** Persisted result of playing a game. */
export type StoredResult = {
    id: number;
    date: number;
    words: number;
    correct: number;
};

/** Wait for a request to complete. */
function waitCompletion<T>(request: IDBRequest<T>, signal: AbortSignal): Promise<T> {
    return new Promise((resolve, reject) => {
        request.addEventListener("success", (_) => resolve(request.result), { signal });
        request.addEventListener("error", (_) => reject(request.error), { signal });
    });
}

/** Wait for a transaction to complete. */
function waitTransaction(transaction: IDBTransaction, signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
        signal.addEventListener("abort", () => transaction.abort());
        transaction.addEventListener("abort", (_) => reject());
        transaction.addEventListener("error", (_) => reject(transaction.error), { signal });
        transaction.addEventListener("complete", (_) => resolve(), { signal });
    });
}

/** Open and initialize the database. */
function openDatabase(
    name: string,
    version: number,
    signal: AbortSignal,
    upgrade: (database: IDBDatabase, transaction: IDBTransaction) => void,
): Promise<IDBDatabase> {
    const request = window.indexedDB.open(name, version);
    request.addEventListener("upgradeneeded", (_) => {
        if (!request.transaction) {
            throw new Error("object store upgrade should happen within transaction");
        }

        upgrade(request.result, request.transaction);
    });

    return waitCompletion(request, signal);
}

/** Run an action against an object store. */
async function accessObjectStore<T>(
    database: IDBDatabase,
    signal: AbortSignal,
    name: string,
    mode: IDBTransactionMode,
    action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
    const transaction = database.transaction([name], mode);
    const request = action(transaction.objectStore(name));

    const [_, result] = await Promise.all([
        waitTransaction(transaction, signal),
        waitCompletion(request, signal).then((result) => {
            transaction.commit();
            return result;
        }),
    ]);

    return result;
}

/** Get or create a object store. */
function getOrCreateStore(
    database: IDBDatabase,
    transaction: IDBTransaction,
    name: string,
    options?: IDBObjectStoreParameters,
): IDBObjectStore {
    if (database.objectStoreNames.contains(name)) {
        return transaction.objectStore(name);
    }

    return database.createObjectStore(name, options);
}

/** Get or create a index. */
function getOrCreateIndex(
    store: IDBObjectStore,
    name: string,
    options?: IDBIndexParameters,
): IDBIndex {
    if (store.indexNames.contains(name)) {
        return store.index(name);
    }

    return store.createIndex(name, name, options);
}

/** Return a store yielding a view of the persisted history state. */
export function historyState(): Store<StoredResult[]> {
    return new Store(async (current, signal) => {
        // Begin by opening and possibly migrating the database.
        const database = await openDatabase(
            "sanova-history",
            1,
            signal,
            (database, transaction) => {
                const results = getOrCreateStore(database, transaction, "results", {
                    keyPath: "id",
                    autoIncrement: true,
                });

                getOrCreateIndex(results, "date", { unique: false });
                getOrCreateIndex(results, "words", { unique: false });
                getOrCreateIndex(results, "correct", { unique: false });
            },
        );

        // Get the existing results from the object store.
        const existing = await accessObjectStore(database, signal, "results", "readonly", (store) =>
            store.getAll(),
        );

        // Show the now known values.
        current.set(existing);

        // Receive new values from the rest of the application.
        window.addEventListener(
            "show-results",
            async ({
                detail: {
                    gameResults: { correctAnswers, totalWords },
                },
            }) => {
                // Capture data from event.
                const additional = {
                    date: Math.floor(Date.now() / 1000),
                    words: totalWords,
                    correct: correctAnswers,
                } satisfies Omit<StoredResult, "id">;

                // Wait for the item to be added.
                const key = await accessObjectStore(
                    database,
                    signal,
                    "results",
                    "readwrite",
                    (store) => store.add(additional),
                );

                // Update the store's state.
                existing.push({ ...additional, id: key as number });
                current.set(existing);
            },
            { signal },
        );
    });
}
