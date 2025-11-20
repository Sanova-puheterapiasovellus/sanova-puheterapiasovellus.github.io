import { expectElement } from "../common/dom";
import type { GameSession } from "./GameSession";
import "./styles/word-guess-results.css";
import { unlockPageScroll } from "../common/preventScroll.ts";
import type { Word } from "../data/word-data-model.ts";
import { WordGuessStatus } from "./wordStatus.ts";

const resultsDialog = expectElement("word-guess-results-dialog", HTMLDialogElement);

let resultsCloseButton: HTMLButtonElement;
let replayButton: HTMLButtonElement;
let checkboxSkipped: HTMLInputElement;
let checkboxHints: HTMLInputElement;
let checkboxIncorrect: HTMLInputElement;
let replayOptionsFieldset: HTMLFieldSetElement;
let correctAnswerP: HTMLParagraphElement;
let correctWithHintsP: HTMLParagraphElement;
let skippedAnswerP: HTMLParagraphElement;
let letterHintsP: HTMLParagraphElement;
let vocalHintsP: HTMLParagraphElement;
let textHintsP: HTMLParagraphElement;

function expectScopedElement<T extends Element>(
    parent: ParentNode,
    selector: string,
    type: { new (): T },
): T {
    const el = parent.querySelector(selector);
    if (!(el instanceof type)) {
        throw new Error(`Expected ${selector} to be ${type.name}`);
    }
    return el;
}

function updateReplayButtonState() {
    const anyChecked = Array.from(
        resultsDialog.querySelectorAll("input[name='replay-option']"),
    ).some((input) => (input as HTMLInputElement).checked);

    replayButton.disabled = !anyChecked;
}

function setupDialogElements(dialog: HTMLDialogElement): void {
    resultsCloseButton = expectScopedElement(
        dialog,
        "#word-guess-results-close",
        HTMLButtonElement,
    );
    replayButton = expectScopedElement(dialog, "#word-guess-replay", HTMLButtonElement);
    checkboxSkipped = expectScopedElement(dialog, "#replay-skipped", HTMLInputElement);
    checkboxHints = expectScopedElement(dialog, "#replay-hints", HTMLInputElement);
    checkboxIncorrect = expectScopedElement(dialog, "#replay-incorrect", HTMLInputElement);
    replayOptionsFieldset = expectScopedElement(dialog, "#replay-options", HTMLFieldSetElement);
    correctAnswerP = expectScopedElement(dialog, "#correct-answers", HTMLParagraphElement);
    correctWithHintsP = expectScopedElement(dialog, "#correct-with-hints", HTMLParagraphElement);
    skippedAnswerP = expectScopedElement(dialog, "#skipped-answers", HTMLParagraphElement);
    letterHintsP = expectScopedElement(dialog, "#letter-hints-used", HTMLParagraphElement);
    vocalHintsP = expectScopedElement(dialog, "#vocal-hints-used", HTMLParagraphElement);
    textHintsP = expectScopedElement(dialog, "#text-hints-used", HTMLParagraphElement);
}

function handleDialogClose(_: Event): void {
    resultsDialog.close();
    unlockPageScroll();
}

function getUniqueWords(words: Word[]): Word[] {
    return Array.from(new Map(words.map((w) => [w.name, w])).values());
}

// Handler here to get access to the gameSession
function handleReplay(gameSession: GameSession): void {
    const checkedCheckboxes = document.querySelector(
        "input[name='replay-option']:checked",
    ) as HTMLInputElement | null;
    if (!checkedCheckboxes) return;

    const wordsPerStatus = gameSession.getWordsPerStatus();
    const wordsIncorrect = wordsPerStatus[WordGuessStatus.INCORRECT] ?? [];
    const wordsUsedWithHints = wordsPerStatus[WordGuessStatus.CORRECT_USED_HINT] ?? [];
    const wordsSkipped = wordsPerStatus[WordGuessStatus.SKIPPED] ?? [];

    const words: Word[] = [];
    if (checkboxHints.checked) words.push(...wordsUsedWithHints);
    if (checkboxSkipped.checked) words.push(...wordsSkipped);
    if (checkboxIncorrect.checked) words.push(...wordsIncorrect);
    if (words.length === 0) return;

    // Remove duplicates
    const uniqueWords = getUniqueWords(words);

    // Remove result dialog immediately
    // when starting a new game
    //handleDialogClose(new Event("click"));

    // Update the gameSession
    dispatchEvent(
        new CustomEvent("words-selected", {
            bubbles: true,
            detail: {
                selections: uniqueWords.map((w, idx) => ({ word: w, index: idx })),
                category: null,
                isReplay: true,
            },
        }),
    );

    // Trigger the game start
    dispatchEvent(
        new CustomEvent("word-selected", {
            bubbles: true,
            detail: { word: null, index: 0 },
        }),
    );
}

