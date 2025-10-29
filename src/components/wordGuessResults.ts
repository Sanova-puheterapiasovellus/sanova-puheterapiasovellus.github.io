import { expectElement } from "../common/dom";
import type { GameSession } from "./GameSession";

const resultsDialog = expectElement("word-guess-results-dialog", HTMLDialogElement);
const resultsCloseButton = expectElement("word-guess-results-close", HTMLButtonElement);

function handleDialogClose(_: Event): void {
    resultsDialog.close();
}

export function showWordGuessResults(gameSession: GameSession): void {
    resultsCloseButton.addEventListener("click", handleDialogClose);

    const correctAnswerP = expectElement("correct-answers", HTMLParagraphElement);
    const letterHintsP = expectElement("letter-hints-used", HTMLParagraphElement);
    const vocalHintsP = expectElement("vocal-hints-used", HTMLParagraphElement);
    const textHintsP = expectElement("text-hints-used", HTMLParagraphElement);

    correctAnswerP.textContent = `Oikeita vastauksia: ${gameSession.getCorrectAnswerCount()} / ${gameSession.getTotalWordCount()}`;
    letterHintsP.textContent = `Käytettyja kirjainvihjeitä: ${gameSession.getLetterHintsUsed()}`;
    vocalHintsP.textContent = `Käytettyja äänivihjeitä: ${gameSession.getVocalHintsUsed()}`;
    textHintsP.textContent = `Käytettyja tekstivihjeitä: ${gameSession.getTextHintsUsed()}`;

    resultsDialog.showModal();
}
