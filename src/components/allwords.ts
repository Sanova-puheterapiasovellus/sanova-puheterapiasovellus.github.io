import { buildHtml, expectElement } from "../common/dom";
import { dispatchWordSelection } from "../common/events";
import { getImagePath, wordsData } from "../data/word-data-model.ts";

const openBtn = expectElement("open-words-btn", HTMLButtonElement);
const dialog = expectElement("all-words-dialog", HTMLDialogElement);
const closeBtn = expectElement("close-all-words", HTMLElement);
const allWordsList = expectElement("all-words-list", HTMLUListElement);

openBtn.addEventListener("click", () => {
    dialog.showModal();
});
closeBtn.addEventListener("click", () => {
    dialog.close();
});
dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
});

function createImageEntry(word: string, imagePath: string, index: number): HTMLElement {
    const img = buildHtml("img", { src: imagePath, alt: word });
    Object.assign(img.style, {
        cursor: "pointer",
        display: "block",
    });
    img.addEventListener("click", () => {
        dispatchWordSelection(img, word, index);
    });
    return buildHtml("li", {}, img);
}

function createRandomEntry(): HTMLElement {
    const img = buildHtml("img", {
        src: getImagePath("question.png"),
        alt: "random",
    });
    Object.assign(img.style, {
        cursor: "pointer",
        display: "block",
    });
    img.addEventListener("click", () => {
        // go to game with random word
    });
    return buildHtml("li", {}, img);
}

export function initializeAllWords() {
    allWordsList.innerHTML = "";
    allWordsList.appendChild(createRandomEntry());
    wordsData.categories.forEach((category) => {
        category.words.forEach((word, index) => {
            const li = createImageEntry(word.name, getImagePath(word.image), index);
            allWordsList.appendChild(li);
        });
    });
}
