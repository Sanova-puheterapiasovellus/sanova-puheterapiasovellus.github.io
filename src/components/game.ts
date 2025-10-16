import { expectElement } from "../common/dom";
import type { CategorySelectedEvent, WordSelectedEvent } from "../common/events";
import { GameSession } from "./GameSession";
import type { WordGuess } from "./WordGuess";
import { initializeWordSelector } from "./words.ts";

const guessDialog = expectElement("word-guess-dialog", HTMLDialogElement);
const closeButton = expectElement("word-guess-close", HTMLButtonElement);
const answerButton = expectElement("word-guess-submit", HTMLButtonElement);
const letterHintButton = expectElement("word-guess-letter-hint", HTMLButtonElement);
const wordImage = expectElement("word-guess-image", HTMLImageElement);
const letterSlots = expectElement("word-guess-slots", HTMLDivElement);
const hiddenInput = document.getElementById("hidden-input") as HTMLInputElement;

// Keep track of the game progress, initially null
let gameSession: GameSession | null = null;

/** Close the dialog as requested. */
function handleDialogClose(_: Event): void {
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
    initializeWordSelector(currentCategory, gameSession);
    ///const word = gameSession.getCurrentWord();
    ///wordImage.alt = word;
    ///guessDialog.showModal();
    ///setupWordInput();
}

/** Handle the word selection, i.e. show the guessing modal for the user */
function handleWordSelected(event: WordSelectedEvent) {
    if (!gameSession) return;

    const { name, index } = event.detail;
    console.log("Word selected:", name, index);

    const word = gameSession.getCurrentWord();

    wordImage.alt = word;
    guessDialog.showModal();
    setupWordInput();
}

/** Renders the empty slots after answering or when initializing the first word */
function setupWordInput() {
    const wordGuess = getGameSession().getCurrentWordGuess();
    wordGuess.render(letterSlots);
    hiddenInput.value = "";
    hiddenInput.focus();
    letterSlots.addEventListener("click", () => hiddenInput.focus());
}

/** Gets and renders the letter typed from the keyboard */
function handleInputEvent(event: Event) {
    if (!gameSession) return;
    const wordGuess = gameSession.getCurrentWordGuess();
    const inputEvent = event as InputEvent;
    if (inputEvent.inputType === "deleteContentBackward") {
        wordGuess.removeLetter();
    } else if (inputEvent.inputType === "insertText" && hiddenInput.value.length > 0) {
        const letter = hiddenInput.value[hiddenInput.value.length - 1]!;
        wordGuess.addLetter(letter);
    }
    wordGuess.render(letterSlots);
    hiddenInput.value = "";
}

/** Handles other keyboard events than letters */
function handleKeyDown(event: KeyboardEvent) {
    if (!gameSession) return;
    const wordGuess = gameSession.getCurrentWordGuess();

    if (event.key === "Backspace") {
        event.preventDefault();
        wordGuess.removeLetter();
        wordGuess.render(letterSlots);
    }
}

/** Function that guarantees to return a valid game session object or throw an error */
function getGameSession(): GameSession {
    if (gameSession === null) {
        throw new Error("Game session is not initialized yet!");
    }
    return gameSession;
}

function handleUseVocalHint(): void {
    getGameSession().useVocalHint();
}

/** Handle the letter hint logic when the letter hint is requested */
function handleUseLetterHint(): void {
    if (!gameSession) return;
    const wordGuess = gameSession.getCurrentWordGuess();
    const done = wordGuess.useLetterHint();

    wordGuess.render(letterSlots);

    if (done) {
        // word completed with hints, move to next word
        handleAnswer(wordGuess);
    }
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
    const answer = wordGuess.getGuess().toLowerCase();
    const correctAnswer: string = wordImage.alt;
    const isCorrect: boolean = isCorrectAnswer(correctAnswer, answer);
    if (isCorrect) {
        wordImage.alt = getGameSession().getNextWord();
    } else {
        // show incorrect feedback if you like
        wordGuess.removeAllLetters();
    }
    setupWordInput();
}

/** Wire up events to react to the game being started. */
export function initializeGameContainer() {
    window.addEventListener("category-selected", handleGameStart);
    window.addEventListener("word-selected", handleWordSelected);
    closeButton.addEventListener("click", handleDialogClose);

    answerButton.addEventListener("click", () => {
        if (!gameSession) return;
        const wordGuess = gameSession.getCurrentWordGuess();
        handleAnswer(wordGuess);
    });

    letterHintButton.addEventListener("click", handleUseLetterHint);

    hiddenInput.addEventListener("input", handleInputEvent);
    hiddenInput.addEventListener("keydown", handleKeyDown);
}
