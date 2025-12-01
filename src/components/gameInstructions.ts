import { expectElement } from "../common/dom";
import styles from "./styles/gamePopUp.module.css";
import "./styles/dialog.css";

const gameInstructions = expectElement("game-instructions-text", HTMLElement);
const gameInstructionsDialog = expectElement("game-instructions", HTMLDialogElement);
const gameInstructionsHeader = expectElement("game-instructions-header", HTMLElement);
const closeButton = expectElement("game-instructions-close", HTMLButtonElement);

gameInstructionsDialog.className = styles.dialog;
gameInstructionsHeader.className = styles.popupHeader;

/**
 * Open the instructions dialog with text.
 *
 * @param text Text to be showed in instructions dialog
 */
export function showInstructionsModal(text: string): void {
    gameInstructionsDialog.showModal();
    gameInstructionsDialog.classList.add(styles.open);
    gameInstructions.innerHTML = text;
}

/** Close the dialog as requested */
function handleDialogClose(_: Event): void {
    gameInstructionsDialog.classList.remove(styles.open);
    gameInstructionsDialog.close();
}

/** Initialize game instructions dialog */
export function initializeGameInstructionsDialog() {
    closeButton.addEventListener("click", handleDialogClose);
}
