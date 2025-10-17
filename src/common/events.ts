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
