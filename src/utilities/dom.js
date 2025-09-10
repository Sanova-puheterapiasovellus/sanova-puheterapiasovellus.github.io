/**
 * Find a fundamentally required element beneath the given parent, throwing an exception
 * if it isn't found or the type doesn't match.
 *
 * @template {HTMLElement} T
 * @param {string} query
 * @param {new (...args: unknown[]) => T} kind
 * @param {ParentNode} parent
 * @returns {T}
 */
export function expectElement(query, kind, parent) {
    const element = parent.querySelector(query);
    if (element === null) {
        throw new Error(`couldn't find element for ${query}`);
    }

    if (!(element instanceof kind)) {
        throw new Error(`element for ${query} is of an unexpected type ${element.nodeName}`);
    }

    return element;
}

/**
 * Base class for custom elements that helps with some common patterns.
 *
 * I'm admittably not the biggest fan of this strict OOP-y approach, but dealing with the event
 * listener lifecycle and mounting the shadow DOM for templates/slots is too much noise elsewhere.
 */
export class BaseComponent extends HTMLElement {
    /**
     * Our components are templated so we know that the shadow root is always mounted,
     * including before subclass property initializers and constructor.
     *
     * @override
     * @type {ShadowRoot}
     */
    shadowRoot;

    /** Cancellation context for removing event listeners. */
    #dismountController = new AbortController();

    /**
     * Initialize the component by attaching the template content to the shadow root.
     *
     * @param {HTMLTemplateElement} template
     */
    constructor(template) {
        super();
        this.shadowRoot = this.attachShadow({ mode: "open" });
        this.shadowRoot.appendChild(template.content.cloneNode(true));
    }

    /**
     * Helper to connect events while binding them to the class instance and registering
     * an abort signal utilized to remove the listeners on component dismount.
     *
     * @protected
     * @template {keyof HTMLElementEventMap} T
     * @param {T} type
     * @param {HTMLElement} target
     * @param {(this: this, event: HTMLElementEventMap[T]) => Promise<void> | void} handler
     * @returns {void}
     */
    connectEvent(type, target, handler) {
        target.addEventListener(type, (event) => handler.call(this, event), {
            signal: this.#dismountController.signal,
        });
    }

    /**
     * Function called by the browser element on component dismount.
     *
     * @returns {void}
     */
    disconnectedCallback() {
        this.#dismountController.abort();
    }
}
