import { buildHtml } from "../common/dom";
import { capitalizeFirstLetter } from "../utils/stringUtils.ts";
import styles from "./styles/allWords.module.css";

export interface FilterOptions {
    term: string;
    selectedCategories: string[];
}

export type FilterChangeCallback = (filters: FilterOptions) => void;

export function setupSearchAndFilter(
    searchContainer: HTMLElement,
    categoriesContainer: HTMLElement,
    categories: { name: string; imagePath: string }[],
    onFilterChange: FilterChangeCallback,
) {
    searchContainer.innerHTML = "";
    categoriesContainer.innerHTML = "";
    const searchInput = buildHtml("input", {
        type: "text",
        placeholder: "Etsi sanoja...",
        className: styles.searchInput,
    });

    searchContainer.className = styles.searchContainer;
    searchContainer.append(searchInput);

    categories.forEach((category) => {
        const label = buildHtml("label", { className: styles.categoryLabel });
        const capitalizedName = capitalizeFirstLetter(category.name);
        const checkbox = buildHtml("input", {
            type: "checkbox",
            value: category.name,
            className: styles.categoryCheckbox,
        });
        const img = buildHtml("img", {
            src: category.imagePath,
            alt: category.name,
            className: styles.categoryImage,
        });
        label.append(img, checkbox, document.createTextNode(capitalizedName));
        categoriesContainer.appendChild(label);
    });

    function notifyChange() {
        const term = searchInput.value.trim().toLowerCase();
        const selectedCategories = Array.from(
            categoriesContainer.querySelectorAll<HTMLInputElement>("input:checked"),
        ).map((cb) => cb.value);

        onFilterChange({ term, selectedCategories });
    }

    searchInput.addEventListener("input", notifyChange);
    categoriesContainer.addEventListener("change", notifyChange);

    notifyChange();
}
