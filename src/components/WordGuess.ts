import type { Word } from "../data/word-data-model";
import { WordGuessStatus } from "./wordStatus";

/** Keeps track of the guessed letters of a single word, renders the typed letters*/
export class WordGuess {
    private word: string = ""; // The current word as a string
    private currentGuess: string[] = []; // The current guess as an individual letters
    private locked: boolean[]; // Locked letters, using a letter hint locks a correct letter in place
    private status: WordGuessStatus = WordGuessStatus.NOT_GUESSED; // Default status
    private anyHintsUsed: boolean = false;
    private wordObject: Word;

    /** Initialize a WordGuess object with current guess being
     * empty, i.e. no letter written. No letter hints used, so
     * no locked letters
     */
    constructor(wordObj: Word) {
        this.word = wordObj.name.toUpperCase();
        this.currentGuess = [];
        this.locked = new Array(this.word.length).fill(false);
        this.wordObject = wordObj;
    }

    setHintsUsed(): void {
        this.anyHintsUsed = true;
    }

    getHintsUsed(): boolean {
        return this.anyHintsUsed;
    }

    updateStatus(newStatus: WordGuessStatus): void {
        this.status = newStatus;
    }

    getStatus(): WordGuessStatus {
        return this.status;
    }

    /** Get the array containing the hint letters of the current guess */
    getLockedLettersArray(): boolean[] {
        return this.locked;
    }

    /** Get the array containing the letters of the current guess */
    getCurrentGuessArray(): string[] {
        return this.currentGuess;
    }

    /** Get the current word as a string */
    getWord(): string {
        return this.word;
    }

    getWordObject(): Word {
        return this.wordObject;
    }

    /** Update the current guess based on the string parameter */
    setGuessFromString(value: string) {
        this.currentGuess = value.split("").slice(0, this.word.length);
    }

    /** Get the current guess as a string */
    getGuess(): string {
        return this.currentGuess.join("");
    }

    /** Add new letter to the current guess */
    addLetter(letter: string): void {
        const nextIndex = this.currentGuess.length;
        if (nextIndex < this.word.length && !this.locked[nextIndex]) {
            this.currentGuess.push(letter.toUpperCase());
        }
    }

    /** Remove all the letters from the current guess, except the locked,
     * hint letters
     */
    removeAllLetters(): void {
        this.currentGuess = [];
        for (let i = 0; i < this.word.length; i++) {
            if (this.locked[i]) {
                this.currentGuess[i] = this.word[i]!; // keep hint letters
            }
        }
    }

    /** Remove the last letter of the current guess */
    removeLetter(): void {
        if (this.currentGuess.length > 0) {
            const lastIndex = this.currentGuess.length - 1;
            if (!this.locked[lastIndex]) {
                this.currentGuess.pop();
            }
        }
    }

    /** Remove the current guess entirely, even the locked hint letters */
    reset(): void {
        this.currentGuess = [];
    }

    /** Remove all the letters the user has written and get the next hint letter
     *  Return true if the whole word has been guessed only using letter hints,
     *  otherwise false
     */
    useLetterHint(): boolean {
        const wordArray = this.word.split("");
        const guessArray = this.currentGuess;
        let correctLettersLength = 0;

        // Find how many letters are correct starting from the beginning,
        // For example:
        // correct word: UKKONEN
        // User has written: UKKIN
        // There are 3 correct letters: UKK
        for (let i = 0; i < guessArray.length && i < wordArray.length; i++) {
            if (guessArray[i] === wordArray[i]) {
                correctLettersLength++;
            } else {
                break;
            }
        }

        // If the first letter is incorrect, reset the whole guess
        if (correctLettersLength === 0) {
            this.currentGuess = [];
            this.locked.fill(false);
        }

        // Starting from the left, lock every correct letter
        for (let i = 0; i < correctLettersLength; i++) {
            this.locked[i] = true;
            this.currentGuess[i] = this.word[i]!;
        }

        // The index of the hint letter that should be given,
        // in the example this would be 3, so the letter O
        const nextIndex = correctLettersLength;

        // If there are still more letters in the word, give the next letter
        // and lock it (example O)
        if (nextIndex < this.word.length) {
            this.currentGuess[nextIndex] = this.word[nextIndex]!;
            this.locked[nextIndex] = true;
        }

        // Remove all the letters after the given hint letter
        this.currentGuess = this.currentGuess.slice(0, nextIndex + 1);

        // Return true if the word has been guessed using letter hints
        return this.locked.every((locked) => locked);
    }

    /**
     * Render the word as individual letters.
     * @param container: Element that holds all the spans containing the letters
     */
    render(container: HTMLElement): void {
        container.style.setProperty("--letters", this.word.length.toString());
        container.innerHTML = "";
        for (let i = 0; i < this.word.length; i++) {
            const span = document.createElement("span");
            span.classList.add("letter-slot"); // Set style class for the element to later use css styling
            // Set the text to the guessed letter or to _ if not typed yet
            span.textContent = this.currentGuess[i] ?? "_";

            // If the current letter is obtained from a letter hint, it is locked.
            if (this.locked[i]) {
                // Style hint letters differently with class: .letter-slot.locked
                span.classList.add("locked");
                // Some styles for debugging, should be removed later
                span.style.color = "green"; // TODO: css file for styling
            }

            span.addEventListener("click", () => {
                const input = document.getElementById("hidden-input") as HTMLInputElement;
                if (input) {
                    input.focus();
                }
            });

            container.appendChild(span);
        }
    }
}
