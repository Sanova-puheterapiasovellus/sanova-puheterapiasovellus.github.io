import type { Category, Word } from "../data/word-data-model";
import { WordGuess } from "./WordGuess";
import { WordGuessStatus } from "./wordStatus";

/** Keep track of the game progress for one category */
export class GameSession {
    private category: Category | null = null; // Will be used to fetch a word from the correct category
    private currentWord: Word | null;

    private textHintsCounter: number = 0;
    private textHintUsedForCurrentWord = false;
    private vocalHintsCounter: number = 0;
    private vocalHintsUsedForCurrentWord: number = 0;
    private letterHintsCounter: number = 0;

    private gameModeRandom: boolean = false;
    private outOfWords: boolean = false;
    private isReplay: boolean = false;

    private currentWordGuess: WordGuess | null = null;
    private wordGuessList: WordGuess[] = [];
    private wordGuessIndex: number = 0;

    private playedFullSyllablesOnce: boolean = false;
    private lastHintWord: string = "";

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
        this.currentWordGuess = new WordGuess(this.currentWord);
    }

    setCategory(category: Category | null): void {
        this.category = category;
    }

    getCategory(): Category | null {
        return this.category;
    }

    setWords(words: Word[]): void {
        for (const word of words) {
            this.wordGuessList.push(new WordGuess(word));
        }
    }

    setIsReplay(isReplay: boolean): void {
        this.isReplay = isReplay;
    }

    getIsReplay(): boolean {
        return this.isReplay;
    }

    /** Set the index of the word if user select the word from the list */
    setCurrentWordIndex(index: number) {
        this.wordGuessIndex = index;
        this.currentWordGuess = this.wordGuessList[index]!;
        this.currentWord = this.currentWordGuess.getWordObject();
    }

    /** Get the word that is being guessed at the moment */
    getCurrentWord(): Word {
        return this.currentWord!;
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
        this.currentWordGuess?.setHintsUsed();
        this.vocalHintsUsedForCurrentWord++;
    }

    getVocalHintsUsedForCurrentWord(): number {
        return this.vocalHintsUsedForCurrentWord;
    }

    resetVocalHints(): void {
        this.vocalHintsUsedForCurrentWord = 0;
    }

    getTextHintsUsed(): number {
        return this.textHintsCounter;
    }

    useTextHint(): void {
        if (!this.textHintUsedForCurrentWord) {
            this.textHintsCounter++;
            this.textHintUsedForCurrentWord = true;
            this.currentWordGuess?.setHintsUsed();
        }
    }

    resetTextHintFlag(): void {
        this.textHintUsedForCurrentWord = false;
    }

    hasUsedTextHint(): boolean {
        return this.textHintUsedForCurrentWord;
    }

    getLetterHintsUsed(): number {
        return this.letterHintsCounter;
    }

    useLetterHint(): void {
        this.letterHintsCounter++;
        this.currentWordGuess?.setHintsUsed();
    }

    getCorrectAnswerCount(): number {
        let correctCount: number = 0;
        for (const wordGuess of this.wordGuessList) {
            if (wordGuess.getStatus() === WordGuessStatus.CORRECT) {
                correctCount++;
            }
        }
        return correctCount;
    }

    getWordGuessesPerStatus(): Partial<Record<WordGuessStatus, WordGuess[]>> {
        return Object.groupBy(this.wordGuessList, (wg) => wg.getStatus());
    }

    /**
     * Groups all guessed words by their WordGuessStatus.
     *
     * @returns {Partial<Record<WordGuessStatus, Word[]>>}
     * An object whose keys are WordGuessStatus values,
     * and whose values are arrays of Word objects.
     *
     * Example return value:
     * {
     *   [WordGuessStatus.CORRECT]: [
     *     { name: "apple", image: "apple.png", hint: "A fruit", ... },
     *     { name: "cat", image: "cat.png", hint: "An animal", ... }
     *   ],
     *   [WordGuessStatus.CORRECT_USED_HINT]: [
     *     { name: "banana", image: "banana.png", hint: "Yellow", ... }
     *   ],
     *   (...)
     * }
     */
    getWordsPerStatus(): Partial<Record<WordGuessStatus, Word[]>> {
        const groups: Partial<Record<WordGuessStatus, Word[]>> = {};
        for (const wg of this.wordGuessList) {
            const status = wg.getStatus();
            const word = wg.getWordObject();
            if (!groups[status]) {
                groups[status] = [];
            }
            groups[status].push(word);
        }
        return groups;
    }

    /**
     * @returns {number} The count of words that were guessed correctly after using any hints
     */
    getCorrectWithHintsCount(): number {
        return this.wordGuessList.filter((wg) => {
            const hintUsed = wg.getHintsUsed();
            const eventuallyCorrect =
                wg.getStatus() !== WordGuessStatus.NOT_GUESSED &&
                wg.getStatus() !== WordGuessStatus.SKIPPED &&
                wg.getStatus() !== WordGuessStatus.INCORRECT;
            return hintUsed && eventuallyCorrect;
        }).length;
    }

    getCountByStatus(status: WordGuessStatus): number {
        let count: number = 0;
        for (const wordGuess of this.wordGuessList) {
            if (wordGuess.getStatus() === status) {
                count++;
            }
        }
        return count;
    }

    getTotalWordCount(): number {
        return this.wordGuessList.length;
    }

    markIncorrectlyGuessed(): void {
        this.currentWordGuess?.updateStatus(WordGuessStatus.INCORRECT);
    }

    markHintUsed(): void {
        this.currentWordGuess?.updateStatus(WordGuessStatus.CORRECT_USED_HINT);
    }

    /** Mark the current word as guessed so it won't be shown again */
    markCurrentCorrect(): void {
        this.currentWordGuess?.updateStatus(WordGuessStatus.CORRECT);
    }

    markCurrentSkipped(): void {
        this.currentWordGuess?.updateStatus(WordGuessStatus.SKIPPED);
    }

    setGameModeRandom(): void {
        this.gameModeRandom = true;
    }

    private getUnguessedCount(): number {
        let count: number = 0;
        for (const wordGuess of this.wordGuessList) {
            if (wordGuess.getStatus() === WordGuessStatus.NOT_GUESSED) {
                count++;
            }
        }
        return count;
    }

    /** Check if game is over, i.e. are there any more words to be guessed */
    isGameOver(): boolean {
        if (this.getUnguessedCount() === 1) {
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

    /** Get the amount of guessed words, no matter if guessed correctly or not
     * so the amount of words shown for the user in this game.
     */
    getGuessedWordCount(): number {
        let guessedCount: number = 0;
        for (const wordGuess of this.wordGuessList) {
            if (wordGuess.getStatus() !== WordGuessStatus.NOT_GUESSED) {
                guessedCount++;
            }
        }
        return guessedCount;
        ///return this.guessedWords.size;
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
        const totalWords = this.getTotalWordCount();
        const guessedWordsCount = totalWords - this.getUnguessedCount();

        if (guessedWordsCount === totalWords - 1) {
            this.outOfWords = true;
        }
        this.wordGuessIndex++;
        this.currentWordGuess = this.wordGuessList[this.wordGuessIndex]!;
        this.currentWord = this.currentWordGuess.getWordObject();
        return this.currentWord;
    }

    /** Get the next word to be guessed but randomly from the list */
    getNextWordRandom(): Word {
        // Filter out guessed words
        const notGuessed = this.wordGuessList.filter(
            (wg) => wg.getStatus() === WordGuessStatus.NOT_GUESSED,
        );

        const totalWords = this.getTotalWordCount();
        const guessedWordsCount = totalWords - this.getUnguessedCount();

        if (guessedWordsCount === totalWords - 1) {
            this.outOfWords = true;
        }

        const randomIndex = Math.floor(Math.random() * notGuessed.length);
        const randomWordGuess = notGuessed[randomIndex]!;
        this.currentWordGuess = randomWordGuess;
        this.currentWord = this.currentWordGuess.getWordObject();
        return this.currentWord;
    }

    getPlayedFullSyllablesOnce(): boolean {
        return this.playedFullSyllablesOnce;
    }
    setPlayedFullSyllablesOnce(value: boolean) {
        this.playedFullSyllablesOnce = value;
    }

    getLastHintWord(): string {
        return this.lastHintWord;
    }
    setLastHintWord(word: string) {
        this.lastHintWord = word;
    }
}
