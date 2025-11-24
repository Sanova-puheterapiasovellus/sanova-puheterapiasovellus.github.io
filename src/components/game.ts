import { expectElement } from "../common/dom";
import type {
    CategorySelectedEvent,
    GameOverEvent,
    GameResults,
    WordSelectedEvent,
    WordsSelectedEvent,
} from "../common/events";
import {
    dispatchGameOver,
    dispatchWordSelection,
    dispatchWordsSelection,
} from "../common/events.ts";
import { type Category, getImagePath, type Word, wordsData } from "../data/word-data-model.ts";
import { GameSession } from "./GameSession";
import "./styles/game.css";
import { lockPageScroll, unlockPageScroll } from "../common/preventScroll.ts";
import { showCreditsModal } from "./imageCredits.ts";
import { setSyllableHintWord } from "./syllablesHint.ts";
import type { WordGuess } from "./WordGuess";
import { showWordGuessResults } from "./wordGuessResults.ts";
import { WordGuessStatus } from "./wordStatus.ts";

const guessDialog = expectElement("word-guess-dialog", HTMLDialogElement);
const guessCard = expectElement("word-guess-card", HTMLDivElement);
const closeButton = expectElement("word-guess-close", HTMLButtonElement);
const answerButton = expectElement("word-guess-submit", HTMLButtonElement);
const letterHintButton = expectElement("word-guess-letter-hint", HTMLButtonElement);
const textHintDetails = expectElement("word-guess-text-hint", HTMLDetailsElement);
const syllableHintButton = expectElement("word-guess-syllable-hint", HTMLButtonElement);
const wordImage = expectElement("word-guess-image", HTMLImageElement);
const letterSlots = expectElement("word-guess-slots", HTMLDivElement);
const hiddenInput = document.getElementById("hidden-input") as HTMLInputElement;
const textHint = expectElement("text-hint", HTMLDivElement);
const guessProgressCounter = expectElement("word-guess-progress-counter", HTMLDivElement);
const imageCreditsButton = expectElement("word-guess-image-credits-button", HTMLElement);
const skipButton = expectElement("next-btn", HTMLButtonElement);

// Keep track of the game progress, initially null
export let gameSession: GameSession | null = null;

/** Close the dialog as requested. */
function handleDialogClose(_: Event): void {
    // Set the gameSession null to avoid a situation where the user
    // would select a different category, but the words from previously
    // closed category would appear.
    gameSession = null;
    // Close the guessing dialog
    unlockPageScroll();
    guessDialog.close();
}

/** Trigger the mobile keyboard */
function focusHiddenInput(): void {
    hiddenInput.focus();
}

/** Handle the game starting with the selected category. */
function handleGameStart(event: CategorySelectedEvent): void {
    const currentCategory: Category = event.detail.category;
    let selections: Array<{ word: Word; index: number }> = [];
    let categoryForSession: Category | null = null;

    if (currentCategory.name === "random") {
        const allWords = wordsData.categories.flatMap((c) =>
            c.words.map((w, idx) => ({ word: w, index: idx })),
        );
        selections = pickRandom(allWords, 10);
    } else {
        selections = currentCategory.words.map((w, idx) => ({ word: w, index: idx }));
        categoryForSession = currentCategory;
    }

    gameSession = new GameSession(categoryForSession);
    // Set the words to the game session object through the WordsSelected event
    dispatchWordsSelection(
        window,
        selections,
        currentCategory.name === "random" ? null : currentCategory,
        false,
    );

    gameSession.setGameModeRandom(); // Show words in random order
    const word = gameSession.getNextWord();
    textHint.textContent = "";
    setSyllableHintWord(word.name);

    dispatchWordSelection(window, word, 0);
}
/** Helper function to pick random words */
function pickRandom<T>(array: T[], count: number): T[] {
    return [...array].sort(() => Math.random() - 0.5).slice(0, count);
}
function handleGameOver(event: GameOverEvent) {
    const showResults: boolean = event.detail.showResults;
    guessDialog.close();
    if (showResults) {
        if (gameSession) {
            showWordGuessResults(gameSession);
        }
    } else {
        unlockPageScroll();
    }
    gameSession = null;
}

/** Show the image that should be guessed */
function setImage(): void {
    if (!gameSession) return;

    const word = gameSession.getCurrentWord();
    const newSrc = getImagePath(word.image);

    // Hide current image immediately
    wordImage.style.opacity = "0";

    const img = new Image();
    img.src = newSrc;

    img.onload = () => {
        wordImage.src = newSrc;
        wordImage.alt = word.name;

        // Fade in smoothly
        requestAnimationFrame(() => {
            wordImage.style.opacity = "1";
        });
    };
}

function updateGameProgressCounter(): void {
    if (gameSession) {
        guessProgressCounter.textContent = `${gameSession.getGuessedWordCount() + 1}/${gameSession.getTotalWordCount()}`;
    }
}

