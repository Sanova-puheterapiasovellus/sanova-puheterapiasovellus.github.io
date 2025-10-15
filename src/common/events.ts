/** The event when a category has been selected. */
export type CategorySelectedEvent = CustomEvent<{ name: string }>;

/** Notify other components about a category being selected. */
export function dispatchCategorySelection(source: EventTarget, name: string) {
    source.dispatchEvent(
        new CustomEvent("category-selected", {
            bubbles: true,
            detail: { name },
        }) satisfies CategorySelectedEvent,
    );
}

declare global {
    interface GlobalEventHandlersEventMap {
        "category-selected": CategorySelectedEvent;
    }
}

/** Event when a word has been selected. */
export type WordSelectedEvent = CustomEvent<{ name: string; index: number }>;

/** Notify other components about a word being selected. */
export function dispatchWordSelection(source: EventTarget, name: string, index: number) {
    source.dispatchEvent(
        new CustomEvent("word-selected", {
            bubbles: true,
            detail: { name, index },
        }) satisfies WordSelectedEvent,
    );
}

declare global {
    interface GlobalEventHandlersEventMap {
        "word-selected": WordSelectedEvent;
    }
}
