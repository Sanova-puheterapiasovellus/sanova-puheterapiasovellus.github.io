import type { Store } from "../common/reactive";
import styles from "./styles/navbar.module.css";

function Navbar(hash: Store<string>): HTMLElement {
    const nav = document.createElement("nav");
    nav.className = styles.navbar;

    nav.innerHTML = `
    <h1>Sanova</h1>
    <div class="${styles.navbarCenter}">
      <a href="#" id="categories-link">
        <img src="/assets/icons/home35.svg" alt="Kategoriasivuikoni">
        <span>KATEGORIAT</span>
      </a>
      <a href="#search" id="all-words-link">
        <img src="/assets/icons/search1_35.svg" alt="Kaikki sanat -sivun ikoni">
        <span>KAIKKI SANAT</span>
      </a>
      <a href="#about" id="about-link">
        <img src="/assets/icons/info_35dp.svg" alt="Tietoa sovelluksesta -ikoni">
        <span>TIETOA</span>
      </a>
    </div>
  `;

    const links = nav.querySelectorAll<HTMLAnchorElement>("a");

    // Active page - <a> tag style
    hash.subscribe((value) => {
        for (const element of links) {
            const { hash } = new URL(element.href);
            if (hash === value) {
                console.log("Here");
                element.classList.add(styles.active);
            } else {
                console.log("HERE");
                element.classList.remove(styles.active);
            }
        }
    });

    return nav;
}

export function initializeHeader(hash: Store<string>) {
    document.querySelector("header.mainview-header")?.appendChild(Navbar(hash));
}
