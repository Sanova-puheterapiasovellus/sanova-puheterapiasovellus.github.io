import { expectElement } from "../common/dom";
import styles from "./styles/gamePopUp.module.css";

const imageCredits = expectElement("image-credits-text", HTMLElement);
const imageCreditsDialog = expectElement("image-credits", HTMLDialogElement);
const imageCreditsHeader = expectElement("image-credits-header", HTMLElement);
const closeButton = expectElement("image-credits-close", HTMLButtonElement);

imageCreditsDialog.className = styles.dialog;
imageCreditsHeader.className = styles.popupHeader;

/**
 * Open the credits dialog with text.
 *
 * @param text Text to be showed in credits dialog
 */
export function showCreditsModal(text: string): void {
    imageCreditsDialog.showModal();
    imageCreditsDialog.classList.add(styles.open);
    imageCredits.textContent = text;
}

/** Close the dialog as requested */
function handleDialogClose(_: Event): void {
    imageCreditsDialog.classList.remove(styles.open);
    imageCreditsDialog.close();
}

/** Initialize image credits dialog */
export function initializeImageCreditsDialog() {
    closeButton.addEventListener("click", handleDialogClose);
}
