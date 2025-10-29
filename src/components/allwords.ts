import { buildHtml, expectElement } from "../common/dom";
import { dispatchWordSelection } from "../common/events";
import { getImagePath, wordsData } from "../data/word-data-model.ts";
import type { FilterOptions } from "./searchAndFilter";
import { setupSearchAndFilter } from "./searchAndFilter";

const dialog = expectElement("all-words-dialog", HTMLDialogElement);
const closeBtn = expectElement("close-all-words", HTMLElement);
const allWordsList = expectElement("all-words-list", HTMLUListElement);
const filtersSection = expectElement("filters-section", HTMLElement);
const searchContainer = expectElement("search-container", HTMLElement);
const categoriesContainer = expectElement("category-filters", HTMLElement);

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
const separator = buildHtml("hr");
filtersSection.after(separator);
function renderAllImages(filters: FilterOptions) {
    allWordsList.innerHTML = "";
    allWordsList.appendChild(createRandomEntry());

    wordsData.categories.forEach((category) => {
        if (
            filters.selectedCategories.length &&
            !filters.selectedCategories.includes(category.name)
        )
            return;

        category.words.forEach((word, index) => {
            if (word.name.toLowerCase().includes(filters.term)) {
                const li = createImageEntry(word.name, getImagePath(word.image), index);
                allWordsList.appendChild(li);
            }
        });
    });
}
export function initializeAllWords() {
    const categoryData = wordsData.categories.map((category) => ({
        name: category.name,
        imagePath: getImagePath(category.image),
    }));
    setupSearchAndFilter(searchContainer, categoriesContainer, categoryData, renderAllImages);
}
