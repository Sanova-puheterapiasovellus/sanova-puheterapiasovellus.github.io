import { Store } from "./reactive";

/** Persisted result of playing a game. */
export type GameResult = { id: number; date: number; score: number };

/** Wait for a request to complete. */
function waitCompletion<T>(request: IDBRequest<T>, signal: AbortSignal): Promise<T> {
    return new Promise((resolve, reject) => {
        request.addEventListener("success", (_) => resolve(request.result), { signal });
        request.addEventListener("error", (_) => reject(request.error), { signal });
    });
}

/** Open and initialize the database. */
function openDatabase(
    name: string,
    version: number,
    signal: AbortSignal,
    upgrade: (database: IDBDatabase) => void,
): Promise<IDBDatabase> {
    const request = window.indexedDB.open(name, version);
    request.addEventListener("upgradeneeded", (_) => upgrade(request.result));
    return waitCompletion(request, signal);
}

/** Return a store yielding a view of the persisted history state. */
export function historyState(): Store<GameResult[]> {
    return new Store(async (current, signal) => {
        // Begin by opening and possibly migrating the database.
        const database = await openDatabase("sanova-history", 1, signal, (database) => {
            const results = database.createObjectStore("results", {
                keyPath: "id",
                autoIncrement: true,
            });

            results.createIndex("date", "date", { unique: false });
            results.createIndex("score", "score", { unique: false });
        });

        // Get access to results object store.
        const transaction = database.transaction(["results"], "readwrite");
        const results = transaction.objectStore("results");

        // Load the existing values.
        const existing = await waitCompletion(results.getAll(), signal);
        current.set(existing);

        // Receive new values from the rest of the application.
        window.addEventListener(
            "show-results",
            async (_) => {
                // Wait for the item to be added.
                const additional = { date: Date.now(), score: 0 };
                const key = await waitCompletion(results.add(additional), signal);

                // Update the store's state.
                existing.push({ ...additional, id: key as number });
                current.set(existing);
            },
            { signal },
        );
    });
}
