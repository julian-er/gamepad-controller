import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { GamepadService, type GamepadActionEvent } from 'gamepad-controller';
import type { Variant } from '../components/molecules/Controller/Controller';
import { sendSnapshot } from '../simulation';

export type DemoSource = 'simulation' | 'native';
export type DemoMode = 'spatial' | 'grid' | 'horizontal';
type Options = {
    containerId: string;
    variant: Variant;
    mode: DemoMode;
    source: DemoSource;
    enableBack?: boolean;
    enableShoulders?: boolean;
    enableScroll?: boolean;
    stopOnSuspend?: boolean;
    useDataAttributes?: boolean;
    prepare?: (service: GamepadService) => void | (() => void);
};

/** Owns one public service lifecycle. App policy and targets can register before init via prepare. */
export function useDemoSession({
    containerId: id,
    variant,
    mode,
    source,
    enableBack = false,
    enableShoulders = false,
    enableScroll = false,
    stopOnSuspend = true,
    useDataAttributes = false,
    prepare,
}: Options) {
    const instance = useId().replace(/[^a-zA-Z0-9]/g, '');
    const [generation, setGeneration] = useState(0);
    const epoch = useRef(0);
    const [channel, setChannel] = useState('');
    const [running, setRunning] = useState(false);
    const [service, setService] = useState<GamepadService | null>(null);
    const [device, setDevice] = useState('');
    const [pressed, setPressed] = useState<number[]>([]);
    const [axes, setAxes] = useState([0, 0, 0, 0]);
    const [focused, setFocused] = useState(-1);
    const [log, setLog] = useState<string[]>([]);
    const [error, setError] = useState('');
    const held = useRef(new Set<number>());
    const heldAxes = useRef([0, 0, 0, 0]);
    const serviceRef = useRef<GamepadService | null>(null);
    const prepareRef = useRef(prepare);
    prepareRef.current = prepare;
    const handlers = useRef(new Set<(event: GamepadActionEvent) => void>());
    const registerAction = useCallback((handler: (event: GamepadActionEvent) => void) => {
        handlers.current.add(handler);
        return () => {
            handlers.current.delete(handler);
        };
    }, []);
    const logEvent = useCallback((entry: string) => setLog((prev) => [entry, ...prev].slice(0, 5)), []);
    useEffect(() => {
        if (!running) return;
        const channel = `docs-gamepad-${instance}-${++epoch.current}`;
        setChannel(channel);
        const service = new GamepadService({
            containerSelector: '#' + id,
            navigationMode: mode,
            useCustomEvents: source === 'simulation',
            customStateChangedEvent: channel,
            customConnectedEvent: channel + '-connect',
            customDisconnectedEvent: channel + '-disconnect',
            enableBackButton: enableBack,
            enableShoulderNavigation: enableShoulders,
            enableRightStickScroll: enableScroll,
            autoAddStyles: false,
            useDataAttributes,
            focusedClass: 'demo-focused',
            selectedClass: 'demo-selected',
            scrollBehavior: 'auto',
        });
        serviceRef.current = service;
        setError('');

        setLog([]);
        setDevice('');
        setAxes([0, 0, 0, 0]);
        setPressed([]);
        service.on('focus', (_, index) => setFocused(index));
        service.on('action', (event) => logEvent(event.type + (event.direction ? ' · ' + event.direction : '')));
        service.on('controllerconnect', (gp) => {
            setDevice(gp.id);
            logEvent('controller connected');
        });
        service.on('controllerdisconnect', () => {
            held.current.clear();
            heldAxes.current = [0, 0, 0, 0];
            setDevice('');
            setPressed([]);
            setAxes([0, 0, 0, 0]);
            logEvent('controller disconnected');
        });
        service.on('buttondown', (index) => {
            setPressed((p) => [...new Set([...p, index])]);
        });
        service.on('buttonup', (index) => {
            setPressed((p) => p.filter((i) => i !== index));
        });
        service.on('gamepaderror', (e) => setError(e.message));
        service.on('beforeaction', (event) => handlers.current.forEach((handler) => handler(event)));
        const disposeApp = prepareRef.current?.(service);
        service.init();
        setService(service);
        if (source === 'simulation') {
            sendSnapshot(variant, [], [0, 0, 0, 0], channel);
            setDevice('Simulated ' + (variant === 'unknown' ? 'arcade' : variant));
        }
        let frame = 0;
        let previous = '';
        const readHardware = () => {
            try {
                const pads = Array.from(navigator.getGamepads?.() ?? []).filter((pad): pad is Gamepad => !!pad);
                const pad =
                    pads.find((p) => p.buttons.some((b) => b.pressed) || p.axes.some((a) => Math.abs(a) > 0.1)) ??
                    pads[0];
                const value = JSON.stringify(pad ? [pad.id, ...pad.axes.map((a) => +a.toFixed(2))] : []);
                if (value !== previous) {
                    previous = value;
                    setDevice(pad?.id ?? '');
                    setAxes(pad ? [...pad.axes] : [0, 0, 0, 0]);
                    if (!pad) setPressed([]);
                }
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Gamepad input is unavailable.');
                return;
            }
            frame = requestAnimationFrame(readHardware);
        };
        if (source === 'native') frame = requestAnimationFrame(readHardware);
        const release = () => {
            held.current.clear();
            heldAxes.current = [0, 0, 0, 0];
            if (source === 'simulation') sendSnapshot(variant, [], [0, 0, 0, 0], channel);
            setPressed([]);
            setAxes([0, 0, 0, 0]);
        };
        const visibility = () => {
            if (document.hidden) suspend();
        };
        const suspend = () => {
            release();
            if (stopOnSuspend) setRunning(false);
        };
        window.addEventListener('blur', suspend);
        document.addEventListener('visibilitychange', visibility);
        return () => {
            window.removeEventListener('blur', suspend);
            document.removeEventListener('visibilitychange', visibility);
            held.current.clear();
            heldAxes.current = [0, 0, 0, 0];
            cancelAnimationFrame(frame);
            if (source === 'simulation') sendSnapshot(variant, [], [0, 0, 0, 0], channel);
            disposeApp?.();
            service.destroy();
            setService(null);
            setPressed([]);
            setAxes([0, 0, 0, 0]);
            setFocused(-1);
            setDevice('');
            serviceRef.current = null;
        };
    }, [
        running,
        source,
        mode,
        variant,
        id,
        generation,
        instance,
        enableBack,
        enableShoulders,
        enableScroll,
        stopOnSuspend,
        useDataAttributes,
        logEvent,
    ]);
    const press = (index: number) => {
        if (!serviceRef.current || source !== 'simulation') return;
        held.current.add(index);
        sendSnapshot(variant, held.current, heldAxes.current, channel);
    };
    const release = (index: number) => {
        held.current.delete(index);
        if (serviceRef.current && source === 'simulation')
            sendSnapshot(variant, held.current, heldAxes.current, channel);
    };
    const releaseAll = () => {
        held.current.clear();
        heldAxes.current = [0, 0, 0, 0];
        if (serviceRef.current && source === 'simulation') sendSnapshot(variant, [], heldAxes.current, channel);
        setAxes([0, 0, 0, 0]);
        setPressed([]);
    };
    const setAxis = (index: number, value: number) => {
        if (!serviceRef.current || source !== 'simulation') return;
        if (!Number.isInteger(index) || index < 0 || index > 3 || !Number.isFinite(value) || Math.abs(value) > 1) {
            throw new RangeError('Axis index must be 0–3 and value must be finite within -1–1.');
        }
        heldAxes.current[index] = value;
        setAxes([...heldAxes.current]);
        sendSnapshot(variant, held.current, heldAxes.current, channel);
    };
    const resetInput = () => {
        releaseAll();
        serviceRef.current?.resetInput();
        if (serviceRef.current && source === 'simulation') sendSnapshot(variant, [], [0, 0, 0, 0], channel);
    };
    return {
        running,
        service,
        device,
        pressed,
        axes,
        focused,
        log,
        error,
        channel,
        start: () => {
            setGeneration((value) => value + 1);
            setRunning(true);
        },
        stop: () => {
            releaseAll();
            setRunning(false);
        },
        press,
        release,
        releaseAll,
        setAxis,
        resetInput,
        registerAction,
        logEvent,
    };
}
