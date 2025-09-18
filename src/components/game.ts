import { expectElement } from "../common/dom";
import type { CategorySelectedEvent } from "../common/events";

const guessDialog = expectElement("word-guess-dialog", HTMLDialogElement);
const closeButton = expectElement("word-guess-close", HTMLButtonElement);
const debugText = expectElement("word-guess-debug", HTMLParagraphElement);

/** Close the dialog as requested. */
function handleDialogClose(_: Event): void {
    guessDialog.close();
}

/** Handle the game starting with the selected category. */
function handleGameStart(event: CategorySelectedEvent): void {
    debugText.innerText = event.detail.name;
    guessDialog.showModal();
}

/** Wire up events to react to the game being started. */
export function initializeGameContainer() {
    window.addEventListener("category-selected", handleGameStart);
    closeButton.addEventListener("click", handleDialogClose);
}
