import { WordGuess } from "./WordGuess";

/** Keep track of the game progress for one category */
export class GameSession {
    private category: string | null = null; // Will be used to fetch a word from the correct category
    private currentWord: string = "";
    private vocalHintsCounter: number = 0; // Will be used to determine how many syllables to play
    private textHintsCounter: number = 0;
    private textHintUsedForCurrentWord = false;
    private letterHintsCounter: number = 0;
    private guessedWords = new Set<string>();
    private words: string[] = [];
    private incorrectWords: string[] = [];
    private currentWordGuess: WordGuess | null = null;
    private currentWordIndex: number = 0;
    private gameModeRandom: boolean = false;
    private outOfWords: boolean = false;
    private correctAnswers: number = 0;
    private isReplay: boolean = false;

    /** Set a word to be guessed and create a new word guess object based on that */
    constructor(category: string | null) {
        this.category = category;
        // Fetch all the words from this category, for now, use the placeholder words
        this.currentWord = "placeholder";
        this.currentWordGuess = new WordGuess(this.currentWord);
    }

    setCategory(category: string | null): void {
        this.category = category;
    }

    getCategory() {
        return this.category;
    }

    setWords(words: string[]): void {
        this.words = words;
        this.currentWordIndex = 0;
    }

    setIsReplay(isReplay: boolean): void {
        this.isReplay = isReplay;
    }

    getIsReplay(): boolean {
        return this.isReplay;
    }

    getAllWords(): string[] {
        return this.words;
    }

    /** Set the index of the word if user select the word from the list */
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

    getIncorrectlyGuessedWords(): string[] {
        return this.incorrectWords;
    }

    /** Mark the current word as guessed so it won't be shown again */
    private markGuessed(): void {
        this.guessedWords.add(this.currentWord);
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
    getNextWord(): string {
        if (this.gameModeRandom) {
            return this.getNextWordRandom();
        } else {
            return this.getNextWordOrder();
        }
    }

    /** Get the next word (in the order the list defines) to be guessed and create a new WordGuess object */
    getNextWordOrder(): string {
        if (this.currentWord !== "placeholder") {
            this.markGuessed();
        }

        if (this.guessedWords.size === this.words.length - 1) {
            this.outOfWords = true;
        }

        const totalWords = this.words.length;

        // Start by trying the next word in the list (current index + 1)
        let candidateIndex = this.currentWordIndex + 1;

        if (candidateIndex >= totalWords || this.guessedWords.has(this.words[candidateIndex]!)) {
            // Wrap around: check from the start of the list
            candidateIndex = 0;
        }

        // Loop until we find an unguessed word
        while (this.guessedWords.has(this.words[candidateIndex]!)) {
            candidateIndex++;
            if (candidateIndex >= totalWords) {
                candidateIndex = 0; // wrap around
            }
        }

        // Update state
        this.currentWordIndex = candidateIndex;
        this.currentWord = this.words[candidateIndex]!;
        this.currentWordGuess = new WordGuess(this.currentWord);
        this.vocalHintsCounter = 0;

        return this.currentWord;
    }

    /** Get the next word to be guessed but randomly from the list */
    getNextWordRandom(): string {
        // Mark the current one as guessed
        if (this.currentWord !== "placeholder") {
            this.markGuessed();
        }

        // Filter out guessed words
        const remainingWords = this.words.filter((word) => !this.guessedWords.has(word));

        if (this.guessedWords.size === this.words.length - 1) {
            this.outOfWords = true;
        }

        // Pick a random word from the current category
        const randomIndex = Math.floor(Math.random() * remainingWords.length);
        const nextWord = remainingWords[randomIndex]!;

        // Update state
        this.currentWord = nextWord;
        this.currentWordGuess = new WordGuess(nextWord);

        return this.currentWord;
    }
}
