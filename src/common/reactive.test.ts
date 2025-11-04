import { deepStrictEqual } from "node:assert/strict";
import { type Mock, mock, suite, test } from "node:test";
import { Store, type Subscriber } from "./reactive.ts";

function assertProvidedWith<T>(callback: Mock<Subscriber<T>>, expected: T[]): void {
    const actual = callback.mock.calls
        .values()
        .map((entry) => entry.arguments[0])
        .toArray();

    deepStrictEqual(actual, expected);
}

suite("check reactive store usage", () => {
    test("persists previous state in source without subscriber", () => {
        const store = Store.of("foo");
        deepStrictEqual(store.get(), "foo");

        store.set("bar");
        deepStrictEqual(store.get(), "bar");
    });

    test("notified of only current value and changes", ({ signal }) => {
        const store = Store.of("foo");
        const callback = mock.fn<Subscriber<string>>();

        store.set("bar");
        store.subscribe(callback, signal);
        store.set("baz");

        assertProvidedWith(callback, ["bar", "baz"]);
    });

    test("transformed store reacts to changes", ({ signal }) => {
        const original = Store.of("first");
        const callback = mock.fn<Subscriber<string>>();

        original.map((value) => value.toUpperCase()).subscribe(callback, signal);
        original.set("second");

        assertProvidedWith(callback, ["FIRST", "SECOND"]);
    });

    test("filtered store only changes when relevant", ({ signal }) => {
        const store = Store.of(1);
        const callback = mock.fn<Subscriber<number>>();

        store.filter((value) => value % 2 === 0).subscribe(callback, signal);
        store.set(2);
        store.set(3);
        store.set(4);

        assertProvidedWith(callback, [2, 4]);
    });

    test("merged store reacts to changes", ({ signal }) => {
        const callback = mock.fn<Subscriber<number>>();

        const first = Store.of(2);
        const second = Store.of(2);

        Store.zip(first, second)
            .map(([first, second]) => first + second)
            .subscribe(callback, signal);

        first.set(4);
        second.set(8);

        assertProvidedWith(callback, [4, 6, 12]);
    });

    test("monadic bind operation works", ({ signal }) => {
        const store = Store.of(2);
        const callback = mock.fn<Subscriber<number>>();

        store.flatMap((value) => Store.of(value * 10)).subscribe(callback, signal);
        store.set(3);

        assertProvidedWith(callback, [20, 30]);
    });
});
