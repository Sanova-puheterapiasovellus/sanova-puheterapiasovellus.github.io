/** Keeps track of the guessed letters of a single word, renders the typed letters*/
export class WordGuess {
    private word: string;
    private currentGuess: string[] = [];

    constructor(word: string) {
        this.word = word.toUpperCase();
        this.currentGuess = [];
    }

    getWord(): string {
        return this.word;
    }

    getGuess(): string {
        return this.currentGuess.join("");
    }

    addLetter(letter: string): void {
        if (this.currentGuess.length < this.word.length) {
            this.currentGuess.push(letter.toUpperCase());
        }
    }

    removeAllLetters(): void {
        this.currentGuess = [];
    }

    removeLetter(): void {
        this.currentGuess.pop();
    }

    reset(): void {
        this.currentGuess = [];
    }

    render(container: HTMLElement): void {
        container.innerHTML = "";
        for (let i = 0; i < this.word.length; i++) {
            const span = document.createElement("span");
            span.classList.add("letter-slot"); // Set style class for the element to later use css styling
            span.textContent = this.currentGuess[i] ?? "_";
            // Set the actual style later in css, not in here.
            // Set some test styling now for easier testing
            span.style.margin = "0 5px";
            span.style.fontSize = "2rem";
            span.style.display = "inline-block";
            container.appendChild(span);
        }
    }
}
