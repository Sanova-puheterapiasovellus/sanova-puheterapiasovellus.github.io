import type { Store } from "../common/reactive.ts";
import "./styles/aboutpage.css";

function AboutPage(): HTMLElement {
    const page = document.createElement("div");
    page.className = "page";

    page.innerHTML = `
        <div class="card">
            <h1>Tietoa Sanovasta</h1>
            <p>
                Sanova on sovellus, jossa voi harjoitella sanoja eri kategorioista.
            </p>
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
        } else {
            // hide this AboutPage page
            container.style.display = "none";
            container.innerHTML = "";
            // show main
            main.style.display = "block";
        }
    });
}
