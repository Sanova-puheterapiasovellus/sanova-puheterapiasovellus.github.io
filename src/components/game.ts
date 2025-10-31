import { expectElement } from "../common/dom";
import type {
    CategorySelectedEvent,
    GameOverEvent,
    WordSelectedEvent,
    WordsSelectedEvent,
} from "../common/events";
import { playSyllableSounds } from "../common/playback.ts";
import { getImagePath, wordsData } from "../data/word-data-model.ts";
import { splitToSyllables } from "../utils/syllable-split.ts";
import { GameSession } from "./GameSession";
import "./styles/game.css";
import { setSyllableHintWord } from "./syllablesHint.ts";
import type { WordGuess } from "./WordGuess";
import { showWordGuessResults } from "./wordGuessResults.ts";
import { initializeWordSelector } from "./words.ts";

const guessDialog = expectElement("word-guess-dialog", HTMLDialogElement);
const closeButton = expectElement("word-guess-close", HTMLButtonElement);
const answerButton = expectElement("word-guess-submit", HTMLButtonElement);
const letterHintButton = expectElement("word-guess-letter-hint", HTMLButtonElement);
const textHintButton = expectElement("word-guess-text-hint", HTMLButtonElement);
const syllableHintButton = expectElement("word-guess-syllable-hint", HTMLButtonElement);
const wordImage = expectElement("word-guess-image", HTMLImageElement);
const letterSlots = expectElement("word-guess-slots", HTMLDivElement);
const hiddenInput = document.getElementById("hidden-input") as HTMLInputElement;
const textHint = expectElement("text-hint", HTMLDivElement);

// Keep track of the game progress, initially null
let gameSession: GameSession | null = null;

/** Close the dialog as requested. */
function handleDialogClose(_: Event): void {
    // Set the gameSession null to avoid a situation where the user
    // would select a different category, but the words from previously
    // closed category would appear.
    gameSession = null;
    // Close the guessing dialog
    guessDialog.close();
}

/** Trigger the mobile keyboard */
function focusHiddenInput() {
    hiddenInput.focus();
}

/** Handle the game starting with the selected category. */
function handleGameStart(event: CategorySelectedEvent): void {
    const currentCategory: string = event.detail.name;
    gameSession = new GameSession(currentCategory);
    //initializeWordSelector(currentCategory, gameSession); // Uncomment to make the word view visible

    const category = wordsData.categories.find((c) => c.name === currentCategory);
    if (!category) return;

    // Set the words to the game session object through the WordsSelected event
    dispatchEvent(
        new CustomEvent("words-selected", {
            bubbles: true,
            detail: {
                selections: category.words.map((w, idx) => ({ name: w.name, index: idx })),
                category: currentCategory,
                isReplay: false,
            },
        }),
    );

    gameSession.setGameModeRandom(); // Show words in random order
    const word = gameSession.getNextWord();
    textHint.textContent = "";
    setSyllableHintWord(word);
    // Fake the word selection event
    dispatchEvent(
        new CustomEvent("word-selected", {
            bubbles: true,
            detail: { name: word, index: 0 },
        }),
    );
}

function handleGameOver(event: GameOverEvent) {
    const showResults: boolean = event.detail.showResults;
    guessDialog.close();
    if (showResults) {
        if (gameSession) {
            showWordGuessResults(gameSession);
        }
    }
    gameSession = null;
}

function setImage() {
    if (!gameSession) return;
    const word = gameSession.getCurrentWord();
    const category = gameSession.getCategory();

    let wordData: { name: string; image: string } | undefined;

    if (category) {
        const categoryData = wordsData.categories.find((c) => c.name === category);
        wordData = categoryData?.words.find((w) => w.name === word);
    } else {
        for (const c of wordsData.categories) {
            const found = c.words.find((w) => w.name === word);
            if (found) {
                wordData = found;
                break;
            }
        }
    }

    if (!wordData) return;

    wordImage.alt = wordData.name;
    wordImage.src = getImagePath(wordData.image);
}

/** Handle the word selection, i.e. show the guessing modal for the user */
function handleWordSelected(event: WordSelectedEvent) {
    if (!gameSession) {
        // If gameSession does not exist, then only one word was selected
        gameSession = new GameSession(null);
        const { name } = event.detail;
        gameSession.setWords([name]);
        gameSession.setCurrentWordIndex(0);
        setSyllableHintWord(name);
    }

    if (event.detail.name === null) {
        // No word was set, set it here
        gameSession.setCurrentWordIndex(0);
    }

    guessDialog.showModal();
    setupWordInput();

    setImage();
}

function handleWordsSelected(event: WordsSelectedEvent) {
    const { category, selections, isReplay } = event.detail;
    gameSession = new GameSession(category);
    //if (!gameSession) return;

    gameSession.setIsReplay(isReplay);
    gameSession.setCategory(category);
    gameSession.setWords(selections.map((s) => s.name));
}

