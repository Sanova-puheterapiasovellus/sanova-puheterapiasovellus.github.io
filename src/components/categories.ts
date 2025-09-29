import { buildHtml, expectElement } from "../common/dom";
import { dispatchCategorySelection } from "../common/events";

const categoryList = expectElement("category-selector-list", HTMLUListElement);

/** Create a category entry that triggers a selection change on click. */
function createCategoryEntry(name: string, imagePath: string): HTMLElement {
    const img = buildHtml("img", {
        src: imagePath,
        alt: name,
    });
    Object.assign(img.style, {
        width: "50px",
        height: "50px",
        marginRight: "8px",
    });
    const button = buildHtml("button", { type: "button", innerText: name });
    button.appendChild(img);
    button.addEventListener("click", (_) => dispatchCategorySelection(button, name));
    return buildHtml("li", {}, button);
}

/** Build up the category selection list. */
export function initializeCategorySelector() {
    categoryList.appendChild(createCategoryEntry("Lemmikkieläimet", "/public/assets/kissa.png"));
    categoryList.appendChild(createCategoryEntry("Ruoka", "/public/assets/ruokatarvikkeet.png"));
    categoryList.appendChild(createCategoryEntry("Esineet", "/public/assets/esineet.png"));
}
