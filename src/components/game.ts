import { expectElement } from "../common/dom";
import type { CategorySelectedEvent } from "../common/events";
import { GameSession } from "./GameSession";

const guessDialog = expectElement("word-guess-dialog", HTMLDialogElement);
const closeButton = expectElement("word-guess-close", HTMLButtonElement);
const answerButton = expectElement("word-guess-submit", HTMLButtonElement);
const inputField = expectElement("word-guess-input", HTMLInputElement);
// const debugText = expectElement("word-guess-debug", HTMLParagraphElement);
const wordImage = expectElement("word-guess-image", HTMLImageElement);

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
    wordImage.alt = gameSession.getCurrentWord();
    guessDialog.showModal();
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
    getGameSession().useLetterHint();
}

/** Check if the user's answer is correct */
function isCorrectAnswer(correctAnswer: string, answer: string): boolean {
    if (correctAnswer === answer) {
        return true;
    }
    return false;
}

function handleAnswer(answer: string): void {
    console.log("Should handle the answer:", answer);
    const correctAnswer: string = wordImage.alt;
    const isCorrect: boolean = isCorrectAnswer(correctAnswer, answer);
    if (isCorrect) {
        // Should move to next word
        wordImage.alt = getGameSession().getNextWord();
    } else {
        // Should empty the input field and prompt the user about incorrect answer
    }
    inputField.value = "";
}

/** Wire up events to react to the game being started. */
export function initializeGameContainer() {
    window.addEventListener("category-selected", handleGameStart);
    closeButton.addEventListener("click", handleDialogClose);

    answerButton.addEventListener("click", () => {
        const answer = inputField.value.trim();
        handleAnswer(answer);
    });
}
