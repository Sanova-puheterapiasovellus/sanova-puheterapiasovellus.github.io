import type { Category, Word } from "../data/word-data-model";
import { WordGuess } from "./WordGuess";
import { WordGuessStatus } from "./wordStatus";

/** Keep track of the game progress for one category */
export class GameSession {
    private category: Category | null = null; // Will be used to fetch a word from the correct category
    private currentWord: Word | null;

    private vocalHintsCounter: number = 0;
    private textHintsCounter: number = 0;
    private textHintUsedForCurrentWord = false;
    private letterHintsCounter: number = 0;

    private gameModeRandom: boolean = false;
    private outOfWords: boolean = false;
    private isReplay: boolean = false;

    private currentWordGuess: WordGuess | null = null;
    private wordGuessList: WordGuess[] = [];
    private wordGuessIndex: number = 0;

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
    }

    resetVocalHints(): void {
        this.vocalHintsCounter = 0;
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
            if (wordGuess.getStatus() === WordGuessStatus.GUESS_CORRECT) {
                correctCount++;
            }
        }
        return correctCount;
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
        this.currentWordGuess?.updateStatus(WordGuessStatus.GUESS_INCORRECT);
    }

    markHintUsed(): void {
        this.currentWordGuess?.updateStatus(WordGuessStatus.USED_HINT);
    }

    getIncorrectlyGuessedWords(): Word[] {
        const wordList: Word[] = [];
        // Count as incorrect:
        //  - Words where the user used any hint
        //  - Words that were actually incorrect
        //  - words that were skipped
        for (const wordGuess of this.wordGuessList) {
            if (wordGuess.getStatus() !== WordGuessStatus.GUESS_CORRECT) {
                wordList.push(wordGuess.getWordObject());
            }
        }
        return wordList;
    }

    /** Mark the current word as guessed so it won't be shown again */
    markCurrentCorrect(): void {
        this.currentWordGuess?.updateStatus(WordGuessStatus.GUESS_CORRECT);
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
}
