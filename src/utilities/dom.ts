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
