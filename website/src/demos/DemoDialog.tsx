import { useEffect, useId, useRef, type ReactNode } from 'react';
import type { GamepadService } from 'gamepad-controller';

/** Requires native dialog support; explicit scope also covers browsers without :modal matching. */
export function DemoDialog({
    title,
    service,
    opener,
    fallback,
    onClose,
    children,
}: {
    title: string;
    service: GamepadService | null;
    opener: HTMLElement | null;
    fallback: () => HTMLElement | null;
    onClose: () => void;
    children: ReactNode;
}) {
    const dialog = useRef<HTMLDialogElement>(null);
    const heading = useId();
    const latest = useRef({ opener, fallback, onClose });
    latest.current = { opener, fallback, onClose };
    useEffect(() => {
        const node = dialog.current!;
        node.showModal();
        node.querySelector<HTMLButtonElement>('button')?.focus();
        return () => {
            node.close();
        };
    }, []);
    useEffect(() => {
        const node = dialog.current!;
        // Discover newly committed modal controls before constraining the old background registry.
        service?.refresh();
        service?.setActiveScope(node);
        service?.refresh();
        return () => {
            service?.clearActiveScope();
            service?.refresh();
            if (!node.open) {
                const previous = latest.current.opener;
                const eligible =
                    previous?.isConnected &&
                    !previous.closest('[inert], [hidden]') &&
                    !previous.matches(':disabled') &&
                    previous.getClientRects().length > 0;
                (eligible ? previous : latest.current.fallback())?.focus();
            }
        };
    }, [service]);
    return (
        <dialog
            ref={dialog}
            className="demo-dialog"
            aria-labelledby={heading}
            onCancel={(event) => {
                event.preventDefault();
                latest.current.onClose();
            }}
        >
            <div className="demo-dialog-heading">
                <h3 id={heading}>{title}</h3>
                <button className="button secondary" onClick={onClose}>
                    Close
                </button>
            </div>
            {children}
        </dialog>
    );
}
