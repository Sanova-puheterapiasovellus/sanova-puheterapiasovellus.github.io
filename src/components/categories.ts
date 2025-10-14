import { expectElement } from "../common/dom";
import { dispatchCategorySelection } from "../common/events";
import { wordsData } from "../data/word-data-model.ts";
import { capitalizeFirstLetter } from "../utils/stringUtils.ts";
import styles from "./styles/categories.module.css";

const categoryList = expectElement("category-selector-list", HTMLUListElement);

/** Create a category entry that triggers a selection change on click. */
function createCategoryEntry(name: string, imagePath: string): HTMLElement {
    const li = document.createElement("li");
    li.innerHTML = `
        <button type="button" class="${styles.card}">
            <img src="${imagePath}" alt="${name || "Category image"}"/>
            <span>${name}</span>
        </button>
    `;
    const button = li.querySelector("button");
    button?.addEventListener("click", () => dispatchCategorySelection(button, name));
    return li;
}

/** Build up the category selection list. */
export function initializeCategorySelector() {
    wordsData.categories.forEach((category) => {
        const categoryEntry = createCategoryEntry(
            capitalizeFirstLetter(category.name),
            category.image,
        );
        categoryList.appendChild(categoryEntry);
    });
}
