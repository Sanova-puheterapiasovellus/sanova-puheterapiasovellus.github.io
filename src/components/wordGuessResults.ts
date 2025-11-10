/*import { expectElement } from "../common/dom";
import type { GameSession } from "./GameSession";
import "./styles/word-guess-results.css";
import { unlockPageScroll } from "../common/preventScroll.ts";

const resultsDialog = expectElement("word-guess-results-dialog", HTMLDialogElement);
const resultsCloseButton = expectElement("word-guess-results-close", HTMLButtonElement);
const replayIncorrectButton = expectElement("word-guess-replay", HTMLButtonElement);

function handleDialogClose(_: Event): void {
    resultsDialog.close();
    unlockPageScroll();
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
                        isReplay: true,
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

    resultsDialog.showModal();
}
*/

import { expectElement } from "../common/dom";
import type { GameSession } from "./GameSession";
import "./styles/word-guess-results.css";
import { unlockPageScroll } from "../common/preventScroll.ts";

const resultsDialog = expectElement("word-guess-results-dialog", HTMLDialogElement);

let resultsCloseButton: HTMLButtonElement;
let replayButton: HTMLButtonElement;
let checkboxSkipped: HTMLInputElement;
let checkboxHints: HTMLInputElement;
let checkboxIncorrect: HTMLInputElement;
let replayOptionsFieldset: HTMLFieldSetElement;
let correctAnswerP: HTMLParagraphElement;
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
    skippedAnswerP = expectScopedElement(dialog, "#skipped-answers", HTMLParagraphElement);
    letterHintsP = expectScopedElement(dialog, "#letter-hints-used", HTMLParagraphElement);
    vocalHintsP = expectScopedElement(dialog, "#vocal-hints-used", HTMLParagraphElement);
    textHintsP = expectScopedElement(dialog, "#text-hints-used", HTMLParagraphElement);
}

function handleDialogClose(_: Event): void {
    resultsDialog.close();
    unlockPageScroll();
}

// Handler here to get access to the gameSession
function handleReplay(gameSession: GameSession): void {
    const words: string[] = [];
    // TODO: implement .getSkippedWords() and .getHintedWords()
    // then open two comments below
    //if (checkboxSkipped.checked) words.push(...gameSession.getSkippedWords());
    //if (checkboxHints.checked) words.push(...gameSession.getHintedWords());
    if (checkboxIncorrect.checked) words.push(...gameSession.getIncorrectlyGuessedWords());
    if (words.length === 0) return;

    // Remove result dialog immediately
    // when starting a new game
    handleDialogClose(new Event("click"));

    // Update the gameSession
    dispatchEvent(
        new CustomEvent("words-selected", {
            bubbles: true,
            detail: {
                selections: words.map((w, idx) => ({ name: w, index: idx })),
                category: null,
                isReplay: true,
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

function buildDialogContent(): void {
    resultsDialog.innerHTML = `
        <div id="word-guess-card">
            <button id="word-guess-results-close" type="button" aria-label="Sulje">&times;</button>
            <h3>Tulokset</h3>
            <p id="correct-answers" class="results-line"></p>
            <p id="skipped-answers" class="results-line"></p>
            <p id="letter-hints-used" class="results-line"></p>
            <p id="vocal-hints-used" class="results-line"></p>
            <p id="text-hints-used" class="results-line"></p>
            <fieldset id="replay-options">
                <legend>Valitse kerrattavaksi:</legend>
                <label><input type="checkbox" id="replay-skipped">Ohitetut sanat</label>
                <label><input type="checkbox" id="replay-hints">Sanat, joissa käytetty vihjeitä</label>
                <label><input type="checkbox" id="replay-incorrect">Väärin menneet sanat</label>
            </fieldset>
            <button id="word-guess-replay" type="button">Pelaa uudelleen</button>
        </div>
    `;

    setupDialogElements(resultsDialog);
    resultsCloseButton.addEventListener("click", handleDialogClose);
}

export function showWordGuessResults(gameSession: GameSession): void {
    if (!resultsCloseButton) {
        buildDialogContent();
        replayButton.addEventListener("click", () => handleReplay(gameSession));
    }

    // Reset checkboxes
    checkboxSkipped.checked = false;
    checkboxHints.checked = false;
    checkboxIncorrect.checked = false;

    // Update UI stats
    correctAnswerP.textContent = `Oikeita vastauksia: ${gameSession.getCorrectAnswerCount()} / ${gameSession.getTotalWordCount()}`;
    // TODO: open this after method implemented: skippedAnswerP.textContent = `Ohitettuja sanoja: ${gameSession.getSkippedWords()}`;
    letterHintsP.textContent = `Käytettyja kirjainvihjeitä: ${gameSession.getLetterHintsUsed()}`;
    vocalHintsP.textContent = `Käytettyja äänivihjeitä: ${gameSession.getVocalHintsUsed()}`;
    textHintsP.textContent = `Käytettyja tekstivihjeitä: ${gameSession.getTextHintsUsed()}`;

    // Show/Hide checkbox replay-options
    // TODO: open ALL below comments when getSkippedWords()
    // and getHintedWords() gets implemented
    //const hasSkipped = gameSession.getSkippedWords().length > 0;
    //const hasHints = gameSession.getHintedWords().length > 0;
    const hasIncorrect = gameSession.getIncorrectlyGuessedWords().length > 0;

    //checkboxSkipped.parentElement?.classList.toggle("hidden", !hasSkipped);
    //checkboxHints.parentElement?.classList.toggle("hidden", !hasHints);
    checkboxIncorrect.parentElement?.classList.toggle("hidden", !hasIncorrect);

    const anyReplayAvailable = /*hasSkipped || hasHints ||*/ hasIncorrect;
    replayOptionsFieldset.classList.toggle("hidden", !anyReplayAvailable);
    replayButton.classList.toggle("hidden", !anyReplayAvailable);

    resultsDialog.showModal();
}
