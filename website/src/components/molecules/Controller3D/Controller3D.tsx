import { useEffect, useRef, useState } from 'react';
import { Controller, type Variant } from '../Controller/Controller';
import type { PreviewVisualStyle } from '../../../demos/controller-preview';
import type { ControllerPreview } from '../../../demos/controller-preview';
import type { Presenter } from './renderer';

type LoadedModules = [typeof import('./renderer'), typeof import('./xbox')];
const loadControllerModules = (visualStyle: PreviewVisualStyle): Promise<LoadedModules> =>
    Promise.all([
        import('./renderer'),
        visualStyle === 'playstation' ? import('./ps5') : import('./xbox'),
    ]);

export function Controller3D({
    running,
    preview,
    variant,
    visualStyle,
    loadModules = loadControllerModules,
    reloadPage = () => location.reload(),
}: {
    running: boolean;
    preview: ControllerPreview;
    variant: Variant;
    visualStyle: PreviewVisualStyle;
    loadModules?: (visualStyle: PreviewVisualStyle) => Promise<LoadedModules>;
    reloadPage?: () => void;
}) {
    const host = useRef<HTMLDivElement>(null);
    const presenter = useRef<Presenter | null>(null);
    const latest = useRef(preview);
    latest.current = preview;
    const [visible, setVisible] = useState(false);
    const [hidden, setHidden] = useState(document.hidden);
    const [display, setDisplay] = useState<'3d' | '2d'>('2d');
    const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
    const [recovery, setRecovery] = useState<'retry' | 'reload'>('retry');
    const [retry, setRetry] = useState(0);
    useEffect(() => {
        if (visualStyle === 'generic') setDisplay('2d');
    }, [visualStyle]);
    useEffect(() => {
        const element = host.current;
        if (!element || typeof IntersectionObserver === 'undefined') return;
        const observer = new IntersectionObserver(([entry]) => setVisible(!!entry?.isIntersecting));
        observer.observe(element);
        const visibility = () => setHidden(document.hidden);
        document.addEventListener('visibilitychange', visibility);
        return () => {
            observer.disconnect();
            document.removeEventListener('visibilitychange', visibility);
        };
    }, []);
    useEffect(() => {
        // Model selection is independent from the input session. A neutral rig can be
        // previewed before Start; Start only begins input/navigation telemetry.
        if (!visible || hidden || display === '2d' || visualStyle === 'generic') {
            setStatus('idle');
            return;
        }
        let cancelled = false;
        setStatus('loading');
        // Neither renderer nor model (nor their Three.js dependency) belongs to the cold route.
        loadModules(visualStyle)
            .then(async ([render, model]) => {
                if (cancelled || !host.current) return;
                let rig;
                try {
                    rig = await model.createModel();
                } catch {
                    if (!cancelled) {
                        setRecovery('retry');
                        setStatus('error');
                    }
                    return;
                }
                if (cancelled || !host.current) {
                    render.disposeRig(rig);
                    return;
                }
                const instance = render.createPresenter(host.current, rig, () => {
                    if (!cancelled) {
                        presenter.current?.dispose();
                        presenter.current = null;
                        setRecovery('retry');
                        setStatus('error');
                    }
                });
                if (cancelled) {
                    instance.dispose();
                    return;
                }
                presenter.current = instance;
                instance.update(latest.current);
                if (presenter.current === instance) setStatus('ready');
            })
            .catch(() => {
                if (!cancelled) {
                    setRecovery('reload');
                    setStatus('error');
                }
            });
        return () => {
            cancelled = true;
            presenter.current?.dispose();
            presenter.current = null;
        };
    }, [visible, hidden, display, visualStyle, retry, loadModules]);
    useEffect(() => {
        presenter.current?.update(preview);
    }, [preview]);
    const pressed = preview.buttons.flatMap((button, index) => (button.pressed ? [index] : []));
    return (
        <div className="controller-preview-3d">
            <div className="controller-display-options" aria-label="Preview display">
                <button
                    aria-pressed={display === '3d'}
                    disabled={visualStyle === 'generic'}
                    title={visualStyle === 'generic' ? 'Unknown and nonstandard controllers use the raw 2D preview.' : undefined}
                    onClick={() => setDisplay('3d')}
                >
                    3D
                </button>
                <button aria-pressed={display === '2d'} onClick={() => setDisplay('2d')}>
                    2D
                </button>
                <span>
                    {visualStyle === 'xbox'
                        ? 'Xbox Elite · 15.2 MB on request'
                        : visualStyle === 'playstation'
                          ? 'Joystick PS5 · 17.0 MB on request'
                          : 'Raw 2D preview'}
                </span>
            </div>
            <div className="controller-stage">
                <div ref={host} className="controller-canvas" data-status={status} aria-hidden="true" />
                {status !== 'ready' && <Controller variant={variant} pressed={pressed} axes={preview.axes} />}
            </div>
            <p className="controller-render-status" role="status">
                {status === 'loading'
                    ? 'Loading 3D preview…'
                    : status === 'error'
                      ? recovery === 'reload'
                          ? '3D code could not load. Reload this page to try again. Input remains available in 2D.'
                          : '3D unavailable. Input remains available in 2D.'
                      : '\u00a0'}
                {status === 'error' &&
                    (recovery === 'reload' ? (
                        <button onClick={reloadPage}>Reload page</button>
                    ) : (
                        <button onClick={() => setRetry((value) => value + 1)}>Retry 3D</button>
                    ))}
            </p>
            {visualStyle === 'xbox' && (
                <p className="controller-credits">
                    <a
                        href="https://sketchfab.com/3d-models/xbox-elite-controller-32aad0ff25f7446b8afe649ea3cc9e43"
                        target="_blank"
                        rel="noreferrer"
                    >
                        Xbox Elite Controller
                    </a>{' '}
                    by Rusfort ·{' '}
                    <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">
                        CC BY 4.0
                    </a>
                    . Adapted with separated controls and simplified glass.
                </p>
            )}
            {visualStyle === 'playstation' && (
                <p className="controller-credits">
                    <a href="https://sketchfab.com/3d-models/joystick-ps5-01da996f74d3411cb550e9b7c5fb1d72" target="_blank" rel="noreferrer">
                        Joystick PS5
                    </a>{' '}by jalecrz3d ·{' '}
                    <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>.
                    {' '}Normalized for interactive control movement. Not officially endorsed.
                </p>
            )}
            {status === 'ready' && (
                <p className="sr-only">
                    {visualStyle === 'playstation' ? 'PS5 style' : 'Xbox style'}. Pressed: {pressed.join(', ') || 'none'}. Axes:{' '}
                    {preview.axes.map((value) => value.toFixed(2)).join(', ')}. Triggers:{' '}
                    {(preview.buttons[6]?.value || 0).toFixed(2)}, {(preview.buttons[7]?.value || 0).toFixed(2)}.
                </p>
            )}
        </div>
    );
}
