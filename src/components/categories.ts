import { expectElement } from "../common/dom";
import { dispatchCategorySelection } from "../common/events";
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
    const categories = [
        { name: "Eläimet", image: "/public/assets/images/kissa.png" },
        { name: "Ruoka", image: "/public/assets/images/ruokatarvikkeet.png" },
        { name: "Esineet", image: "/public/assets/images/esineet.png" },
        { name: "ASDF", image: "/public/assets/images/esineet.png" },
        { name: "PITEMPI KASA TEKSTIÄ", image: "/public/assets/images/esineet.png" },
    ];

    categories.forEach(({ name, image }) => {
        categoryList.appendChild(createCategoryEntry(name, image));
    });
}
