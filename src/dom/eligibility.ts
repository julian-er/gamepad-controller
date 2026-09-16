/** Shared, action-time DOM eligibility rules for every navigation path. */
export function isEligibleElement(
    element: Element,
    options: { onlyViewport?: boolean },
    scope: Element | null = null
): boolean {
    if (!(element instanceof HTMLElement) || !element.isConnected || element.ownerDocument !== document) return false;
    if (scope && !scope.contains(element)) return false;
    if (
        element.matches('[disabled], [hidden], [inert]') ||
        element.closest('[disabled], [hidden], [inert], fieldset[disabled]')
    )
        return false;
    for (let ancestor: HTMLElement | null = element; ancestor; ancestor = ancestor.parentElement) {
        const style = window.getComputedStyle(ancestor);
        if (
            style.display === 'none' ||
            style.visibility === 'hidden' ||
            style.visibility === 'collapse' ||
            style.opacity === '0'
        )
            return false;
    }
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    if (!options.onlyViewport) return true;
    return rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth;
}

export function activeNativeModal(): Element | null {
    const focused = document.activeElement?.closest?.('dialog[open]');
    if (focused) {
        try {
            if (focused.matches(':modal')) return focused;
        } catch {
            /* unsupported selector */
        }
    }
    const dialogs = Array.from(document.querySelectorAll('dialog[open]'));
    // Top-layer dialogs are opened in stack order; later candidates are the fallback topmost.
    for (let i = dialogs.length - 1; i >= 0; i--) {
        const dialog = dialogs[i];
        if (!dialog) continue;
        try {
            if (dialog.matches(':modal')) return dialog;
        } catch {
            /* unsupported selector */
        }
    }
    return null;
}
