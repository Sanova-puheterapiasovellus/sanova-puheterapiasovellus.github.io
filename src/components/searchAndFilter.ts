import { buildHtml } from "../common/dom";

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
        placeholder: "Hae sana...",
    });
    Object.assign(searchInput.style, {
        width: "90%",
        height: "30px",
    });
    const clearBtn = buildHtml("button", { type: "button", innerText: "✕" });
    clearBtn.addEventListener("click", () => {
        searchInput.value = "";
        notifyChange();
    });
    searchContainer.append(searchInput, clearBtn);

    categories.forEach((category) => {
        const label = buildHtml("label");
        Object.assign(label.style, {
            display: "inline-flex",
            alignItems: "center",
            marginRight: "12px",
            marginBottom: "8px",
        });
        const checkbox = buildHtml("input", { type: "checkbox", value: category.name });
        const img = buildHtml("img", { src: category.imagePath, alt: category.name });
        Object.assign(img.style, {
            width: "30px",
            height: "30px",
            objectFit: "cover",
        });
        label.append(img, checkbox, document.createTextNode(category.name));
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
