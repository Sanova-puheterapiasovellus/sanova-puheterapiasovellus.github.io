import type { Category, Word } from "../data/word-data-model";

/** The event when a category has been selected. */
export type CategorySelectedEvent = CustomEvent<{ category: Category }>;

/** Event for notifications shown to user. */
export type InternalNotificationEvent = CustomEvent<{
    title: string;
    description: string | undefined;
}>;

/** Notify other components about a category being selected. */
export function dispatchCategorySelection(source: EventTarget, category: Category) {
    source.dispatchEvent(
        new CustomEvent("category-selected", {
            bubbles: true,
            detail: { category },
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
}

/** Event that is triggered when the game runs out of words */
export type GameOverEvent = CustomEvent<{
    showResults: boolean;
    gameResults: GameResults;
}>;

/** Notify other components about a word being selected. */
export function dispatchWordSelection(source: EventTarget, word: Word, index: number) {
    source.dispatchEvent(
        new CustomEvent("word-selected", {
            bubbles: true,
            detail: { word, index },
        }) satisfies WordSelectedEvent,
    );
}

/** Notify other components when multiple words has been selected */
export function dispatchWordsSelection(
    source: EventTarget,
    selections: Array<{ word: Word; index: number }>,
    category: Category | null,
    isReplay: boolean,
) {
    source.dispatchEvent(
        new CustomEvent("words-selected", {
            bubbles: true,
            detail: { selections, category, isReplay },
        }) satisfies WordsSelectedEvent,
    );
}

export function dispatchGameOver(
    source: EventTarget,
    showResults: boolean,
    gameResults: GameResults,
) {
    source.dispatchEvent(
        new CustomEvent("show-results", {
            bubbles: true,
            detail: { showResults, gameResults },
        }) satisfies GameOverEvent,
    );
}

declare global {
    interface GlobalEventHandlersEventMap {
        "word-selected": WordSelectedEvent;
        "words-selected": WordsSelectedEvent;
        "show-results": GameOverEvent;
    }
}
