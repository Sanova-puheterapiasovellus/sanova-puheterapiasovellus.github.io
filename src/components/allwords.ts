import { buildHtml, expectElement } from "../common/dom";
import { dispatchWordSelection } from "../common/events";
import type { Store } from "../common/reactive.ts";
import { getImagePath, type Word, wordsData } from "../data/word-data-model.ts";
import type { FilterOptions } from "./searchAndFilter";
import { setupSearchAndFilter } from "./searchAndFilter";
import styles from "./styles/allWords.module.css";

const categoriesPage = expectElement("categories-page", HTMLElement);
const allWordsPage = expectElement("all-words-page", HTMLElement);
const allWordsHeader = expectElement("all-words-header", HTMLElement);
const allWordsFooter = expectElement("all-words-footer", HTMLElement);
const mainviewHeader = expectElement("mainview", HTMLElement);

const allWordsList = expectElement("all-words-list", HTMLUListElement);
const filtersSection = expectElement("filters-section", HTMLElement);
const searchContainer = expectElement("search-container", HTMLElement);
const categoriesContainer = expectElement("category-filters", HTMLElement);

allWordsPage.className = styles.page;
allWordsList.className = styles.list;
allWordsHeader.className = styles.header;
allWordsFooter.className = styles.header;
filtersSection.className = styles.filters;
categoriesContainer.className = styles.categoryFilters;
searchContainer.className = styles.searchContainer;

function createImageEntry(word: Word, index: number): HTMLElement {
    const img = buildHtml("img", { src: getImagePath(word.image), alt: word.name });
    Object.assign(img.style, {
        cursor: "pointer",
        display: "block",
    });
    img.addEventListener("click", () => {
        dispatchWordSelection(img, word, index);
    });
    return buildHtml("li", { className: styles.card }, img);
}

function createRandomEntry(filters: FilterOptions): HTMLElement {
    const img = buildHtml("img", {
        src: getImagePath("question.png"),
        alt: "random",
    });
    Object.assign(img.style, {
        cursor: "pointer",
        display: "block",
    });
    img.addEventListener("click", () => {
        const randomWord = getRandomFilteredWord(filters);
        if (randomWord) {
            dispatchWordSelection(img, randomWord, randomWord.index);
        } else {
            alert("Ei sanoja nykyisillä filttereillä");
        }
    });
    return buildHtml("li", { className: styles.card }, img);
}
const separator = buildHtml("hr");
filtersSection.after(separator);

function getRandomFilteredWord(filters: FilterOptions) {
    const filteredWords = wordsData.categories.flatMap((category) => {
        if (
            filters.selectedCategories.length &&
            !filters.selectedCategories.includes(category.name)
        ) {
            return [];
        }
        return category.words
            .filter((word) => word.name.toLowerCase().includes(filters.term.toLowerCase()))
            .map((word, index) => ({ ...word, index }));
    });
    if (filteredWords.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * filteredWords.length);
    return filteredWords[randomIndex];
}
function renderAllImages(filters: FilterOptions) {
    allWordsList.innerHTML = "";
    allWordsList.appendChild(createRandomEntry(filters));

    wordsData.categories.forEach((category) => {
        if (
            filters.selectedCategories.length &&
            !filters.selectedCategories.includes(category.name)
        )
            return;

        category.words.forEach((word, index) => {
            if (word.name.toLowerCase().includes(filters.term)) {
                const li = createImageEntry(word, index);
                allWordsList.appendChild(li);
            }
        });
    });
}
export function initializeAllWords(hash: Store<string>) {
    hash.filter((value) => value === "#search").subscribe((_) => {
        categoriesPage.classList.add("hidden");
        allWordsPage.classList.remove("hidden");
        allWordsList.scrollTop = 0;
        mainviewHeader.style.paddingTop = `0px`;
    });

    hash.filter((value) => value === "" || value === "#").subscribe(() => {
        categoriesPage.classList.remove("hidden");
        allWordsPage.classList.add("hidden");
        mainviewHeader.style.paddingTop = `90px`;
    });

    const categoryData = wordsData.categories.map((category) => ({
        name: category.name,
        imagePath: getImagePath(category.image),
    }));
    setupSearchAndFilter(searchContainer, categoriesContainer, categoryData, renderAllImages);
}
