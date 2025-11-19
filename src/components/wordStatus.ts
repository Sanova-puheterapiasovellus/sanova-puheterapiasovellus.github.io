export const WordGuessStatus = {
    NOT_GUESSED: 0,
    GUESS_CORRECT: 1,
    GUESS_INCORRECT: 2,
    USED_HINT: 3, // same as: GUESS_CORRECT_USED_HINT
    SKIPPED: 4,
} as const;

export type WordGuessStatus = (typeof WordGuessStatus)[keyof typeof WordGuessStatus];
