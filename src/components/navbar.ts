import styles from "./styles/navbar.module.css";

function Navbar(): HTMLElement {
    const nav = document.createElement("nav");
    nav.className = styles.navbar;

    nav.innerHTML = `
    <h1>Sanova</h1>
    <div class="${styles.navbarCenter}">
      <a href="#">
        <img src="/assets/icons/home35.svg" alt="Home icon">
        <span>KATEGORIAT</span>
      </a>
      <a href="#search">
        <img src="/assets/icons/search1_35.svg" alt="All words navigation icon">
        <span>KAIKKI SANAT</span>
      </a>
    </div>
  `;

    const links = nav.querySelectorAll<HTMLAnchorElement>("a");

    // Active page - <a> tag style
    window.addEventListener("hashchange", (_) => {
        const page = window.location.hash.slice(1);
        for (const element of links) {
            if (element.href.slice(1) === page) {
                element.classList.add(styles.active);
            } else {
                element.classList.remove(styles.active);
            }
        }
    });

    return nav;
}

export function initializeHeader() {
    document.querySelector("header.mainview-header")?.appendChild(Navbar());
}
