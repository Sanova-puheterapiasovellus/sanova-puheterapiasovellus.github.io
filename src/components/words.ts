import { expectElement } from "../common/dom";
import { dispatchWordSelection } from "../common/events";
import { getImagePath, wordsData } from "../data/word-data-model.ts";
import { capitalizeFirstLetter } from "../utils/stringUtils.ts";
import type { GameSession } from "./GameSession";

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
export function initializeWordSelector(categoryName: string, gameSession: GameSession) {
    const categoryList = expectElement("category-selector-list", HTMLUListElement);
    const wordList = expectElement("word-selector-list", HTMLUListElement);

    categoryList.classList.add("hidden");
    wordList.classList.remove("hidden");
    wordList.innerHTML = "";

    const category = wordsData.categories.find((c) => c.name === categoryName);
    if (!category) return;

    gameSession.setCategory(categoryName);
    gameSession.setWords(category.words.map((w) => w.name));

    // Add a (temporary?) back button
    const backButton = document.createElement("button");
    backButton.textContent = "Takaisin kategorioihin";
    backButton.classList.add("back-button");
    backButton.addEventListener("click", () => {
        wordList.classList.add("hidden");
        categoryList.classList.remove("hidden");
        wordList.innerHTML = "";
    });
    wordList.appendChild(backButton);

    const randomOrderButton = document.createElement("button");
    randomOrderButton.textContent = "? RANDOM ?";
    randomOrderButton.classList.add("random-order-button");
    randomOrderButton.addEventListener("click", () => {
        // Get a random unguessed word from GameSession
        gameSession.setGameModeRandom();
        const randomWord = gameSession.getNextWord();
        if (!randomWord || randomWord === "NoMoreWords") {
            console.log("All words guessed!");
            return;
        }
        dispatchWordSelection(randomOrderButton, randomWord, -1);
    });
    wordList.appendChild(randomOrderButton);

    category.words.forEach((word, index) => {
        const wordEntry = createWordEntry(word.name, getImagePath(word.image));

        wordEntry.addEventListener("click", () => {
            gameSession.setCurrentWordIndex(index);
            dispatchWordSelection(wordEntry, word.name, index);
        });
        wordList.appendChild(wordEntry);
    });
}
