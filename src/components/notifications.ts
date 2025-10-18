import { buildHtml, expectElement, TemplatedElement } from "../common/dom";

/** Component for notifications shown on the page. */
class NotificationItem extends TemplatedElement {
    static #componentTemplate = expectElement("notification-item", HTMLTemplateElement);
    static #lingerDuration = 10 * 1000;

    #removeTimeout: number | undefined;
    #closeButton = buildHtml("button", { type: "button", innerText: "x" });

    constructor(title: string, description?: string) {
        super(NotificationItem.#componentTemplate);

        this.attachSlots({
            header: buildHtml("p", { innerText: title }, this.#closeButton),
            content: buildHtml("pre", { innerText: description ?? "" }),
        });
    }

    override connectedCallback(): void {
        super.connectedCallback();
        this.connectEvent("click", this.#closeButton, this.#closeRequested);
        this.#removeTimeout = window.setTimeout(
            this.#closeRequested.bind(this),
            NotificationItem.#lingerDuration,
        );
    }

    override disconnectedCallback(): void {
        super.disconnectedCallback();
        window.clearInterval(this.#removeTimeout);
    }

    #closeRequested(): void {
        this.parentNode?.removeChild(this);
    }
}

/** Start displaying any dispatched notifications. */
export function initializeNotificationSystem() {
    const eventList = expectElement("notification-list", HTMLUListElement);
    customElements.define("notification-item", NotificationItem);
    window.addEventListener("internal-notification", ({ detail }) =>
        eventList.appendChild(new NotificationItem(detail.title, detail.description)),
    );
}
