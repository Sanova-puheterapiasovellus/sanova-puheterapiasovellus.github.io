import type { Word } from "../data/word-data-model";
import { splitWord } from "../utils/wordSplitUtils.ts";
import { WordGuessStatus } from "./wordStatus";

/** Keeps track of the guessed letters of a single word, renders the typed letters*/
export class WordGuess {
    private word: string = ""; // The current word as a string
    private currentGuess: string[] = []; // The current guess as an individual letters
    private previousGuess: string[] = [];
    private locked: boolean[]; // Locked letters, using a letter hint locks a correct letter in place
    private status: WordGuessStatus = WordGuessStatus.NOT_GUESSED; // Default status
    private anyHintsUsed: boolean = false;
    private wordObject: Word;
    private splitWord: [string, boolean][] = [];
    //private typedLettersCount: number = 0;

    /** Initialize a WordGuess object with current guess being
     * empty, i.e. no letter written. No letter hints used, so
     * no locked letters
     */
    constructor(wordObj: Word) {
        this.word = wordObj.name.toUpperCase();
        this.currentGuess = [];
        this.locked = new Array(this.word.length).fill(false);
        this.wordObject = wordObj;
        this.splitWord = splitWord(this.wordObject);
    }

    setHintsUsed(): void {
        this.anyHintsUsed = true;
    }

    getHintsUsed(): boolean {
        return this.anyHintsUsed;
    }

    getHintLettersCount(): number {
        let hintLetterCount = 0;
        for (let i = 0; i < this.locked.length; i++) {
            if (this.locked[i] && this.splitWord[i]![1]) {
                // This index is locked and has a normal
                // letter, so we can count that as a hint
                // letter. Do not count the locked special
                // characters
                hintLetterCount++;
            }
        }

        return hintLetterCount;
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

    /** Get the split word array that contains
     *  the special characters
     */
    getSplitWord(): [string, boolean][] {
        return this.splitWord;
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
                if (this.splitWord[i]![1]) {
                    break;
                } else {
                    // Always calculate special character as a correct one
                    correctLettersLength++;
                }
            }
        }

        // If the first letter is incorrect, reset the whole guess
        if (correctLettersLength === 0) {
            this.currentGuess = [];
            this.locked.fill(false);
        }

        // Starting from the left, lock every correct letter
        for (let i = 0; i < correctLettersLength; i++) {
            // Only lock the letter if it is not a special one.
            //if (this.splitWord[i]![1]) {
            this.locked[i] = true;
            //}
            this.currentGuess[i] = this.word[i]!;
        }

        // The index of the hint letter that should be given,
        // in the example this would be 3, so the letter O
        let nextIndex = correctLettersLength;

        // Check if the next hint letter is a special character,
        // skip that character and give the next character as hint
        // after that.
        if (nextIndex < this.word.length && this.splitWord[nextIndex]![1] === false) {
            this.locked[nextIndex] = true;
            this.currentGuess[nextIndex] = this.splitWord[nextIndex]![0];
            nextIndex++;
        }

        // If there are still more letters in the word, give the next letter
        // and lock it (example O)
        if (nextIndex < this.word.length) {
            this.currentGuess[nextIndex] = this.word[nextIndex]!;
            this.locked[nextIndex] = true;
        }

        // Remove all the letters after the given hint letter
        this.currentGuess = this.currentGuess.slice(0, nextIndex + 1);

        // Return true if the word has been guessed using letter hints,
        // ignore the special letters while evaluating this
        return this.splitWord.every(([_, isLetter], i) => !isLetter || this.locked[i]);
    }

    createCaretParticles(parent: HTMLElement, color?: string) {
        const PARTICLE_COUNT = 6;
        const MIN_DIST = 25;

        // Create particles
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const particle = document.createElement("div");
            particle.classList.add("caret-particle");

            if (color) {
                particle.style.background = color;
            }

            // random direction
            const angle = Math.random() * Math.PI * 2;
            const distance = MIN_DIST + Math.random() * 10; // px

            particle.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
            particle.style.setProperty("--dy", `${Math.sin(angle) * distance}px`);

            parent.appendChild(particle);

            // Remove after animation
            particle.addEventListener("animationend", () => {
                particle.remove();
            });
        }
    }

    /**
     * Render the word as individual letters.
     * @param container: Element that holds all the spans containing the letters
     */
    render(container: HTMLElement): void {
        container.style.setProperty("--letters", this.word.length.toString());
        container.innerHTML = "";

        // Get the index where the caret should be blinking
        //const caretIndex = this.currentGuess.length;
        let caretIndex = -1;
        for (let i = 0; i < this.word.length; i++) {
            const [, isLetter] = this.splitWord[i]!;
            if (!isLetter) continue; // skip special characters entirely
            const current = this.currentGuess[i];

            if (current == null || current === "_") {
                caretIndex = i;
                break;
            }
        }

        for (let i = 0; i < this.word.length; i++) {
            const span = document.createElement("span");
            span.classList.add("letter-slot");

            const [currentChar, isLetter] = this.splitWord[i]!;

            // If the current character is a normal letter, then we will render
            // either the letter or _, if the letter has not been written.
            if (isLetter) {
                const newChar = this.currentGuess[i] ?? "_";
                const oldChar = this.previousGuess[i] ?? "_";

                span.textContent = newChar;

                // Typing particle effect only for real letters
                if (newChar !== oldChar) {
                    this.createCaretParticles(span);
                }
            }
            // If the character is not a letter, then it is a special character
            // that should always be visible and not affected by the user input.
            else {
                span.textContent = currentChar;
                span.classList.add("special-char");
            }

            // Style the locked letters if any
            if (this.locked[i]) {
                span.classList.add("locked");
                span.style.color = "green";
            }

            // Add the caret class
            if (i === caretIndex) {
                span.classList.add("active");
            }

            // Generate particles if the user typed something
            // if (newChar !== oldChar) {
            //     this.createCaretParticles(span);
            // }

            // Focus on the hidden input if any of the slots are clicked
            span.addEventListener("click", () => {
                const input = document.getElementById("hidden-input") as HTMLInputElement;
                if (input) input.focus();
            });

            container.appendChild(span);
        }

        // Store the current guess to determine particle effects
        // when the next letter is typed / current one is deleted
        this.previousGuess = [...this.currentGuess];
    }
}
