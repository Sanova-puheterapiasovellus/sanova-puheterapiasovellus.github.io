import {
    CONSONANTS,
    DIPHTHONGS_AND_LONG_VOWELS,
    VOWELS,
} from "../data/syllable-split-phonology.ts";

/**
 * Splits a Finnish word to syllables.
 *
 * @param word The Finnish word to be split
 * @returns Split word string with hyphens at syllable boundaries
 */
export function splitToSyllables(word: string): string {
    let currentSyllable = "";
    for (let i = 0; i < word.length; i++) {
        const lastChar = word.charAt(i - 1);
        const currentChar = word.charAt(i);
        const nextChar = word.charAt(i + 1);
        const secondNextChar = word.charAt(i + 2);

        currentSyllable = currentSyllable + currentChar;

        // Consonant rule
        // Split if one or more consonants follow vowels of current syllable.
        // Examples: o-me-na, kär-pä-nen
        if (isConsonant(nextChar) && isVowel(secondNextChar)) {
            for (let j = i; j >= 0; j--) {
                if (isVowel(word.charAt(j))) {
                    return `${currentSyllable}-${splitToSyllables(word.substring(i + 1))}`;
                }
            }
        }

        // Vowel rule
        // Split if the first vowel of the syllable is followed by another vowel except
        // if the vowels combine into a diphthong or long vowel.
        // Examples: aa-mu, ruo-ka-öl-jy
        if (
            isVowel(currentChar) &&
            isVowel(nextChar) &&
            !isDiphthongOrLongVowel(currentChar + nextChar)
        ) {
            return `${currentSyllable}-${splitToSyllables(word.substring(i + 1))}`;
        }

        // Diphthong rule
        // Split if the first vowel in syllable is in included diphthong/long vowel AND
        // it is followed by another vowel.
        // Examples: maa-il-ma, kai-ui-ssa
        if (isVowel(nextChar) && isDiphthongOrLongVowel(lastChar + currentChar)) {
            return `${currentSyllable}-${splitToSyllables(word.substring(i + 1))}`;
        }
    }

    return currentSyllable;
}

/**
 * Checks if the character is a Finnish vowel.
 *
 * @param character Character to check
 * @returns True if the character is a vowel, false otherwise
 */
function isVowel(character: string): boolean {
    return VOWELS.includes(character.toLowerCase());
}

/**
 * Checks if the character is a Finnish consonant.
 *
 * @param character Character to check
 * @returns True if the character is a consonant, false otherwise
 */
function isConsonant(character: string): boolean {
    return CONSONANTS.includes(character.toLowerCase());
}

/**
 * Checks if the string is either a Finnish diphthong or a long vowel.
 *
 * @param string 2 character string to be checked
 * @returns True if the string is a diphthong or long vowel, false otherwise
 */
function isDiphthongOrLongVowel(string: string): boolean {
    return DIPHTHONGS_AND_LONG_VOWELS.includes(string.toLowerCase());
}
