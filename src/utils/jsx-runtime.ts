import { buildHtml } from "@common/dom";

type OneOrMany<T> = T | T[];
type PropertiesOf<T extends keyof HTMLElementTagNameMap> = Omit<
    HTMLElementTagNameMap[T],
    "children"
> & { children: OneOrMany<HTMLElement | string> };

function asArray<T>(children?: OneOrMany<T>): T[] {
    if (Array.isArray(children)) {
        return children;
    } else if (children !== undefined) {
        return [children];
    } else {
        return [];
    }
}

export function Fragment({
    children,
}: {
    children?: OneOrMany<HTMLElement | string>;
}): DocumentFragment {
    const out = document.createDocumentFragment();
    out.append(...asArray(children));
    return out;
}

export function jsx<T extends keyof HTMLElementTagNameMap>(
    kind: T,
    { children, ...properties }: Partial<PropertiesOf<T>> = {},
): HTMLElementTagNameMap[T] {
    // @ts-expect-error we're being too strict to make this type check
    return buildHtml(kind, properties, ...asArray(children));
}

export { jsx as jsxs };

declare global {
    namespace JSX {
        type IntrinsicElements = {
            [T in keyof HTMLElementTagNameMap]: Partial<PropertiesOf<T>>;
        };

        type Element = HTMLElement;
        type ElementChildrenAttribute = {
            // biome-ignore lint/complexity/noBannedTypes: weird hardcoded tsc oddities
            children: {};
        };
    }
}
