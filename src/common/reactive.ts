/** Callback for receiving value changes. */
export type Subscriber<T> = (value: T) => void;

/** Reactive store that can be subscribed to. */
interface Readable<T> {
    /** Register to be notified of changes until the removal signal fires. */
    subscribe(callback: Subscriber<T>, signal?: AbortSignal): void;
}

/** Reactive store that can be updated. */
interface Writable<T> extends Readable<T> {
    /** Update value and notify subscribers. */
    set(value: T): void;
}

/** Callback to initialize a reactive store. */
type Source<T> = (store: Writable<T>, signal: AbortSignal) => void;

/**
 * Infer the value types from a set of stores.
 *
 * No idea why this only works when the individual value case is included,
 * despite us always using arrays, but oh well.
 */
type InferValueTypes<T> = T extends Readable<infer U>
    ? U
    : { [K in keyof T]: T[K] extends Readable<infer U> ? U : never };

/** Helper to deal with tracking resolved child stores. */
class Bitmask {
    #state = 0;
    #mask: number;

    constructor(total: number) {
        if (total > 32) {
            throw new Error("trying to track unreasonable amount of indices");
        }

        this.#mask = (1 << total) - 1;
    }

    /** Check if the expected slots are full. */
    done(): boolean {
        return this.#state === this.#mask;
    }

    /** Mark a slot as being occupied. */
    mark(index: number) {
        this.#state |= 1 << index;
    }
}

/** Simple-ish reactive store implementation. */
export class Store<T> implements Writable<T> {
    #registered = new Set<Subscriber<T>>();
    #uninterest = 0;

    #source: Source<T>;
    #cleanup: AbortController | undefined;
    #current: T | undefined;

    constructor(source: Source<T>) {
        this.#source = source;
    }

    /** Create a store with a persisted value. */
    static of<T>(value: T): Store<T> {
        return new Store((store, signal) => {
            store.set(value);
            store.subscribe((change) => {
                value = change;
            }, signal);
        });
    }

    /** Create a combined store formed out of the values of the given stores. */
    static zip<T extends Readable<unknown>[]>(...stores: T): Store<InferValueTypes<T>> {
        return new Store((store, signal) => {
            const state = new Array<unknown>(stores.length);
            const resolved = new Bitmask(stores.length);

            for (const [index, source] of stores.entries()) {
                source.subscribe((value) => {
                    state[index] = value;
                    resolved.mark(index);

                    if (resolved.done()) {
                        store.set(state as InferValueTypes<T>);
                    }
                }, signal);
            }
        });
    }

    /** Try and resolve a value from the store. */
    get(): T {
        if (this.#current !== undefined) {
            return this.#current;
        }

        let slot: T | undefined;
        this.subscribe((value) => {
            slot = value;
        }, AbortSignal.abort());

        if (slot === undefined) {
            throw new Error("unable to immediately resolve lazy value");
        }

        return slot;
    }

    set(value: T): void {
        this.#current = value;
        for (const callback of this.#registered) {
            callback(value);
        }
    }

    /** Create a child store with transformed values. */
    map<S>(conversion: (value: T) => S): Store<S> {
        return new Store((store, signal) => {
            this.subscribe((value) => store.set(conversion(value)), signal);
        });
    }

    /** Create a child store for chaining dependent computations. */
    flatMap<S>(transform: (value: T) => Store<S>): Store<S> {
        return new Store((store, signal) => {
            this.subscribe((value) => {
                transform(value).subscribe((value) => store.set(value), signal);
            }, signal);
        });
    }

    /** Create a child store with type narrowed filtering. */
    filter<S extends T>(condition: (value: T) => value is S): Store<S>;

    /** Create a child store with only matching values. */
    filter(condition: (value: T) => boolean): Store<T>;

    filter(condition: (value: T) => boolean): Store<T> {
        return new Store((store, signal) =>
            this.subscribe((value) => {
                if (condition(value)) {
                    store.set(value);
                }
            }, signal),
        );
    }

    /** Remove a registered callback and clean up as needed. */
    #forget(callback: Subscriber<T>): void {
        this.#registered.delete(callback);
        if (this.#registered.size === this.#uninterest) {
            this.#cleanup?.abort();
            this.#cleanup = undefined;
            this.#current = undefined;
        }
    }

    subscribe(callback: Subscriber<T>, signal?: AbortSignal): void {
        this.#registered.add(callback);
        if (this.#current !== undefined) {
            callback(this.#current);
        } else {
            this.#cleanup = new AbortController();
            this.#source(this, this.#cleanup.signal);
            this.#uninterest = this.#registered.size;
        }

        if (signal?.aborted ?? false) {
            this.#forget(callback);
        } else {
            signal?.addEventListener("abort", this.#forget.bind(this, callback));
        }
    }
}
