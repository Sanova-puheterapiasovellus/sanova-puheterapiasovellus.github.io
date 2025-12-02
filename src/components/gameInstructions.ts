import { expectElement } from "../common/dom";
import "./styles/gamePopUp.css";

const gameInstructions = expectElement("game-instructions-text", HTMLElement);
const gameInstructionsDialog = expectElement("game-instructions", HTMLDialogElement);
const closeButton = expectElement("game-instructions-close", HTMLButtonElement);

/**
 * Open the instructions dialog with text.
 *
 * @param text Text to be showed in instructions dialog
 */
export function showInstructionsModal(text: string): void {
    gameInstructionsDialog.showModal();
    gameInstructions.innerHTML = text;
}

/** Close the dialog as requested */
function handleDialogClose(_: Event): void {
    gameInstructionsDialog.close();
}

/** Initialize game instructions dialog */
export function initializeGameInstructionsDialog() {
    closeButton.addEventListener("click", handleDialogClose);
}
