export const WordGuessStatus = {
    NOT_GUESSED: 0,
    CORRECT: 1,
    INCORRECT: 2,
    CORRECT_USED_HINT: 3,
    SKIPPED: 4,
} as const;

export type WordGuessStatus = (typeof WordGuessStatus)[keyof typeof WordGuessStatus];