function buildDialogContent(): void {
    resultsDialog.innerHTML = `
        <div id="word-guess-results-card">
            <button id="word-guess-results-close" type="button" class="dialog-close-button">
                <img src="/assets/icons/close_36dp.svg">
            </button>
            <h3>Tulokset</h3>
            <div>
                <p id="correct-answers" class="results-line"></p>
                <p id="correct-with-hints" class="results-line"></p>
            </div>
            <p id="skipped-answers" class="results-line"></p>
            <div>
                <p id="letter-hints-used" class="results-line"></p>
                <p id="text-hints-used" class="results-line"></p>
                <p id="vocal-hints-used" class="results-line"></p>
            </div>
            <fieldset id="replay-options">
                <legend>Valitse kerrattavaksi:</legend>
                <label>
                    <input type="checkbox" name="replay-option" value="skipped" id="replay-skipped">
                    Ohitetut sanat
                </label>
                <label>
                    <input type="checkbox" name="replay-option" value="incorrect" id="replay-incorrect">
                    Väärin menneet sanat
                </label>
                <label>
                    <input type="checkbox" name="replay-option" value="hints" id="replay-hints">
                    Sanat, jotka saatu oikein vihjeiden avulla
                </label>
            </fieldset>
            <button id="word-guess-replay" type="button">Pelaa uudelleen</button>
        </div>
    `;

    setupDialogElements(resultsDialog);
    resultsCloseButton.addEventListener("click", handleDialogClose);
    replayButton.disabled = true;

    // Enable replay button when any option is selected
    resultsDialog.querySelectorAll("input[name='replay-option']").forEach((input) => {
        input.addEventListener("change", updateReplayButtonState);
    });
}

export function showWordGuessResults(gameSession: GameSession): void {
    buildDialogContent();
    replayButton.onclick = () => handleReplay(gameSession);

    // Reset checkboxes
    checkboxSkipped.checked = false;
    checkboxHints.checked = false;
    checkboxIncorrect.checked = false;
    updateReplayButtonState();

    // Update UI stats
    const wordsPerStatus = gameSession.getWordsPerStatus();
    const wordsSkippedCount = wordsPerStatus[WordGuessStatus.SKIPPED]?.length ?? 0;
    const wordsIncorrectCount = wordsPerStatus[WordGuessStatus.INCORRECT]?.length ?? 0;
    const correctAnswerCount = wordsPerStatus[WordGuessStatus.CORRECT]?.length ?? 0;
    const correctAnswerCountHintsUsed =
        wordsPerStatus[WordGuessStatus.CORRECT_USED_HINT]?.length ?? 0;
    const totalCount = gameSession.getTotalWordCount();

    correctAnswerP.textContent = `Oikeita vastauksia: ${correctAnswerCount} / ${totalCount}`;
    if (correctAnswerCountHintsUsed > 0) {
        correctWithHintsP.textContent = `Vihjeiden avulla oikein vastatut sanat: ${correctAnswerCountHintsUsed} / ${totalCount}`;
        correctWithHintsP.style.display = "block";
    } else {
        correctWithHintsP.style.display = "none";
    }
    skippedAnswerP.textContent = `Ohitettuja sanoja: ${wordsSkippedCount}`;
    letterHintsP.textContent = `Käytettyja kirjainvihjeitä: ${gameSession.getLetterHintsUsed()}`;
    vocalHintsP.textContent = `Käytettyja tavuvihjeitä: ${gameSession.getVocalHintsUsed()}`;
    textHintsP.textContent = `Käytettyja kuvailevia vihjeitä: ${gameSession.getTextHintsUsed()}`;

    // Show/Hide checkbox replay-options
    const hasSkipped = wordsSkippedCount > 0;
    const hasHints = correctAnswerCountHintsUsed > 0;
    const hasIncorrect = wordsIncorrectCount > 0;

    checkboxSkipped.parentElement?.classList.toggle("hidden", !hasSkipped);
    checkboxHints.parentElement?.classList.toggle("hidden", !hasHints);
    checkboxIncorrect.parentElement?.classList.toggle("hidden", !hasIncorrect);

    const anyReplayAvailable = hasSkipped || hasHints || hasIncorrect;
    replayOptionsFieldset.classList.toggle("hidden", !anyReplayAvailable);
    replayButton.classList.toggle("hidden", !anyReplayAvailable);

    resultsDialog.showModal();
}
