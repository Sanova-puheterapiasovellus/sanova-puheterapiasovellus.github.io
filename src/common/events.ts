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