/** Renders the empty slots after answering or when initializing the first word */
function setupWordInput() {
    const wordGuess = getGameSession().getCurrentWordGuess();
    wordGuess.render(letterSlots);
    hiddenInput.value = "";
    hiddenInput.focus();
    letterSlots.addEventListener("click", () => hiddenInput.focus());
}

/** Handle the typing events when using both physical keyboard and phone's keyboard */
function handleInputEvent() {
    if (!gameSession) return;

    const wordGuess = gameSession.getCurrentWordGuess();
    const currentWord = gameSession.getCurrentWord();
    const locked = wordGuess.getLockedLettersArray();

    let typed = hiddenInput.value.toUpperCase();

    // Restrict the length of the input word to the length of the word being guessed
    if (typed.length > currentWord.length) {
        typed = typed.slice(0, currentWord.length);
        hiddenInput.value = typed;
    }

    const oldGuess = wordGuess.getGuess();

    if (typed.length < oldGuess.length) {
        // Protect locked (hint) letters
        const oldLetters = oldGuess.split("");
        const newLetters: string[] = [];

        for (let i = 0; i < oldLetters.length; i++) {
            if (locked[i]) {
                newLetters.push(oldLetters[i]!);
            } else {
                if (newLetters.length < typed.length) {
                    newLetters.push(typed[newLetters.length]!);
                }
            }
        }

        wordGuess.setGuessFromString(newLetters.join(""));
        hiddenInput.value = newLetters.join("");

        // Set the mobile cursor to the end of the text after backspace
        setTimeout(() => {
            hiddenInput.setSelectionRange(hiddenInput.value.length, hiddenInput.value.length);
        }, 0);
    } else {
        wordGuess.setGuessFromString(typed);
    }

    wordGuess.render(letterSlots);
}

/** Function that guarantees to return a valid game session object or throw an error */
function getGameSession(): GameSession {
    if (gameSession === null) {
        throw new Error("Game session is not initialized yet!");
    }
    return gameSession;
}

/** Handle the letter hint logic when the letter hint is requested */
function handleUseLetterHint(): void {
    if (!gameSession) return;
    gameSession.useLetterHint();
    const wordGuess = gameSession.getCurrentWordGuess();
    const done = wordGuess.useLetterHint();

    hiddenInput.value = wordGuess.getGuess();
    wordGuess.render(letterSlots);

    if (done) {
        // word completed with hints, move to next word
        handleAnswer(wordGuess);
    }
}

/** Set current word's text hint */
function handleUseTextHint(): void {
    if (!gameSession) return;
    gameSession.useTextHint();

    const currentWord = gameSession.getCurrentWord();
    const currentWordData = wordsData.categories
        .flatMap((category) => category.words)
        .find((word) => word.name === currentWord);

    if (!currentWordData) return;

    textHint.textContent = currentWordData.hint;
}

function handleUseVocalHint(): void {
    if (!gameSession) return;
    gameSession.useVocalHint();
}

/** Check if the user's answer is correct */
function isCorrectAnswer(correctAnswer: string, answer: string): boolean {
    if (correctAnswer === answer) {
        return true;
    }
    return false;
}

/** Handle the user's guess when the answer btn is pressed */
function handleAnswer(wordGuess: WordGuess): void {
    const gameSession: GameSession = getGameSession();

    const answer = wordGuess.getGuess().toLowerCase();
    const correctAnswer: string = wordImage.alt;
    const isCorrect: boolean = isCorrectAnswer(correctAnswer, answer);
    const isGameOver: boolean = gameSession.isGameOver();

    if (isCorrect) {
        gameSession.increaseCorrectCount();
    } else {
        gameSession.saveIncorrectlyGuessed();
    }

    if (isGameOver) {
        let showResults: boolean = gameSession.getAllWords().length > 1;
        const isReplay: boolean = gameSession.getIsReplay();
        if (isReplay) {
            // Always show results if the user is replaying correct words,
            // even if there was only one word replayed
            showResults = true;
        }
        dispatchEvent(
            new CustomEvent("show-results", {
                bubbles: true,
                detail: { showResults: showResults },
            }),
        );
        return;
    }

    const nextWord: string = gameSession.getNextWord();
    textHint.textContent = "";
    setSyllableHintWord(nextWord);
    setImage();

    setupWordInput();
}

/** Wire up events to react to the game being started. */
export function initializeGameContainer() {
    window.addEventListener("category-selected", handleGameStart);
    window.addEventListener("word-selected", handleWordSelected);
    window.addEventListener("words-selected", handleWordsSelected);
    window.addEventListener("show-results", handleGameOver);
    closeButton.addEventListener("click", handleDialogClose);

    answerButton.addEventListener("click", () => {
        if (!gameSession) return;
        const wordGuess = gameSession.getCurrentWordGuess();
        handleAnswer(wordGuess);
    });

    letterHintButton.addEventListener("click", handleUseLetterHint);
    textHintButton.addEventListener("click", handleUseTextHint);
    syllableHintButton.addEventListener("click", handleUseVocalHint);

    hiddenInput.addEventListener("input", handleInputEvent);
}
