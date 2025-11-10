import { expectElement } from "../common/dom";
import "./styles/imageCredits.css";

const imageCredits = expectElement("image-credits-text", HTMLElement);
const imageCreditsDialog = expectElement("image-credits", HTMLDialogElement);
const closeButton = expectElement("image-credits-close", HTMLButtonElement);

/**
 * Open the credits dialog with text.
 *
 * @param text Text to be showed in credits dialog
 */
export function showCreditsModal(text: string): void {
    imageCreditsDialog.showModal();
    imageCredits.textContent = text;
}

/** Close the dialog as requested */
function handleDialogClose(_: Event): void {
    imageCreditsDialog.close();
}

/** Initialize image credits dialog */
export function initializeImageCreditsDialog() {
    closeButton.addEventListener("click", handleDialogClose);
}
