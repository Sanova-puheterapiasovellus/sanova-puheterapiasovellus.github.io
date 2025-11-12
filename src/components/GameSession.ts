import type { Category, Word } from "../data/word-data-model";
import { WordGuess } from "./WordGuess";
import type { WordGuessStatus } from "./wordStatus";

/** Keep track of the game progress for one category */
export class GameSession {
    private category: Category | null = null; // Will be used to fetch a word from the correct category
    private currentWord: Word | null;

    private vocalHintsCounter: number = 0;
    private textHintsCounter: number = 0;
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

    getTextHintsUsed(): number {
        return this.textHintsCounter;
    }

    useTextHint(): void {
        this.textHintsCounter++;
        this.currentWordGuess?.setHintsUsed();
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
            if (wordGuess.getStatus() === "guess-correct") {
                correctCount++;
            }
        }
        return correctCount;
    }

    getTotalWordCount(): number {
        return this.wordGuessList.length;
    }

    markIncorrectlyGuessed(): void {
        const newStatus: WordGuessStatus = "guess-incorrect";
        this.currentWordGuess?.updateStatus(newStatus);
    }

    markHintUsed(): void {
        const newStatus: WordGuessStatus = "used-hint";
        this.currentWordGuess?.updateStatus(newStatus);
    }

    // MUOKKAA NIIN, ETTÄ PALAUTTAA WORD listan
    getIncorrectlyGuessedWords(): Word[] {
        const wordList: Word[] = [];
        // Count as incorrect:
        //  - Words where the user used any hint
        //  - Words that were actually incorrect
        //  - words that were skipped
        for (const wordGuess of this.wordGuessList) {
            if (wordGuess.getStatus() !== "guess-correct") {
                wordList.push(wordGuess.getWordObject()!);
            }
        }
        return wordList;
    }

    /** Mark the current word as guessed so it won't be shown again */
    markCurrentCorrect(): void {
        const newStatus: WordGuessStatus = "guess-correct";
        this.currentWordGuess?.updateStatus(newStatus);
    }

    markCurrentSkipped(): void {
        const newStatus: WordGuessStatus = "skipped";
        this.currentWordGuess?.updateStatus(newStatus);
    }

    setGameModeRandom(): void {
        this.gameModeRandom = true;
    }

    private getUnguessedCount(): number {
        let count: number = 0;
        for (const wordGuess of this.wordGuessList) {
            if (wordGuess.getStatus() === "not-guessed") {
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
            if (wordGuess.getStatus() !== "not-guessed") {
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
    // PITÄÄ PALAUTTAA WORD
    getNextWordOrder(): Word {
        const totalWords = this.getTotalWordCount();
        const guessedWordsCount = totalWords - this.getUnguessedCount();

        if (guessedWordsCount === totalWords - 1) {
            this.outOfWords = true;
        }
        this.wordGuessIndex++;
        this.currentWordGuess = this.wordGuessList[this.wordGuessIndex]!;
        this.vocalHintsCounter = 0;
        this.currentWord = this.currentWordGuess.getWordObject()!;
        return this.currentWord;
    }

    /** Get the next word to be guessed but randomly from the list */
    // PITÄÄ PALAUTTAA WORD
    getNextWordRandom(): Word {
        // Filter out guessed words
        const notGuessed = this.wordGuessList.filter((wg) => wg.getStatus() === "not-guessed");

        const totalWords = this.getTotalWordCount();
        const guessedWordsCount = totalWords - this.getUnguessedCount();

        if (guessedWordsCount === totalWords - 1) {
            this.outOfWords = true;
        }

        const randomIndex = Math.floor(Math.random() * notGuessed.length);
        const randomWordGuess = notGuessed[randomIndex]!;
        this.currentWordGuess = randomWordGuess;
        this.currentWord = this.currentWordGuess.getWordObject()!;
        return this.currentWord;
    }
}