/** Handle the word selection, i.e. show the guessing modal for the user */
function handleWordSelected(event: WordSelectedEvent): void {
    if (!gameSession) {
        // If gameSession does not exist, then only one word was selected
        gameSession = new GameSession(null);
        const { word } = event.detail;
        gameSession.setWords([word]);
        gameSession.setCurrentWordIndex(0);
    }

    if (event.detail.word === null) {
        // No word was set, set it here
        gameSession.setCurrentWordIndex(0);
    }

    setSyllableHintWord(gameSession.getCurrentWord().name);

    guessDialog.showModal();
    guessCard.scrollTop = 0; //reset scroll position of game to top when game opens
    lockPageScroll();
    textHint.textContent = "";
    updateGameProgressCounter();
    setupWordInput();

    setImage();
}

function handleWordsSelected(event: WordsSelectedEvent): void {
    const { category, selections, isReplay } = event.detail;
    gameSession = new GameSession(category);
    //if (!gameSession) return;

    gameSession.setIsReplay(isReplay);
    gameSession.setCategory(category);
    gameSession.setWords(selections.map((s) => s.word));
}

/** Return true if mobile device, else false.
 *  This is based on detecting touch points that mobile
 *  devices have.
 */
function isMobile(): boolean {
    const hasCoarsePointer = matchMedia("(pointer: coarse)").matches;
    const maxTouchPoints = navigator.maxTouchPoints > 0;

    return hasCoarsePointer && maxTouchPoints;
}

/** Renders the empty slots after answering or when initializing the first word */
function setupWordInput(): void {
    const wordGuess = getGameSession().getCurrentWordGuess();
    wordGuess.render(letterSlots);
    hiddenInput.value = "";
    letterSlots.addEventListener("click", () => hiddenInput.focus());
    if (!isMobile()) {
        // Only focus if not using mobile device
        hiddenInput.focus();
    }
}

