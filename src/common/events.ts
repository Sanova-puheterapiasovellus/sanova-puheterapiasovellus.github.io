/** The event when a category has been selected. */
export type CategorySelectedEvent = CustomEvent<{ name: string }>;

/** The event when a word has been selected. */
export type WordSelectedEvent = CustomEvent<{ word: string }>;

/** Notify other components about a category being selected. */
export function dispatchCategorySelection(source: EventTarget, name: string) {
    source.dispatchEvent(
        new CustomEvent("category-selected", {
            bubbles: true,
            detail: { name },
        }) satisfies CategorySelectedEvent,
    );
}

/** Notify other components about a word being selected. */
export function dispatchWordSelection(source: EventTarget, word: string) {
    source.dispatchEvent(
        new CustomEvent("word-selected", {
            bubbles: true,
            detail: { word },
        }) satisfies WordSelectedEvent,
    );
}

declare global {
    interface GlobalEventHandlersEventMap {
        "category-selected": CategorySelectedEvent;
        "word-selected": WordSelectedEvent;
    }
}
