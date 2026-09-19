import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { GamepadService, type GamepadActionEvent } from 'gamepad-ui-engine';
import type { Variant } from '../components/molecules/Controller/Controller';
import { sendSnapshot } from '../simulation';
import {
    controllerPreviewFromSnapshot,
    NativePreviewSelector,
    neutralControllerPreview,
    resolvePreviewVisualStyle,
    type PreviewVisualChoice,
} from './controller-preview';

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
    const [preview, setPreview] = useState(() => neutralControllerPreview(source));
    // The model selector is useful before a session starts, so begin with the Xbox
    // presentation instead of a neutral arcade fallback.
    const [visualOverride, setVisualOverride] = useState<PreviewVisualChoice>('xbox');
    const [focused, setFocused] = useState(-1);
    const [log, setLog] = useState<string[]>([]);
    const [error, setError] = useState('');
    const held = useRef(new Set<number>());
    const heldValues = useRef(new Map<number, number>());
    const heldAxes = useRef([0, 0, 0, 0]);
    const nativeSelector = useRef(new NativePreviewSelector());
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
        nativeSelector.current.reset();
        setPreview(neutralControllerPreview(source));
        service.on('focus', (_, index) => setFocused(index));
        service.on('action', (event) => logEvent(event.type + (event.direction ? ' · ' + event.direction : '')));
        service.on('controllerconnect', (gp) => {
            logEvent('controller connected');
        });
        service.on('controllerdisconnect', () => {
            held.current.clear();
            heldValues.current.clear();
            heldAxes.current = [0, 0, 0, 0];
            if (source === 'simulation') setPreview(neutralControllerPreview(source));
            logEvent('controller disconnected');
        });
        service.on('gamepaderror', (e) => setError(e.message));
        service.on('beforeaction', (event) => handlers.current.forEach((handler) => handler(event)));
        const disposeApp = prepareRef.current?.(service);
        service.init();
        setService(service);
        const receivePreviewSnapshot = (event: Event) => {
            const next = controllerPreviewFromSnapshot(
                'simulation',
                (event as CustomEvent<{ gamepad?: unknown }>).detail?.gamepad
            );
            if (next) setPreview(next);
        };
        if (source === 'simulation') window.addEventListener(channel, receivePreviewSnapshot);
        if (source === 'simulation') {
            sendSnapshot(variant, [], [0, 0, 0, 0], channel);
        }
        let frame = 0;
        let previous = '';
        const readHardware = () => {
            try {
                const next = nativeSelector.current.update(navigator.getGamepads?.() ?? []);
                const value = JSON.stringify(next);
                if (value !== previous) {
                    previous = value;
                    setPreview(next);
                }
            } catch (e) {
                nativeSelector.current.reset();
                setPreview(neutralControllerPreview('native'));
                setError(e instanceof Error ? e.message : 'Gamepad input is unavailable.');
                return;
            }
            frame = requestAnimationFrame(readHardware);
        };
        if (source === 'native') frame = requestAnimationFrame(readHardware);
        const release = () => {
            held.current.clear();
            heldValues.current.clear();
            heldAxes.current = [0, 0, 0, 0];
            if (source === 'simulation') sendSnapshot(variant, [], [0, 0, 0, 0], channel);
            setPreview(neutralControllerPreview(source));
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
            if (source === 'simulation') window.removeEventListener(channel, receivePreviewSnapshot);
            held.current.clear();
            heldValues.current.clear();
            heldAxes.current = [0, 0, 0, 0];
            nativeSelector.current.reset();
            cancelAnimationFrame(frame);
            if (source === 'simulation') sendSnapshot(variant, [], [0, 0, 0, 0], channel);
            disposeApp?.();
            service.destroy();
            setService(null);
            setPreview(neutralControllerPreview(source));
            setFocused(-1);
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
    const publishSimulation = () => {
        sendSnapshot(variant, held.current, heldAxes.current, channel, heldValues.current);
    };
    const press = (index: number, value = 1) => {
        if (!serviceRef.current || source !== 'simulation') return;
        if (!Number.isFinite(value) || value < 0 || value > 1) {
            throw new RangeError('Button value must be finite within 0–1.');
        }
        held.current.add(index);
        heldValues.current.set(index, value);
        publishSimulation();
    };
    const release = (index: number) => {
        held.current.delete(index);
        heldValues.current.delete(index);
        if (serviceRef.current && source === 'simulation') publishSimulation();
    };
    const releaseAll = () => {
        held.current.clear();
        heldValues.current.clear();
        heldAxes.current = [0, 0, 0, 0];
        if (serviceRef.current && source === 'simulation') publishSimulation();
        else setPreview(neutralControllerPreview(source));
    };
    const setAxis = (index: number, value: number) => {
        if (!serviceRef.current || source !== 'simulation') return;
        if (!Number.isInteger(index) || index < 0 || index > 3 || !Number.isFinite(value) || Math.abs(value) > 1) {
            throw new RangeError('Axis index must be 0–3 and value must be finite within -1–1.');
        }
        heldAxes.current[index] = value;
        publishSimulation();
    };
    const setButtonValue = (index: number, value: number) => {
        if (!Number.isInteger(index) || index < 0 || index > 16 || !Number.isFinite(value) || value < 0 || value > 1) {
            throw new RangeError('Button index must be 0–16 and value must be finite within 0–1.');
        }
        if (value === 0) release(index);
        else press(index, value);
    };
    const resetInput = () => {
        releaseAll();
        serviceRef.current?.resetInput();
        if (serviceRef.current && source === 'simulation') sendSnapshot(variant, [], [0, 0, 0, 0], channel);
    };
    const pressed = preview.buttons.flatMap((button, index) => (button.pressed ? [index] : []));
    const axes = [...preview.axes];
    return {
        running,
        service,
        device:
            source === 'simulation' && preview.connected
                ? 'Simulated ' + (variant === 'unknown' ? 'arcade' : variant)
                : preview.id,
        pressed,
        axes,
        preview,
        visualOverride,
        visualStyle: resolvePreviewVisualStyle(preview, visualOverride),
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
        setButtonValue,
        setVisualOverride,
        resetInput,
        registerAction,
        logEvent,
    };
}
