import { useEffect, useId, useState } from 'react';
import { getButtonName } from 'gamepad-ui-engine';
import { type Variant } from './components/molecules/Controller/Controller';
import { Controller3D } from './components/molecules/Controller3D/Controller3D';
import { useDemoSession, type DemoSource } from './demos/useDemoSession';
import { Icon } from './components';
type Mode = 'spatial' | 'grid' | 'horizontal';
const tiles = [
    { icon: 'pad', name: 'Cloud arcade', sub: 'Pick up where you left off' },
    { icon: 'screen', name: 'Living room', sub: 'Made for the big screen' },
    { icon: 'layers', name: 'Your library', sub: 'All your worlds, together' },
    { icon: 'bolt', name: 'Quick settings', sub: 'Make yourself at home' },
];
export function Playground({ suspended = false, home = false }: { suspended?: boolean; home?: boolean }) {
    const id = 'demo-' + useId().replace(/[^a-zA-Z0-9]/g, '');
    const [variant, setVariant] = useState<Variant>('xbox');
    const [mode, setMode] = useState<Mode>('spatial');
    const [source, setSource] = useState<DemoSource>('simulation');
    const [selected, setSelected] = useState('');
    const {
        running,
        device,
        pressed,
        axes,
        preview,
        visualStyle,
        setAxis,
        setButtonValue,
        setVisualOverride,
        focused,
        log,
        error,
        start,
        stop,
        press,
        release,
        releaseAll,
        logEvent,
        registerAction,
    } = useDemoSession({ containerId: id, variant, mode, source });
    useEffect(() => {
        if (suspended && running) stop();
    }, [suspended, running]);
    useEffect(
        () =>
            registerAction((event) => {
                const active = document.activeElement;
                if (
                    active instanceof HTMLElement &&
                    active.closest('.prototype-controls, .standard-button-controls')
                ) {
                    event.preventDefault();
                }
            }),
        [registerAction]
    );
    const artVariant: Variant =
        visualStyle === 'playstation' ? 'playstation' : visualStyle === 'xbox' ? 'xbox' : 'unknown';
    const standardLabels = [
        artVariant === 'playstation' ? 'Cross' : artVariant === 'xbox' ? 'A' : 'Button 0',
        artVariant === 'playstation' ? 'Circle' : artVariant === 'xbox' ? 'B' : 'Button 1',
        artVariant === 'playstation' ? 'Square' : artVariant === 'xbox' ? 'X' : 'Button 2',
        artVariant === 'playstation' ? 'Triangle' : artVariant === 'xbox' ? 'Y' : 'Button 3',
        'Left bumper',
        'Right bumper',
        'Left trigger',
        'Right trigger',
        'Back / Create',
        'Start / Options',
        'Left stick click',
        'Right stick click',
        'D-pad up',
        'D-pad down',
        'D-pad left',
        'D-pad right',
        'System button',
    ];
    const simulatedButton = (index: number, label: string) => (
        <button
            key={index}
            className="pad-key"
            disabled={!running || source !== 'simulation'}
            aria-label={'Simulate ' + label}
            onPointerDown={(e) => {
                e.preventDefault();
                e.currentTarget.setPointerCapture(e.pointerId);
                press(index);
            }}
            onPointerUp={() => release(index)}
            onPointerCancel={() => release(index)}
            onLostPointerCapture={() => release(index)}
            onKeyDown={(e) => {
                if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
                    e.preventDefault();
                    press(index);
                }
            }}
            onKeyUp={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    release(index);
                }
            }}
            onBlur={() => release(index)}
        >
            {label}
        </button>
    );
    return (
        <div className="playground">
            <div className="playground-toolbar">
                <div className="preview-title">
                    <span className={'status-dot ' + (running && device ? 'on' : '')} />
                    <strong>Interactive preview</strong>
                    <span className="mono live-label">
                        {running
                            ? source === 'simulation'
                                ? 'SIMULATED INPUT'
                                : device
                                  ? 'HARDWARE CONNECTED'
                                  : 'AWAITING CONTROLLER'
                            : 'READY TO EXPLORE'}
                    </span>
                </div>
                <button
                    className={'button small ' + (running ? 'secondary' : 'primary')}
                    data-home-playground-start={home ? '' : undefined}
                    disabled={suspended}
                    onClick={() => {
                        if (running) stop();
                        else {
                            setSelected('');
                            start();
                        }
                    }}
                >
                    {running ? 'Stop demo' : 'Start demo'}
                    <Icon name={running ? 'close' : 'arrow'} size={14} />
                </button>
            </div>
            <div className="playground-controls">
                <div className="segmented" aria-label="Controller model">
                    {(['xbox', 'playstation', 'unknown'] as Variant[]).map((v) => (
                        <button
                            key={v}
                            aria-pressed={
                                (v === 'xbox' && visualStyle === 'xbox') ||
                                (v === 'playstation' && visualStyle === 'playstation') ||
                                (v === 'unknown' && visualStyle === 'generic')
                            }
                            onClick={() => {
                                if (source === 'simulation') setVariant(v);
                                // Keep the selected model and its visible controller in sync.
                                setVisualOverride(v === 'playstation' ? 'ps5' : v === 'xbox' ? 'xbox' : 'generic');
                            }}
                        >
                            {v === 'unknown' ? 'Arcade' : v === 'xbox' ? 'Xbox' : 'PlayStation'}
                        </button>
                    ))}
                </div>
                <label>
                    Input{' '}
                    <select value={source} onChange={(e) => setSource(e.target.value as DemoSource)}>
                        <option value="simulation">Simulated input</option>
                        <option value="native">Native controller</option>
                    </select>
                </label>
                <label>
                    Mode{' '}
                    <select value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
                        <option value="spatial">Spatial</option>
                        <option value="grid">Grid</option>
                        <option value="horizontal">Horizontal</option>
                    </select>
                </label>
            </div>
            <div className="playground-body">
                <div className="hardware-preview">
                    <div className="panel-eyebrow">
                        <span>CONTROLLER INPUT</span>
                        <span>{visualStyle === 'playstation' ? 'PS5 STYLE' : visualStyle.toUpperCase()}</span>
                    </div>
                    <Controller3D running={running} variant={artVariant} visualStyle={visualStyle} preview={preview} />
                    <div className="axis-readouts">
                        <span>
                            LX <b>{(axes[0] || 0).toFixed(2)}</b>
                        </span>
                        <span>
                            LY <b>{(axes[1] || 0).toFixed(2)}</b>
                        </span>
                        <span>
                            RX <b>{(axes[2] || 0).toFixed(2)}</b>
                        </span>
                        <span>
                            RY <b>{(axes[3] || 0).toFixed(2)}</b>
                        </span>
                    </div>
                    <p className="device-label">
                        {running
                            ? device || 'Connect a controller and press any button.'
                            : 'Start a session to see input in real time.'}
                    </p>
                    <div className="prototype-controls">
                        {['Left stick X', 'Left stick Y', 'Right stick X', 'Right stick Y'].map((label, index) => (
                            <label key={label}>
                                <span>{label}</span>
                                <input
                                    type="range"
                                    min="-1"
                                    max="1"
                                    step="0.05"
                                    value={axes[index] || 0}
                                    disabled={!running || source !== 'simulation'}
                                    onChange={(event) => setAxis(index, Number(event.target.value))}
                                />
                            </label>
                        ))}
                        {['Left trigger', 'Right trigger'].map((label, offset) => (
                            <label key={label}>
                                <span>{label}: {(preview.buttons[offset + 6]?.value || 0).toFixed(2)}</span>
                                <input
                                    aria-label={label + ' analog value'}
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={preview.buttons[offset + 6]?.value || 0}
                                    disabled={!running || source !== 'simulation'}
                                    onChange={(event) => setButtonValue(offset + 6, Number(event.target.value))}
                                />
                            </label>
                        ))}
                        <button className="pad-key" disabled={!running || source !== 'simulation'} onClick={releaseAll}>
                            Center controls
                        </button>
                    </div>
                    <div className="standard-button-controls" aria-label="Standard controller buttons">
                        {standardLabels.map((label, index) => simulatedButton(index, label))}
                    </div>
                </div>
                <div className="navigation-preview">
                    <div className="panel-eyebrow">
                        <span>NAVIGATION SANDBOX</span>
                        <span>{focused < 0 ? '—' : 'NODE 0' + (focused + 1)}</span>
                    </div>
                    <div
                        id={id}
                        className={'demo-grid mode-' + mode}
                        onKeyDown={(e) => {
                            const keys: Record<string, number> = {
                                ArrowUp: 12,
                                ArrowDown: 13,
                                ArrowLeft: 14,
                                ArrowRight: 15,
                                Enter: 0,
                            };
                            if (running && source === 'simulation' && e.key in keys) {
                                e.preventDefault();
                                if (!e.repeat) press(keys[e.key]!);
                            }
                        }}
                        onKeyUp={(e) => {
                            const keys: Record<string, number> = {
                                ArrowUp: 12,
                                ArrowDown: 13,
                                ArrowLeft: 14,
                                ArrowRight: 15,
                                Enter: 0,
                            };
                            if (running && source === 'simulation' && e.key in keys) {
                                e.preventDefault();
                                release(keys[e.key]!);
                            }
                        }}
                        onBlur={(e) => {
                            if (!e.currentTarget.contains(e.relatedTarget)) {
                                releaseAll();
                            }
                        }}
                    >
                        {tiles.map((tile) => (
                            <button
                                key={tile.name}
                                className="demo-tile"
                                onClick={() => {
                                    setSelected(tile.name);
                                    logEvent('opened · ' + tile.name);
                                }}
                            >
                                <Icon name={tile.icon} size={26} />
                                <strong>{tile.name}</strong>
                                <span>{tile.sub}</span>
                                <span className="tile-arrow" aria-hidden="true">
                                    ↗
                                </span>
                            </button>
                        ))}
                    </div>
                    <div className="selection-output" role="status">
                        {selected ? 'Selected: ' + selected : 'Your next destination is one move away.'}
                    </div>
                </div>
            </div>
            <div className="playground-bottom">
                <div className="simulation-keys">
                    {simulatedButton(14, '←')}
                    {simulatedButton(12, '↑')}
                    {simulatedButton(13, '↓')}
                    {simulatedButton(15, '→')}
                    {simulatedButton(
                        0,
                        variant === 'playstation' ? '× Select' : variant === 'unknown' ? '1 Select' : 'A Select'
                    )}
                    <span>
                        {source === 'simulation'
                            ? 'On-screen controls · or arrow keys on a tile'
                            : 'Left stick / D-pad to move · primary button to select'}
                    </span>
                </div>
                <span className="mono">
                    {pressed.length ? pressed.map((i) => getButtonName(i, variant)).join(' + ') : 'INPUT IDLE'}
                </span>
            </div>
            {error && (
                <p className="input-error" role="alert">
                    {error}
                </p>
            )}
            <details className="event-log">
                <summary>
                    Event log <span>{log.length} recent events</span>
                </summary>
                <ol aria-label="Recent gamepad events">
                    {log.length ? (
                        log.map((entry, i) => (
                            <li key={i}>
                                <span className="mint">›</span> {entry}
                            </li>
                        ))
                    ) : (
                        <li>Start the demo and send an input to see service events.</li>
                    )}
                </ol>
            </details>
        </div>
    );
}
