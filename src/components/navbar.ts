import styles from "./styles/navbar.module.css";

function Navbar(): HTMLElement {
    const nav = document.createElement("nav");
    nav.className = styles.navbar;

    nav.innerHTML = `
    <h1>Sanova</h1>
    <div class="${styles.navbarCenter}">
      <a href="/index.html">
        <img src="/assets/icons/home35.svg" alt="Home icon">
        <span>KATEGORIAT</span>
      </a>
      <a href="/all-words.html" id="all-words-link">
        <img src="/assets/icons/search1_35.svg" alt="All words navigation icon">
        <span>KAIKKI SANAT</span>
      </a>
    </div>
  `;

    const links = nav.querySelectorAll<HTMLAnchorElement>("a");
    const currentPath = window.location.pathname;

    // Active page - <a> tag style
    links.forEach((link) => {
        const linkPath = new URL(link.href, window.location.origin).pathname;
        const isActive =
            linkPath === currentPath || (linkPath === "/index.html" && currentPath === "/");

        if (isActive) {
            link.classList.add(styles.active);
        }
    });

    // prevent normal link behaviour and open all words in dialog element instead
    const allWordsLink = nav.querySelector<HTMLAnchorElement>("#all-words-link");
    allWordsLink?.addEventListener("click", (e) => {
        e.preventDefault();
        (document.getElementById("all-words-dialog") as HTMLDialogElement | null)?.showModal();
    });
    return nav;
}

export function initializeHeader() {
    document.querySelector("header.mainview-header")?.appendChild(Navbar());
}
