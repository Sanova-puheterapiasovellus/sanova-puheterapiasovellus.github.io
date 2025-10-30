import { expectElement } from "../common/dom";
import type { GameSession } from "./GameSession";

const resultsDialog = expectElement("word-guess-results-dialog", HTMLDialogElement);
const resultsCloseButton = expectElement("word-guess-results-close", HTMLButtonElement);
const replayIncorrectButton = expectElement("word-guess-replay", HTMLButtonElement);

function handleDialogClose(_: Event): void {
    resultsDialog.close();
}

export function showWordGuessResults(gameSession: GameSession): void {
    resultsCloseButton.addEventListener("click", handleDialogClose);

    // Handler here to get access to the gameSession
    function handleReplayIncorrect(_: Event): void {
        const words: string[] = gameSession.getIncorrectlyGuessedWords();
        if (words.length > 0) {
            // Update the gameSession
            dispatchEvent(
                new CustomEvent("words-selected", {
                    bubbles: true,
                    detail: {
                        selections: words.map((w, idx) => ({ name: w, index: idx })),
                        category: null,
                    },
                }),
            );

            // Trigger the game start
            dispatchEvent(
                new CustomEvent("word-selected", {
                    bubbles: true,
                    detail: { name: null, index: 0 },
                }),
            );
        }
    }

    if (gameSession.getIncorrectlyGuessedWords().length === 0) {
        // Hide the replay button, no words to replay
        replayIncorrectButton.classList.add("hidden");
    } else {
        // Show the replay button
        replayIncorrectButton.classList.remove("hidden");
    }

    replayIncorrectButton.addEventListener("click", handleReplayIncorrect);

    const correctAnswerP = expectElement("correct-answers", HTMLParagraphElement);
    const letterHintsP = expectElement("letter-hints-used", HTMLParagraphElement);
    const vocalHintsP = expectElement("vocal-hints-used", HTMLParagraphElement);
    const textHintsP = expectElement("text-hints-used", HTMLParagraphElement);

    correctAnswerP.textContent = `Oikeita vastauksia: ${gameSession.getCorrectAnswerCount()} / ${gameSession.getTotalWordCount()}`;
    letterHintsP.textContent = `Käytettyja kirjainvihjeitä: ${gameSession.getLetterHintsUsed()}`;
    vocalHintsP.textContent = `Käytettyja äänivihjeitä: ${gameSession.getVocalHintsUsed()}`;
    textHintsP.textContent = `Käytettyja tekstivihjeitä: ${gameSession.getTextHintsUsed()}`;

    console.log("Showing modal!");
    resultsDialog.showModal();
}
