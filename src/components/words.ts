import { expectElement } from "../common/dom";
import { getImagePath, wordsData } from "../data/word-data-model.ts";
import { capitalizeFirstLetter } from "../utils/stringUtils.ts";

// import styles from "./styles/words.module.css";

const wordList = expectElement("word-selector-list", HTMLUListElement);

/** Create a word entry showing its image */
function createWordEntry(name: string, imagePath: string): HTMLElement {
    const li = document.createElement("li");
    const capitalizedName = capitalizeFirstLetter(name);

    // class="${styles.card}"
    li.innerHTML = `
        <button type="button" class="word-card">
            <img src="${imagePath}" alt="${capitalizedName || "Word image"}"/>
            <span>${capitalizedName}</span>
        </button>
    `;

    return li;
}

/** Render the words for a given category name. */
export function initializeWordSelector(categoryName: string) {
    const categoryList = expectElement("category-selector-list", HTMLUListElement);
    const wordList = expectElement("word-selector-list", HTMLUListElement);

    categoryList.classList.add("hidden");
    wordList.classList.remove("hidden");
    wordList.innerHTML = "";

    const category = wordsData.categories.find((c) => c.name === categoryName);
    if (!category) return;

    // Add a back button
    const backButton = document.createElement("button");
    backButton.textContent = "Takaisin kategorioihin"; // “Back to categories”
    backButton.classList.add("back-button");
    backButton.addEventListener("click", () => {
        wordList.classList.add("hidden");
        categoryList.classList.remove("hidden");
        wordList.innerHTML = "";
    });
    wordList.appendChild(backButton);

    category.words.forEach((word) => {
        const wordEntry = createWordEntry(word.name, getImagePath(word.image));
        wordList.appendChild(wordEntry);
    });
}
