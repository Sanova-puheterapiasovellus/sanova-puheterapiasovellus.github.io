import { Store } from "./reactive";

/**
 * Find a fundamentally required element with the given ID, throwing an exception
 * if it isn't found or the type doesn't match.
 */
export function expectElement<T extends HTMLElement>(
    id: string,
    kind: new (...args: unknown[]) => T,
): T {
    const element = document.getElementById(id);
    if (element === null) {
        throw new Error(`couldn't find element ${id}`);
    }

    if (!(element instanceof kind)) {
        throw new Error(`element ${id} is of an unexpected type ${element.nodeName}`);
    }

    return element;
}

/** Build HTML content in a somewhat JSX-y way. */
export function buildHtml<T extends keyof HTMLElementTagNameMap>(
    name: T,
    properties: Partial<HTMLElementTagNameMap[T]> = {},
    ...children: (string | HTMLElement)[]
): HTMLElementTagNameMap[T] {
    const element = Object.assign(document.createElement(name), properties);

    // This is stupid but templates don't ever have children themselves.
    if (element instanceof HTMLTemplateElement) {
        element.content.append(...children);
    } else {
        element.append(...children);
    }

    return element;
}

/**
 * Base class for templated custom elements that helps with some common patterns.
 *
 * I'm admittably not the biggest fan of this strict OOP-y approach, but dealing with the event
 * listener lifecycle and mounting the shadow DOM for templates/slots is too much noise elsewhere.
 */
export class TemplatedElement extends HTMLElement {
    /**
     * This class is fundamentally for using templates and slots, so the shadow root is always
     * mounted, including before subclass property initializers and constructor.
     */
    override shadowRoot: ShadowRoot;

    /** Cancellation context for removing event listeners. */
    #dismountController = new AbortController();

    /** Initialize the component by attaching the template content to the shadow root. */
    constructor(template: HTMLTemplateElement) {
        super();
        this.shadowRoot = this.attachShadow({ mode: "open" });
        this.shadowRoot.appendChild(template.content.cloneNode(true));
    }

    /** Add content that acts akin to template variables. */
    protected attachSlots(entries: Record<string, HTMLElement | string>): void {
        this.append(
            ...Object.entries(entries).map(([name, item]) =>
                // Wrap strings in span in order to use as a slot.
                item instanceof HTMLElement
                    ? Object.assign(item, { slot: name })
                    : buildHtml("span", { slot: name, innerText: item }),
            ),
        );
    }

    /**
     * Helper to connect events while binding them to the class instance and registering
     * an abort signal utilized to remove the listeners on component dismount.
     */
    protected connectEvent<T extends keyof HTMLElementEventMap>(
        type: T,
        target: HTMLElement,
        handler: (this: this, event: HTMLElementEventMap[T]) => Promise<void> | void,
    ): void {
        target.addEventListener(type, (event) => handler.call(this, event), {
            signal: this.#dismountController.signal,
        });
    }

    /** Sanity check that named slots match. */
    #assertSlotCorrectness(): void {
        // Collect defined slot names originating from the template.
        const defined = new Set<string>();
        for (const element of this.shadowRoot.querySelectorAll("slot")) {
            defined.add(element.name);
        }

        // Collect slot names from elements that have been attached as such.
        const assigned = new Set<string>();
        for (const element of this.querySelectorAll("[slot]")) {
            assigned.add(element.slot);
        }

        // Ensure that both sets are identical (browsers don't warn about this).
        const mismatched = defined.symmetricDifference(assigned);
        if (mismatched.size !== 0) {
            throw new Error("templated element has mismatched slots", { cause: mismatched });
        }
    }

    /** Function called by browser engine on element mount. */
    connectedCallback(): void {
        this.#assertSlotCorrectness();
    }

    /** Function called by browser engine on element dismount. */
    disconnectedCallback(): void {
        // Trigger graceful removal of registered event listeners.
        this.#dismountController.abort();
    }
}

/** Create a reactive store connected to the URL hash. */
export function reactiveHash(): Store<string> {
    return new Store((store, signal) => {
        store.set(window.location.hash);
        store.subscribe((value) => window.history.pushState(undefined, "", value), signal);
        window.addEventListener("hashchange", (_) => store.set(window.location.hash), {
            signal,
        });
    });
}
