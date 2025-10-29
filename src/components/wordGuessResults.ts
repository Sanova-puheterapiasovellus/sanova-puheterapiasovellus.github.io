import { expectElement } from "../common/dom";
import type { GameSession } from "./GameSession";

const resultsDialog = expectElement("word-guess-results-dialog", HTMLDialogElement);

export function showWordGuessResults(gameSession: GameSession): void {
    console.log("Show results");
    resultsDialog.showModal();
}
