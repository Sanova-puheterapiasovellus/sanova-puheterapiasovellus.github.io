import { buildHtml, expectElement } from "../common/dom";
import { dispatchCategorySelection } from "../common/events";

const categoryList = expectElement("category-selector-list", HTMLUListElement);

/** Create a category entry that triggers a selection change on click. */
function createCategoryEntry(name: string): HTMLElement {
    const button = buildHtml("button", { type: "button", innerText: name });
    button.addEventListener("click", (_) => dispatchCategorySelection(button, name));
    return buildHtml("li", {}, button);
}

/** Build up the category selection list. */
export function initializeCategorySelector() {
    categoryList.appendChild(createCategoryEntry("Esimerkkikategoria"));
}
