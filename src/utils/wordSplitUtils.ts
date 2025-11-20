import type { Word } from "../data/word-data-model";

/** Split a word object based on the special characters
 * in the word.
 * @returns list of tuples where the first part is a substring of the word
 * and the second part tells if it contains only letters (true) or special
 * characters (false).
 */
export function splitWord(word: Word): [string, boolean][] {
    // word T-PAITA would result in:
    // [["T", true], ["-", false], ["P", true], ["A", true], ...]

    // The original word
    const text = word.name;

    const result: [string, boolean][] = [];

    // Regex definition A-Z, a-z, ÅÄÖ, åäö
    const isLetter = (char: string) => /[A-Za-zÅÄÖåäö]/.test(char);

    for (const char of text) {
        const charIsLetter = isLetter(char);
        result.push([char, charIsLetter]);
    }

    console.log("SPLIT WORD RESULT:", result);
    return result;
}
