import type { Category, Word } from "../data/word-data-model";
import { WordGuess } from "./WordGuess";

/** Keep track of the game progress for one category */
export class GameSession {
    private category: Category | null = null; // Will be used to fetch a word from the correct category
    private currentWord: Word;
    private vocalHintsCounter: number = 0; // Will be used to determine how many syllables to play
    private textHintsCounter: number = 0;
    private letterHintsCounter: number = 0;
    private guessedWords = new Set<string>();
    private words: Word[] = [];
    private incorrectWords: Word[] = [];
    private currentWordGuess: WordGuess | null = null;
    private currentWordIndex: number = 0;
    private gameModeRandom: boolean = false;
    private outOfWords: boolean = false;
    private correctAnswers: number = 0;
    private isReplay: boolean = false;

    /** Set a word to be guessed and create a new word guess object based on that */
    constructor(category: Category | null) {
        this.category = category;
        // Fetch all the words from this category, for now, use the placeholder words
        this.currentWord = {
            name: "placeholder",
            image: "question.png",
            image_credit: "",
            hint: "",
        };
        this.currentWordGuess = new WordGuess(this.currentWord.name);
    }

    setCategory(category: Category | null): void {
        this.category = category;
    }

    getCategory(): Category | null {
        return this.category;
    }

    setWords(words: Word[]): void {
        this.words = words;
        this.currentWordIndex = 0;
    }

    setIsReplay(isReplay: boolean): void {
        this.isReplay = isReplay;
    }

    getIsReplay(): boolean {
        return this.isReplay;
    }

    getAllWords(): Word[] {
        return this.words;
    }

    /** Set the index of the word if user select the word from the list */
    setCurrentWordIndex(index: number): void {
        this.currentWordIndex = index;
        this.currentWord = this.words[index]!;
        this.currentWordGuess = new WordGuess(this.currentWord.name);
    }

    /** Get the word that is being guessed at the moment */
    getCurrentWord(): Word {
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

    getTextHintsUsed(): number {
        return this.textHintsCounter;
    }

    useTextHint(): void {
        this.textHintsCounter++;
    }

    getLetterHintsUsed(): number {
        return this.letterHintsCounter;
    }

    useLetterHint(): void {
        this.letterHintsCounter++;
    }

    getCorrectAnswerCount(): number {
        return this.correctAnswers;
    }

    getTotalWordCount(): number {
        return this.words.length;
    }

    saveIncorrectlyGuessed(): void {
        this.incorrectWords.push(this.currentWord);
    }

    getIncorrectlyGuessedWords(): Word[] {
        return this.incorrectWords;
    }

    /** Mark the current word as guessed so it won't be shown again */
    private markGuessed(): void {
        this.guessedWords.add(this.currentWord.name);
    }

    setGameModeRandom(): void {
        this.gameModeRandom = true;
    }

    /** Check if game is over, i.e. are there any more words to be guessed */
    isGameOver(): boolean {
        if (this.words.length === 1) {
            // Game will always be considered over if the user
            // has only selected one word. This way the game ends
            // as soon as the user answers correctly
            return true;
        }
        if (this.outOfWords) {
            return true;
        } else {
            return false;
        }
    }

    increaseCorrectCount(): void {
        this.correctAnswers++;
    }

    /** Get the amount of guessed words */
    getGuessedWordCount(): number {
        return this.guessedWords.size;
    }

    /** Get the next word to be guessed. Return random word from the category
     * or the next one in the list depending on the game mode.
     */
    getNextWord(): Word {
        if (this.gameModeRandom) {
            return this.getNextWordRandom();
        } else {
            return this.getNextWordOrder();
        }
    }

    /** Get the next word (in the order the list defines) to be guessed and create a new WordGuess object */
    getNextWordOrder(): Word {
        if (this.currentWord.name !== "placeholder") {
            this.markGuessed();
        }

        if (this.guessedWords.size === this.words.length - 1) {
            this.outOfWords = true;
        }

        const totalWords = this.words.length;

        // Start by trying the next word in the list (current index + 1)
        let candidateIndex = this.currentWordIndex + 1;
        if (
            candidateIndex >= totalWords ||
            this.guessedWords.has(this.words[candidateIndex]!.name)
        ) {
            // Wrap around: check from the start of the list
            candidateIndex = 0;
        }

        // Loop until we find an unguessed word
        while (this.guessedWords.has(this.words[candidateIndex]!.name)) {
            candidateIndex++;
            if (candidateIndex >= totalWords) {
                candidateIndex = 0; // wrap around
            }
        }

        // Update state
        this.currentWordIndex = candidateIndex;
        this.currentWord = this.words[candidateIndex]!;
        this.currentWordGuess = new WordGuess(this.currentWord.name);
        this.vocalHintsCounter = 0;

        return this.currentWord;
    }

    /** Get the next word to be guessed but randomly from the list */
    getNextWordRandom(): Word {
        // Mark the current one as guessed
        if (this.currentWord.name !== "placeholder") {
            this.markGuessed();
        }

        // Filter out guessed words
        const remainingWords = this.words.filter((word) => !this.guessedWords.has(word.name));

        if (this.guessedWords.size === this.words.length - 1) {
            this.outOfWords = true;
        }

        // Pick a random word from the current category
        const randomIndex = Math.floor(Math.random() * remainingWords.length);
        const nextWord = remainingWords[randomIndex]!;

        // Update state
        this.currentWord = nextWord;
        this.currentWordGuess = new WordGuess(this.currentWord.name);

        return this.currentWord;
    }
}
