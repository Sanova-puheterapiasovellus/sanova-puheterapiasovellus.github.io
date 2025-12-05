import { expectElement } from "../common/dom";
import { dispatchCustomEvent } from "../common/events";
import { type Category, getImagePath, wordsData } from "../data/word-data-model.ts";
import { capitalizeFirstLetter } from "../utils/stringUtils.ts";
import styles from "./styles/categories.module.css";

const categoryList = expectElement("category-selector-list", HTMLUListElement);

/** Data for random category */
const randomCategory: Category = {
    name: "random",
    image: "question.png",
    image_credit: "",
    words: [],
};

/** Create a category entry that triggers a selection change on click. */
function createCategoryEntry(category: Category): HTMLElement {
    const li = document.createElement("li");
    const capitalizedName = capitalizeFirstLetter(category.name);
    li.innerHTML = `
        <button type="button" class="${styles.card}">
            <img src="${getImagePath(category.image)}" alt="${capitalizedName || "Category image"}"/>
            <span>${capitalizedName}</span>
        </button>
    `;
    const button = li.querySelector("button");
    button?.addEventListener("click", () =>
        dispatchCustomEvent("category-selected", { category }, button),
    );
    return li;
}
/** Create a random category entry that triggers a selection change on click. */
function createRandomCategoryEntry(): HTMLElement {
    const li = document.createElement("li");
    li.innerHTML = `
        <button type="button" class="${styles.card}">
            <img src="${getImagePath(randomCategory.image)}" alt="Random sana"/>
            <span>Satunnaiset sanat</span>
        </button>
    `;

    const button = li.querySelector("button");
    button?.addEventListener("click", () => {
        dispatchCustomEvent("category-selected", { category: randomCategory }, button);
    });
    return li;
}
/** Build up the category selection list. */
export function initializeCategorySelector() {
    categoryList.appendChild(createRandomCategoryEntry());
    wordsData.categories.forEach((category) => {
        const categoryEntry = createCategoryEntry(category);
        categoryList.appendChild(categoryEntry);
    });
}
