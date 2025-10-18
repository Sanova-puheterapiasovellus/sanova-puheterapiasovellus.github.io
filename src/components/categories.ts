import { expectElement } from "../common/dom";
import { dispatchCategorySelection } from "../common/events";
import { getImagePath, wordsData } from "../data/word-data-model.ts";
import { capitalizeFirstLetter } from "../utils/stringUtils.ts";
import styles from "./styles/categories.module.css";

const categoryList = expectElement("category-selector-list", HTMLUListElement);

/** Create a category entry that triggers a selection change on click. */
function createCategoryEntry(name: string, imagePath: string): HTMLElement {
    const li = document.createElement("li");
    const capitalizedName = capitalizeFirstLetter(name);
    li.innerHTML = `
        <button type="button" class="${styles.card}">
            <img src="${imagePath}" alt="${capitalizedName || "Category image"}"/>
            <span>${capitalizedName}</span>
        </button>
    `;
    const button = li.querySelector("button");
    button?.addEventListener("click", () => dispatchCategorySelection(button, name));
    return li;
}

/** Build up the category selection list. */
export function initializeCategorySelector() {
    wordsData.categories.forEach((category) => {
        const categoryEntry = createCategoryEntry(category.name, getImagePath(category.image));
        categoryList.appendChild(categoryEntry);
    });
}
