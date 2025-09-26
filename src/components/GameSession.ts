/** Keep track of the game progress for one category */
export class GameSession {
    private category: string; // Will be used to fetch a word from the correct category
    private currentWord: string = "";
    private vocalHintsCounter: number = 0; // Will be used to determine how many syllables to play
    private letterHintsCounter: number = 0; // Will be used to determine how many letters to show
    private guessedWords = new Set<string>();
    private placeHolderWords: string[] = ["makkara", "peruna", "kurkkusalaatti"];

    constructor(category: string) {
        this.category = category;
        // Fetch all the words from this category, for now, use the placeholder words
        this.currentWord = this.placeHolderWords[0]!;
    }

    getCurrentWord(): string {
        return this.currentWord;
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

    markGuessed(): void {
        this.guessedWords.add(this.currentWord);
    }

    getNextWord(): string {
        this.markGuessed();
        const nextWord = this.placeHolderWords.find((word) => !this.guessedWords.has(word));
        if (nextWord) {
            this.currentWord = nextWord;
        } else {
            // No more words, handle logic
            this.currentWord = "NoMoreWords";
        }
        this.vocalHintsCounter = 0;
        this.letterHintsCounter = 0;
        return this.currentWord;
    }
}
