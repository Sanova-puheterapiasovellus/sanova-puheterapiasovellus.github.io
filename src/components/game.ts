import { expectElement } from "../common/dom";
import type { CategorySelectedEvent } from "../common/events";
import { GameSession } from "./GameSession";
import type { WordGuess } from "./WordGuess";

const guessDialog = expectElement("word-guess-dialog", HTMLDialogElement);
const closeButton = expectElement("word-guess-close", HTMLButtonElement);
const answerButton = expectElement("word-guess-submit", HTMLButtonElement);
const letterHintButton = expectElement("word-guess-letter-hint", HTMLButtonElement);
// const inputField = expectElement("word-guess-input", HTMLInputElement);
// const debugText = expectElement("word-guess-debug", HTMLParagraphElement);
const wordImage = expectElement("word-guess-image", HTMLImageElement);
const letterSlots = expectElement("word-guess-slots", HTMLDivElement);

// Keep track of the game progress, initially null
let gameSession: GameSession | null = null;

/** Close the dialog as requested. */
function handleDialogClose(_: Event): void {
    guessDialog.close();
}

/** Handle the game starting with the selected category. */
function handleGameStart(event: CategorySelectedEvent): void {
    const currentCategory: string = event.detail.name;
    gameSession = new GameSession(currentCategory);
    const word = gameSession.getCurrentWord();
    wordImage.alt = word;

    guessDialog.showModal();
    setupWordInput();
}

/** Renders the empty slots after answering or when initializing the first word */
function setupWordInput() {
    const wordGuess = getGameSession().getCurrentWordGuess();
    wordGuess.render(letterSlots);

    // attach keyboard
    window.addEventListener("keydown", handleKeyInput);
}

/** Gets and renders the letter typed from the keyboard */
function handleKeyInput(event: KeyboardEvent) {
    if (!gameSession) return;
    const wordGuess = gameSession.getCurrentWordGuess();
    const container = document.getElementById("word-guess-slots") as HTMLDivElement;

    if (/^[a-zA-ZåäöÅÄÖ]$/.test(event.key)) {
        wordGuess.addLetter(event.key);
        wordGuess.render(container);
    } else if (event.key === "Backspace") {
        wordGuess.removeLetter();
        wordGuess.render(container);
    }
}

/** Function that quarantees to return a valid game session object or throw an error */
function getGameSession(): GameSession {
    if (gameSession === null) {
        throw new Error("Game session is not initialized yet!");
    }
    return gameSession;
}

function handleUseVocalHint(): void {
    getGameSession().useVocalHint();
}

function handleUseLetterHint(): void {
    console.log("Handling letter hint!");
    getGameSession().useLetterHint();
}

/** Check if the user's answer is correct */
function isCorrectAnswer(correctAnswer: string, answer: string): boolean {
    if (correctAnswer === answer) {
        return true;
    }
    return false;
}

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
    closeButton.addEventListener("click", handleDialogClose);

    answerButton.addEventListener("click", () => {
        if (!gameSession) return;
        const wordGuess = gameSession.getCurrentWordGuess();
        handleAnswer(wordGuess);
    });

    letterHintButton.addEventListener("click", handleUseLetterHint);
}
