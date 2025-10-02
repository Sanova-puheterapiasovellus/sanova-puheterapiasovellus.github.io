/** Keeps track of the guessed letters of a single word, renders the typed letters*/
export class WordGuess {
    private word: string = "";
    private currentGuess: string[] = [];
    private locked: boolean[];
    private letterHintsUsed = 0;

    constructor(word: string) {
        this.word = word.toUpperCase();
        this.currentGuess = [];
        this.locked = new Array(this.word.length).fill(false);
    }

    getWord(): string {
        return this.word;
    }

    getGuess(): string {
        return this.currentGuess.join("");
    }

    addLetter(letter: string): void {
        const nextIndex = this.currentGuess.length;
        if (nextIndex < this.word.length && !this.locked[nextIndex]) {
            this.currentGuess.push(letter.toUpperCase());
        }
    }

    removeAllLetters(): void {
        this.currentGuess = [];
        for (let i = 0; i < this.word.length; i++) {
            if (this.locked[i]) {
                this.currentGuess[i] = this.word[i]!; // keep hint letters
            }
        }
    }

    removeLetter(): void {
        if (this.currentGuess.length > 0) {
            const lastIndex = this.currentGuess.length - 1;
            if (!this.locked[lastIndex]) {
                this.currentGuess.pop();
            }
        }
    }

    reset(): void {
        this.currentGuess = [];
    }

    private getNextHintLetter(): string {
        if (this.letterHintsUsed >= this.word.length) {
            throw new Error("No more letter hints!");
        }
        return this.word[this.letterHintsUsed]!; // TS now knows it’s string
    }

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

    render(container: HTMLElement): void {
        container.innerHTML = "";
        for (let i = 0; i < this.word.length; i++) {
            const span = document.createElement("span");
            span.classList.add("letter-slot"); // Set style class for the element to later use css styling
            span.textContent = this.currentGuess[i] ?? "_";
            // Set the actual style later in css, not in here.
            // Set some test styling now for easier testing
            span.style.margin = "0 5px"; // TODO: css file for styling
            span.style.fontSize = "2rem"; // TODO: css file for styling
            span.style.display = "inline-block"; // TODO: css file for styling

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
