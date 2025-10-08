/** Keeps track of the guessed letters of a single word, renders the typed letters*/
export class WordGuess {
    private word: string = ""; // The current word as a string
    private currentGuess: string[] = []; // The current guess as an individual letters
    private locked: boolean[]; // Locked letters, using a letter hint locks a correct letter in place
    private letterHintsUsed = 0; // Count the amount of letter hints used

    /** Initialize a WordGuess object with current guess being
     * empty, i.e. no letter written. No letter hints used, so
     * no locked letters
     */
    constructor(word: string) {
        this.word = word.toUpperCase();
        this.currentGuess = [];
        this.locked = new Array(this.word.length).fill(false);
    }

    /** Get the current word as a string */
    getWord(): string {
        return this.word;
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

    /** Get the next hint letter based on used hints */
    private getNextHintLetter(): string {
        if (this.letterHintsUsed >= this.word.length) {
            throw new Error("No more letter hints!");
        }
        return this.word[this.letterHintsUsed]!;
    }

    /** Remove all the letters the user has written and get the next hint letter
     *  Return true if the whole word has been guessed only using letter hints,
     *  otherwise false
     */
    useLetterHint(): boolean {
        // if no hints yet OR user has typed something → reset to only hints
        this.removeAllLetters();

        if (this.letterHintsUsed < this.word.length) {
            this.locked[this.letterHintsUsed] = true;
            this.currentGuess[this.letterHintsUsed] = this.getNextHintLetter();
            this.letterHintsUsed++;
        }

        // return true if the word is now fully revealed
        return this.letterHintsUsed === this.word.length;
    }

    /**
     * Render the word as individual letters.
     * @param container: Element that holds all the spans containing the letters
     */
    render(container: HTMLElement): void {
        container.innerHTML = "";
        for (let i = 0; i < this.word.length; i++) {
            const span = document.createElement("span");
            span.classList.add("letter-slot"); // Set style class for the element to later use css styling
            // Set the text to the guessed letter or to _ if not typed yet
            span.textContent = this.currentGuess[i] ?? "_";
            // Set the actual style later in css, not in here.
            // Set some test styling now for easier testing
            span.style.margin = "0 5px"; // TODO: css file for styling
            span.style.fontSize = "2rem"; // TODO: css file for styling
            span.style.display = "inline-block"; // TODO: css file for styling

            // If the current letter is obtained from a letter hint, it is locked.
            if (this.locked[i]) {
                // Style hint letters differently with class: .letter-slot.locked
                span.classList.add("locked");
                // Some styles for debugging, should be removed later
                span.style.color = "red"; // TODO: css file for styling
            }

            container.appendChild(span);
        }
    }
}
