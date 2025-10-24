/** The event when a category has been selected. */
export type CategorySelectedEvent = CustomEvent<{ name: string }>;

/** Event for notifications shown to user. */
export type InternalNotificationEvent = CustomEvent<{
    title: string;
    description: string | undefined;
}>;

/** Notify other components about a category being selected. */
export function dispatchCategorySelection(source: EventTarget, name: string) {
    source.dispatchEvent(
        new CustomEvent("category-selected", {
            bubbles: true,
            detail: { name },
        }) satisfies CategorySelectedEvent,
    );
}

/** Notify the user about something. */
export function dispatchInternalNotification(
    source: EventTarget,
    title: string,
    description?: string,
) {
    source.dispatchEvent(
        new CustomEvent("internal-notification", {
            bubbles: true,
            detail: { title, description },
        }) satisfies InternalNotificationEvent,
    );
}

declare global {
    interface GlobalEventHandlersEventMap {
        "category-selected": CategorySelectedEvent;
        "internal-notification": InternalNotificationEvent;
    }
}

/** Event when a single word has been selected. */
export type WordSelectedEvent = CustomEvent<{ name: string; index: number }>;
/** Event that is triggered when multiple words, for example one category has been selected */
export type WordsSelectedEvent = CustomEvent<{
    selections: Array<{ name: string; index: number }>;
    category: string | null;
}>;

/** Notify other components about a word being selected. */
export function dispatchWordSelection(source: EventTarget, name: string, index: number) {
    source.dispatchEvent(
        new CustomEvent("word-selected", {
            bubbles: true,
            detail: { name, index },
        }) satisfies WordSelectedEvent,
    );
}

/** Notify other components when multiple words has been selected */
export function dispatchWordsSelection(
    source: EventTarget,
    selections: Array<{ name: string; index: number }>,
    category: string | null,
) {
    source.dispatchEvent(
        new CustomEvent("words-selected", {
            bubbles: true,
            detail: { selections, category },
        }) satisfies WordsSelectedEvent,
    );
}

declare global {
    interface GlobalEventHandlersEventMap {
        "word-selected": WordSelectedEvent;
        "words-selected": WordsSelectedEvent;
    }
}
