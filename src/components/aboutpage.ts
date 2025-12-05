import { expectElement } from "../common/dom.ts";
import type { Store } from "../common/reactive.ts";
import {
    GAME_INSTRUCTIONS,
    SANOVA_INFORMATION,
    SANOVA_INFORMATION_SOURCES,
    SANOVA_INFORMATION_SOURCES_DETAILED,
    VIEW_INSTRUCTIONS,
} from "../data/information-texts.ts";
import "./styles/aboutpage.css";
import "./styles/gamePopUp.css";

function AboutPage(): HTMLElement {
    const page = document.createElement("div");
    page.className = "page";

    page.innerHTML = `
        <div class="card">
            <header>
                <h1>Tietoa Sanovasta</h1>
            </header>

            <section class="information-section">
                <div class="information-content-block">
                    ${SANOVA_INFORMATION}
                </div>
                <div class="information-content-block">
                    <button id="open-sources" type="button" class="text-link-button">${SANOVA_INFORMATION_SOURCES}</button>
                </div>
            </section>

            <section class="information-section">
                <h2>Pelimuodot ja niiden aloitus</h2>
                ${VIEW_INSTRUCTIONS}
            </section>

            <section class="information-section">
                <h2>Peliohjeet</h2>
                ${GAME_INSTRUCTIONS}
            </section>

            <dialog id="sources-dialog" closedby="any" class="popup">
                <button id="sources-close" type="button" class="dialog-close-button">
                    <img src="/assets/icons/close_36dp.svg">
                </button>
                <header class="popup-header">
                    <h2>Lähteet</h2>
                </header>
                ${SANOVA_INFORMATION_SOURCES_DETAILED}
            </dialog>
        </div>
    `;

    return page;
}

export function initializeAboutPage(hash: Store<string>) {
    const container = document.getElementById("aboutpage-container");
    const main = document.querySelector("main.mainview-main") as HTMLElement;
    if (!container || !main) return;

    hash.subscribe((value) => {
        if (value === "#about") {
            main.style.display = "none"; // hide main
            container.style.display = "block";
            container.innerHTML = "";
            container.appendChild(AboutPage());

            const openSources = expectElement("open-sources", HTMLButtonElement);
            const sourcesDialog = expectElement("sources-dialog", HTMLDialogElement);
            const sourcesClose = expectElement("sources-close", HTMLButtonElement);

            if (openSources && sourcesDialog) {
                openSources.addEventListener("click", (e) => {
                    e.preventDefault();
                    sourcesDialog.showModal();
                });
            }

            if (sourcesClose && sourcesDialog) {
                sourcesClose.addEventListener("click", (e) => {
                    sourcesDialog.close();
                });
            }
        } else {
            // hide this AboutPage page
            container.style.display = "none";
            container.innerHTML = "";
            // show main
            main.style.display = "block";
        }
    });
}
