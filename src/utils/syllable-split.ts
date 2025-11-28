import {
    CONSONANTS,
    DIPHTHONGS_AND_LONG_VOWELS,
    VOWELS,
} from "../data/syllable-split-phonology.ts";

/**
 * Splits a Finnish word into syllables.
 *
 * @param word The Finnish word to be split
 * @returns Iterator over individual syllables
 */
export function* splitToSyllables(word: string): Generator<string> {
    let i = 0;
    let currentStart = 0;

    // Helper function to clean up the yield cases from toying with the indices
    const advance = () => {
        i++;
        const previous = word.substring(currentStart, i);
        currentStart = i;
        return previous;
    };

    outer: for (; i < word.length; i++) {
        // Don't look back to the last syllable
        const lastChar = i === currentStart ? "" : word.charAt(i - 1);
        const currentChar = word.charAt(i);
        const nextChar = word.charAt(i + 1);
        const secondNextChar = word.charAt(i + 2);

        // Some words already have syllable separators in them
        // Examples: t-paita
        const isLetter = /[A-Za-zÅÄÖåäö]/.test(currentChar);
        if (!isLetter) {
            yield word.substring(currentStart, i);
            currentStart = ++i;
            continue;
        }

        // Consonant rule
        // Split if one or more consonants follow vowels of current syllable.
        // Examples: o-me-na, kär-pä-nen
        if (isConsonant(nextChar) && isVowel(secondNextChar)) {
            for (let j = i; j >= 0; j--) {
                if (isVowel(word.charAt(j))) {
                    yield advance();
                    continue outer;
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
            yield advance();
            continue;
        }

        // Diphthong rule
        // Split if the first vowel in syllable is in included diphthong/long vowel AND
        // it is followed by another vowel.
        // Examples: maa-il-ma, kai-ui-ssa
        if (isVowel(nextChar) && isDiphthongOrLongVowel(lastChar + currentChar)) {
            yield advance();
        }
    }

    yield word.substring(currentStart);
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
