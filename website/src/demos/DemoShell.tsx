import { useEffect, useId, useState, type ComponentType, type KeyboardEvent } from 'react';
import { Controller, type Variant } from '../components/molecules/Controller/Controller';
import { useDemoSession, type DemoSource } from './useDemoSession';
import type { DemoDefinition } from './registry';
export type DemoAppProps = { session: ReturnType<typeof useDemoSession>; onReset: () => void };
function ownsKeyboard(event: KeyboardEvent) {
    return (
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !(
            event.target instanceof Element &&
            event.target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])')
        )
    );
}
export function DemoShell({
    demo,
    app: App,
    suspended = false,
}: {
    demo: DemoDefinition;
    app: ComponentType<DemoAppProps>;
    suspended?: boolean;
}) {
    const containerId = 'project-' + useId().replace(/[^a-zA-Z0-9]/g, '');
    const [variant, setVariant] = useState<Variant>('xbox');
    const [source, setSource] = useState<DemoSource>('simulation');
    const [round, setRound] = useState(0);
    const [showController] = useState(() => !window.matchMedia?.('(max-width: 700px)').matches);
    const session = useDemoSession({
        containerId,
        variant,
        source,
        mode: demo.mode,
        enableBack: demo.back,
        enableScroll: demo.scroll,
        useDataAttributes: true,
    });
    const { running, stop } = session;
    useEffect(() => {
        if (suspended && running) stop();
    }, [suspended, running, stop]);
    const reset = () => {
        session.resetInput();
        setRound((value) => value + 1);
    };
    const keys: Record<string, number> = {
        ArrowUp: 12,
        ArrowDown: 13,
        ArrowLeft: 14,
        ArrowRight: 15,
        Enter: 0,
        ...(demo.back ? { Escape: 1 } : {}),
    };
    const controls: [number, string][] = [
        [14, 'Left'],
        [12, 'Up'],
        [13, 'Down'],
        [15, 'Right'],
        [0, 'Select'],
        ...(demo.back ? [[1, 'Back'] as [number, string]] : []),
    ];
    return (
        <section className="demo-shell" aria-label={demo.title + ' interactive example'}>
            <div className="demo-session-toolbar">
                <strong>{running ? 'Session running' : 'Session stopped'}</strong>
                <div>
                    <button
                        className="button primary"
                        disabled={suspended}
                        onClick={() => (running ? stop() : session.start())}
                    >
                        {running ? 'Stop demo' : 'Start demo'}
                    </button>
                    <button className="button secondary" onClick={reset}>
                        Reset example
                    </button>
                </div>
            </div>
            <p className="demo-instructions">
                {demo.challenge} Use a controller or start simulated input. Click or use Tab and Enter at any time.
            </p>
            <div className="demo-experience">
                <div
                    id={containerId}
                    className={'demo-app-surface app-' + demo.id}
                    onKeyDown={(event) => {
                        if (running && source === 'simulation' && event.key in keys && ownsKeyboard(event)) {
                            event.preventDefault();
                            if (!event.repeat) session.press(keys[event.key]!);
                        }
                    }}
                    onKeyUp={(event) => {
                        if (running && source === 'simulation' && event.key in keys && ownsKeyboard(event)) {
                            event.preventDefault();
                            session.release(keys[event.key]!);
                        }
                    }}
                    onBlur={(event) => {
                        if (!event.currentTarget.contains(event.relatedTarget)) session.releaseAll();
                    }}
                >
                    <App key={round} session={session} onReset={reset} />
                </div>
                <aside className="demo-device">
                    <details open={showController}>
                        <summary>Controller &amp; input</summary>
                        <Controller variant={variant} pressed={session.pressed} axes={session.axes} />
                        <p>{session.device || 'Connect hardware, or try simulated input.'}</p>
                        <label>
                            Input{' '}
                            <select value={source} onChange={(event) => setSource(event.target.value as DemoSource)}>
                                <option value="simulation">Simulated input</option>
                                <option value="native">Native controller</option>
                            </select>
                        </label>
                        <label>
                            Preview{' '}
                            <select value={variant} onChange={(event) => setVariant(event.target.value as Variant)}>
                                <option value="xbox">Xbox</option>
                                <option value="playstation">PlayStation</option>
                                <option value="unknown">Arcade</option>
                            </select>
                        </label>
                    </details>
                </aside>
            </div>
            <div className="demo-pad" aria-label="Simulated controller">
                {controls.map(([index, label]) => (
                    <button
                        key={index}
                        disabled={!running || source !== 'simulation'}
                        aria-label={'Simulate ' + label}
                        onPointerDown={(event) => {
                            event.preventDefault();
                            event.currentTarget.setPointerCapture(event.pointerId);
                            session.press(index);
                        }}
                        onPointerUp={() => session.release(index)}
                        onPointerCancel={() => session.release(index)}
                        onLostPointerCapture={() => session.release(index)}
                        onBlur={() => session.release(index)}
                        onKeyDown={(event) => {
                            if (['Enter', ' '].includes(event.key)) {
                                event.preventDefault();
                                if (!event.repeat) session.press(index);
                            }
                        }}
                        onKeyUp={(event) => {
                            if (['Enter', ' '].includes(event.key)) {
                                event.preventDefault();
                                session.release(index);
                            }
                        }}
                    >
                        {label}
                    </button>
                ))}
            </div>
            {demo.scroll && (
                <div className="demo-pad demo-scroll-pad" aria-label="Simulated right stick">
                    <span>Right stick</span>
                    {(
                        [
                            [3, -1, 'Scroll up'],
                            [3, 1, 'Scroll down'],
                            [2, -1, 'Scroll left'],
                            [2, 1, 'Scroll right'],
                        ] as const
                    ).map(([axis, value, label]) => (
                        <button
                            key={label}
                            aria-label={label}
                            disabled={!running || source !== 'simulation'}
                            onPointerDown={(event) => {
                                event.preventDefault();
                                event.currentTarget.setPointerCapture(event.pointerId);
                                session.setAxis(axis, value);
                            }}
                            onPointerUp={() => session.setAxis(axis, 0)}
                            onPointerCancel={() => session.setAxis(axis, 0)}
                            onLostPointerCapture={() => session.setAxis(axis, 0)}
                            onBlur={() => session.setAxis(axis, 0)}
                            onKeyDown={(event) => {
                                if (['Enter', ' '].includes(event.key)) {
                                    event.preventDefault();
                                    if (!event.repeat) session.setAxis(axis, value);
                                }
                            }}
                            onKeyUp={(event) => {
                                if (['Enter', ' '].includes(event.key)) {
                                    event.preventDefault();
                                    session.setAxis(axis, 0);
                                }
                            }}
                        >
                            {label}
                        </button>
                    ))}
                    <span className="mono">
                        RX {session.axes[2]?.toFixed(2)} · RY {session.axes[3]?.toFixed(2)}
                    </span>
                </div>
            )}
            <p className="demo-session-note" role="status">
                {suspended
                    ? 'Session stopped while documentation navigation is open.'
                    : running
                      ? 'Arrow keys move · Enter selects' +
                        (demo.back ? ' · Back / Escape is handled inside this example.' : '')
                      : 'Start when ready. Leaving the page or window stops input; return and start a fresh session.'}
            </p>
            {session.error && <p role="alert">{session.error}</p>}
            <details className="event-log">
                <summary>Event log · {session.log.length} recent events</summary>
                <ol>
                    {session.log.map((entry, index) => (
                        <li key={index}>{entry}</li>
                    ))}
                </ol>
            </details>
        </section>
    );
}
