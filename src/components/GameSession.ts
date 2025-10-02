import { WordGuess } from "./WordGuess";

/** Keep track of the game progress for one category */
export class GameSession {
    private category: string; // Will be used to fetch a word from the correct category
    private currentWord: string = "";
    private vocalHintsCounter: number = 0; // Will be used to determine how many syllables to play
    private letterHintsCounter: number = 0; // Will be used to determine how many letters to show
    private guessedWords = new Set<string>();
    private placeHolderWords: string[] = ["makkara", "peruna", "kurkkusalaatti"];
    private currentWordGuess: WordGuess | null = null;

    constructor(category: string) {
        this.category = category;
        // Fetch all the words from this category, for now, use the placeholder words
        this.currentWord = this.placeHolderWords[0]!;
        this.currentWordGuess = new WordGuess(this.currentWord);
    }

    getCurrentWord(): string {
        return this.currentWord;
    }

    getCurrentWordGuess(): WordGuess {
        if (!this.currentWordGuess) throw new Error("No current word guess!");
        return this.currentWordGuess;
    }

    getVocalHintsUsed(): number {
        return this.vocalHintsCounter;
    }

    getLetterHintsUsed(): number {
        return this.letterHintsCounter;
    }

    useVocalHint(): void {
        this.vocalHintsCounter++;
    }

    useLetterHint(): void {
        this.letterHintsCounter++;
    }

    private markGuessed(): void {
        this.guessedWords.add(this.currentWord);
    }

    getNextWord(): string {
        this.markGuessed();
        const nextWord = this.placeHolderWords.find((word) => !this.guessedWords.has(word));
        if (nextWord) {
            this.currentWord = nextWord;
            this.currentWordGuess = new WordGuess(nextWord);
        } else {
            this.currentWord = "NoMoreWords";
            this.currentWordGuess = null;
        }
        this.vocalHintsCounter = 0;
        this.letterHintsCounter = 0;
        return this.currentWord;
    }
}
