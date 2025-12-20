/**
 * Generates a unique CSS selector for a given element.
 * Prioritizes IDs, data-attributes, and unique classes.
 * Falls back to a structural path if necessary.
 */
export function getUniqueSelector(element: Element): string {
    if (!element || !element.tagName) return '';

    // 1. Try ID
    if (element.id) {
        // Ensure ID is valid and not likely auto-generated (simple heuristic: contains numbers/random chars? maybe too strict, let's trust explicit IDs for now if they look "human")
        // For now, accept all IDs but escape them properly
        return `#${CSS.escape(element.id)}`;
    }

    // 2. Try unique attributes (data-testid, etc.)
    const uniqueAttrs = ['data-testid', 'data-id', 'aria-label', 'name'];
    for (const attr of uniqueAttrs) {
        if (element.hasAttribute(attr)) {
            const val = element.getAttribute(attr);
            if (val) return `[${attr}="${CSS.escape(val)}"]`;
        }
    }

    // 3. Path generation
    const path: string[] = [];
    let current: Element | null = element;

    while (current) {
        let name = current.tagName.toLowerCase();

        if (current.id) {
            path.unshift(`#${CSS.escape(current.id)}`);
            break; // Stop at ID
        }

        // Add specific classes if they look "component-y" (BEM or distinct)
        // Avoid utility classes (Tailwind) if possible, but hard to filter perfectly.
        // Let's rely on nth-child for robustness in non-ID cases mainly.

        let siblingIndex = 1;
        let sibling = current.previousElementSibling;
        while (sibling) {
            if (sibling.tagName.toLowerCase() === name) {
                siblingIndex++;
            }
            sibling = sibling.previousElementSibling;
        }

        if (siblingIndex > 1) {
            name += `:nth-of-type(${siblingIndex})`;
        } else {
            // Check if it's the only child of this tag type, if so, no index needed?
            // Actually, explicitly adding :nth-of-type(1) is safer if siblings *might* appear later.
            // But valid CSS often omits it.
            // Let's check if there ARE other siblings of same type
            let hasNext = false;
            let next = current.nextElementSibling;
            while (next) {
                if (next.tagName.toLowerCase() === current.tagName.toLowerCase()) {
                    hasNext = true;
                    break;
                }
                next = next.nextElementSibling;
            }
            if (hasNext) {
                name += `:nth-of-type(1)`;
            }
        }

        path.unshift(name);
        current = current.parentElement;

        // Safety break for document root
        if (!current || current.tagName === 'BODY' || current.tagName === 'HTML') break;
    }

    return path.join(' > ');
}

/**
 * Retrieves an element based on a selector, safely.
 */
export function getElementBySelector(selector: string, root: Document | Element = document): Element | null {
    try {
        return root.querySelector(selector);
    } catch (e) {
        console.warn("Invalid selector tracking:", selector, e);
        return null;
    }
}
