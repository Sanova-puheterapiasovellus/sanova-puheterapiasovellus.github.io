import { WordGuess } from "./WordGuess";

/** Keep track of the game progress for one category */
export class GameSession {
    private category: string; // Will be used to fetch a word from the correct category
    private currentWord: string = "";
    private vocalHintsCounter: number = 0; // Will be used to determine how many syllables to play
    private guessedWords = new Set<string>();
    private words: string[] = [];
    private currentWordGuess: WordGuess | null = null;
    private currentWordIndex: number = 0;

    /** Set a word to be guessed and create a new word guess object based on that */
    constructor(category: string) {
        this.category = category;
        // Fetch all the words from this category, for now, use the placeholder words
        this.currentWord = "placeholder";
        this.currentWordGuess = new WordGuess(this.currentWord);
    }

    setCategory(category: string) {
        this.category = category;
    }

    setWords(words: string[]) {
        this.words = words;
        this.currentWordIndex = 0;
    }

    setCurrentWordIndex(index: number) {
        this.currentWordIndex = index;
        this.currentWord = this.words[index]!;
        this.currentWordGuess = new WordGuess(this.currentWord);
    }

    /** Get the word that is being guessed at the moment */
    getCurrentWord(): string {
        return this.currentWord;
    }

    /** Get the WordGuess object for the current word */
    getCurrentWordGuess(): WordGuess {
        if (!this.currentWordGuess) throw new Error("No current word guess!");
        return this.currentWordGuess;
    }

    getVocalHintsUsed(): number {
        return this.vocalHintsCounter;
    }

    useVocalHint(): void {
        this.vocalHintsCounter++;
    }

    /** Mark the current word as guessed so it won't be shown again */
    private markGuessed(): void {
        this.guessedWords.add(this.currentWord);
    }

    /** Get the next word to be guessed and create a new WordGuess object */
    getNextWord(): string {
        this.markGuessed();
        const nextWord = this.words.find((word) => !this.guessedWords.has(word));
        if (nextWord) {
            this.currentWord = nextWord;
            this.currentWordGuess = new WordGuess(nextWord);
        } else {
            this.currentWord = "NoMoreWords";
            this.currentWordGuess = null;
        }
        this.vocalHintsCounter = 0;
        return this.currentWord;
    }
}
