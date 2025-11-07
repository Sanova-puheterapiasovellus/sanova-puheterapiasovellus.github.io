let scrollY = 0;

/** Lock scrolling the page */
export function lockPageScroll() {
    scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
}

/** Unlock page scrolling */
export function unlockPageScroll() {
    const y = parseInt(document.body.style.top || "0", 10) * -1;
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
    window.scrollTo(0, y);
}
