import type { Category, Word } from "../data/word-data-model";

/** Determine the type of a strongly typed custom event payload by key. */
export type CustomEventPayload<K extends keyof GlobalEventHandlersEventMap> =
    GlobalEventHandlersEventMap[K] extends CustomEvent<infer T> ? T : never;

/** The event when a category has been selected. */
export type CategorySelectedEvent = CustomEvent<{ category: Category }>;

/** Event for notifications shown to user. */
export type InternalNotificationEvent = CustomEvent<{
    title: string;
    description: string | undefined;
}>;

/** Event when a single word has been selected. */
export type WordSelectedEvent = CustomEvent<{
    word: Word;
    index: number;
}>;

/** Event that is triggered when multiple words, for example one category has been selected */
export type WordsSelectedEvent = CustomEvent<{
    selections: Array<{ word: Word; index: number }>;
    category: Category | null;
    isReplay: boolean;
}>;

/** Structure for game results */
export interface GameResults {
    correctAnswers: number;
    incorrectAnswers: number;
    skippedWords: number;
    wordsSolvedUsingHints: number;
    totalWords: number;
    totalVocalHintsUsed: number;
    totalTextHintsUsed: number;
    totalLetterHintsUsed: number;
}

/** Event that is triggered when the game runs out of words */
export type GameOverEvent = CustomEvent<{
    showResults: boolean;
    gameResults: GameResults;
}>;

/** Dispatch a strongly typed custom event. */
export function dispatchCustomEvent<K extends keyof GlobalEventHandlersEventMap>(
    key: K,
    detail: CustomEventPayload<K>,
    source: EventTarget = document.body,
): void {
    source.dispatchEvent(new CustomEvent(key, { bubbles: true, detail }));
}

declare global {
    interface GlobalEventHandlersEventMap {
        "category-selected": CategorySelectedEvent;
        "internal-notification": InternalNotificationEvent;
        "word-selected": WordSelectedEvent;
        "words-selected": WordsSelectedEvent;
        "show-results": GameOverEvent;
    }
}