/** Handle the typing events when using both physical keyboard and phone's keyboard */
function handleInputEvent(): void {
    if (!gameSession) return;

    const wordGuess = gameSession.getCurrentWordGuess();
    const currentWord = gameSession.getCurrentWord();
    const locked = wordGuess.getLockedLettersArray();

    let typed = hiddenInput.value.toUpperCase();

    // Restrict the length of the input word to the length of the word being guessed
    if (typed.length > currentWord.name.length) {
        typed = typed.slice(0, currentWord.name.length);
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
    if (!isMobile()) {
        // Focus back to input from the button. Do not do this
        // if using mobile device since this will pop the
        // keyboard.
        hiddenInput.focus();
    }
}

/** Set current word's text hint */
function handleUseTextHint(): void {
    if (!gameSession) return;
    if (textHintDetails.open) {
        gameSession.useTextHint();
    }

    const currentWord = gameSession.getCurrentWord();

    textHint.textContent = currentWord.hint;
    if (!isMobile()) {
        // Focus back to input from the button. Do not do this
        // if using mobile device since this will pop the
        // keyboard.
        hiddenInput.focus();
    }
}

function handleUseVocalHint(): void {
    if (!gameSession) return;
    gameSession.useVocalHint();
    // Focus back to input from the button
    if (!isMobile()) {
        // Focus back to input from the button. Do not do this
        // if using mobile device since this will pop the
        // keyboard.
        hiddenInput.focus();
    }
}

/** Check if the user's answer is correct */
function isCorrectAnswer(correctAnswer: string, answer: string): boolean {
    if (correctAnswer === answer) {
        return true;
    }
    return false;
}

function setButtonsEnabled(enabled: boolean): void {
    answerButton.disabled = !enabled;
    letterHintButton.disabled = !enabled;
    syllableHintButton.disabled = !enabled;
    skipButton.disabled = !enabled;

    setDetailsEnabled(enabled);
}

let detailsEnabled = true;
function setDetailsEnabled(enabled: boolean): void {
    detailsEnabled = enabled;
    const summary = textHintDetails.querySelector("summary");
    if (!summary) return;
    summary.style.cursor = "pointer";
    textHintDetails.addEventListener("click", (e) => {
        if (!detailsEnabled) e.preventDefault();
    });
}

function getGameResults(gameSession: GameSession): GameResults {
    const gameResults: GameResults = {
        correctAnswers: gameSession.getCountByStatus(WordGuessStatus.CORRECT),
        incorrectAnswers: gameSession.getCountByStatus(WordGuessStatus.INCORRECT),
        skippedWords: gameSession.getCountByStatus(WordGuessStatus.SKIPPED),
        wordsSolvedUsingHints: gameSession.getCountByStatus(WordGuessStatus.CORRECT_USED_HINT),
        totalWords: gameSession.getTotalWordCount(),
        totalVocalHintsUsed: gameSession.getVocalHintsUsed(),
        totalTextHintsUsed: gameSession.getTextHintsUsed(),
        totalLetterHintsUsed: gameSession.getLetterHintsUsed(),
    };
    return gameResults;
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function resetTextHint() {
    if (textHintDetails) textHintDetails.open = false;
    gameSession?.resetTextHintFlag();
}

async function handleSkipWord(): Promise<void> {
    if (!gameSession) return;
    const isGameOver: boolean = gameSession.isGameOver();
    gameSession.markCurrentSkipped();

    // Style the card to indicate skipping
    guessCard.classList.add("skip");

    await delayBeforeNextWord();

    if (isGameOver) {
        processGameOver(gameSession);
        return;
    }

    const nextWord: Word = gameSession.getNextWord();
    textHint.textContent = "";
    resetTextHint();
    gameSession.resetVocalHints();
    updateGameProgressCounter();
    setSyllableHintWord(nextWord.name);
    setImage();

    setupWordInput();
}

/** Handle the user's guess when the answer btn is pressed */
async function handleAnswer(wordGuess: WordGuess) {
    const gameSession: GameSession = getGameSession();

    const answer = wordGuess.getGuess().toLowerCase();
    const correctAnswer: string = wordImage.alt;

    // Check if the answer is the correct length (cannot submit empty word for example)
    if (answer.length < correctAnswer.length) {
        // Indicate the user about invalid answer. The user can answer
        // again with a correct length word.
        guessCard.classList.add("shake");
        // Non-blocking timeout to remove the shake class
        setTimeout(() => {
            guessCard.classList.remove("shake");
        }, 400);
        return;
    }

    const isCorrect: boolean = isCorrectAnswer(correctAnswer, answer);
    const isGameOver: boolean = gameSession.isGameOver();

    if (isCorrect) {
        const usedAnyHints: boolean = gameSession.getCurrentWordGuess().getHintsUsed();
        if (usedAnyHints) {
            gameSession.markHintUsed();
        } else {
            gameSession.markCurrentCorrect();
        }
        guessCard.classList.add("correct");
    } else {
        gameSession.markIncorrectlyGuessed();
        guessCard.classList.add("wrong");
    }

    await delayBeforeNextWord();

    if (isGameOver) {
        processGameOver(gameSession);
        return;
    }

    const nextWord = gameSession.getNextWord();
    textHint.textContent = "";
    gameSession.resetVocalHints();
    updateGameProgressCounter();
    resetTextHint();
    setSyllableHintWord(nextWord.name);
    setImage();

    setupWordInput();
}

async function delayBeforeNextWord(): Promise<void> {
    // Set buttons disabled during the delay
    setButtonsEnabled(false);
    await delay(1000);
    setButtonsEnabled(true);

    // Remove the indication of correct/wrong/skipped answer before moving to the next card
    guessCard.classList.remove("correct", "wrong", "skip");
}

function processGameOver(gameSession: GameSession) {
    let showResults: boolean = gameSession.getTotalWordCount() > 1;
    const isReplay: boolean = gameSession.getIsReplay();
    if (isReplay) {
        // Always show results if the user is replaying correct words,
        // even if there was only one word replayed
        showResults = true;
    }
    dispatchGameOver(window, showResults, getGameResults(gameSession));
}

function handleImageCredits(): void {
    if (!gameSession) return;

    const currentWord = gameSession.getCurrentWord();

    showCreditsModal(currentWord.image_credit);
}

function moveCursorToEnd(input: HTMLInputElement) {
    const length = input.value.length;
    input.setSelectionRange(length, length);
}

/** Wire up events to react to the game being started. */
export function initializeGameContainer(): void {
    window.addEventListener("category-selected", handleGameStart);
    window.addEventListener("word-selected", handleWordSelected);
    window.addEventListener("words-selected", handleWordsSelected);
    window.addEventListener("show-results", handleGameOver);
    closeButton.addEventListener("click", handleDialogClose);

    answerButton.addEventListener("click", () => {
        if (!gameSession) return;
        const wordGuess = gameSession.getCurrentWordGuess();
        handleAnswer(wordGuess);
        // Focus back to input from the button
        if (!isMobile()) {
            // Focus back to input from the button. Do not do this
            // if using mobile device since this will pop the
            // keyboard.
            hiddenInput.focus();
        }
    });

    // No suggestions
    hiddenInput.setAttribute("autocomplete", "off");
    hiddenInput.setAttribute("autocorrect", "off");
    hiddenInput.setAttribute("autocapitalize", "off");
    hiddenInput.setAttribute("spellcheck", "false");
    hiddenInput.setAttribute("name", "hidden-no-autocomplete");

    // Use enter as "Answer button"
    hiddenInput.addEventListener("keydown", (e: KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (!gameSession) return;

            const wordGuess = gameSession.getCurrentWordGuess();
            handleAnswer(wordGuess);
        }
    });

    letterHintButton.addEventListener("click", handleUseLetterHint);
    textHintDetails.addEventListener("toggle", handleUseTextHint);
    syllableHintButton.addEventListener("click", handleUseVocalHint);
    imageCreditsButton.addEventListener("click", handleImageCredits);
    skipButton.addEventListener("click", handleSkipWord);

    hiddenInput.addEventListener("input", handleInputEvent);

    /* Make sure that cursor is always at the very end of the hidden input */
    hiddenInput.addEventListener("focus", () => moveCursorToEnd(hiddenInput));
    hiddenInput.addEventListener("click", () => moveCursorToEnd(hiddenInput));
    hiddenInput.addEventListener("keyup", () => moveCursorToEnd(hiddenInput));
}
