export const PREVIEW_AXIS_THRESHOLD = 0.15;

export type ControllerFamily = 'xbox' | 'playstation' | 'generic';
export type ControllerModelHint = 'xbox' | 'dualsense' | 'dualshock' | null;
export type PreviewVisualChoice = 'auto' | 'xbox' | 'ps5' | 'generic';
export type PreviewVisualStyle = 'xbox' | 'playstation' | 'generic';
export type PreviewSource = 'simulation' | 'native';

export type PreviewButton = {
    pressed: boolean;
    value: number;
};

export type ControllerPreview = {
    source: PreviewSource;
    connected: boolean;
    index: number | null;
    id: string;
    mapping: string;
    family: ControllerFamily;
    modelHint: ControllerModelHint;
    buttons: PreviewButton[];
    axes: [number, number, number, number];
};

const STANDARD_BUTTON_COUNT = 17;

function finiteUnit(value: number) {
    return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}

function finiteAxis(value: number | undefined) {
    return Number.isFinite(value) ? Math.min(1, Math.max(-1, value!)) : 0;
}

export function identifyController(id: string): Pick<ControllerPreview, 'family' | 'modelHint'> {
    if (/\bdualsense\b/i.test(id)) return { family: 'playstation', modelHint: 'dualsense' };
    if (/\bdualshock\b/i.test(id)) return { family: 'playstation', modelHint: 'dualshock' };
    if (/\bplaystation\b|\bsony interactive entertainment\b/i.test(id)) {
        return { family: 'playstation', modelHint: null };
    }
    if (/\bxbox\b|\bx-box\b/i.test(id)) return { family: 'xbox', modelHint: 'xbox' };
    return { family: 'generic', modelHint: null };
}

export function neutralControllerPreview(source: PreviewSource): ControllerPreview {
    return {
        source,
        connected: false,
        index: null,
        id: '',
        mapping: '',
        family: 'generic',
        modelHint: null,
        buttons: Array.from({ length: STANDARD_BUTTON_COUNT }, () => ({ pressed: false, value: 0 })),
        axes: [0, 0, 0, 0],
    };
}

export function controllerPreview(source: PreviewSource, gamepad: Gamepad): ControllerPreview {
    const identity = identifyController(gamepad.id);
    return {
        source,
        connected: gamepad.connected !== false,
        index: gamepad.index,
        id: gamepad.id,
        mapping: gamepad.mapping,
        ...identity,
        buttons: Array.from({ length: Math.max(STANDARD_BUTTON_COUNT, gamepad.buttons.length) }, (_, index) => {
            const button = gamepad.buttons[index];
            return { pressed: button?.pressed === true, value: finiteUnit(button?.value ?? 0) };
        }),
        axes: [
            finiteAxis(gamepad.axes[0]),
            finiteAxis(gamepad.axes[1]),
            finiteAxis(gamepad.axes[2]),
            finiteAxis(gamepad.axes[3]),
        ],
    };
}

/** Validates and copies an untrusted complete host snapshot for website presentation. */
export function controllerPreviewFromSnapshot(source: PreviewSource, value: unknown): ControllerPreview | null {
    try {
        if (!value || typeof value !== 'object') return null;
        const candidate = value as Record<string, unknown>;
        if (
            typeof candidate.index !== 'number' ||
            !Number.isSafeInteger(candidate.index) ||
            candidate.index < 0 ||
            typeof candidate.id !== 'string' ||
            !Array.isArray(candidate.buttons) ||
            !Array.isArray(candidate.axes)
        ) {
            return null;
        }
        if (candidate.connected !== undefined && typeof candidate.connected !== 'boolean') return null;
        if (candidate.mapping !== undefined && candidate.mapping !== '' && candidate.mapping !== 'standard') return null;
        if (
            candidate.timestamp !== undefined &&
            (typeof candidate.timestamp !== 'number' || !Number.isFinite(candidate.timestamp) || candidate.timestamp < 0)
        ) {
            return null;
        }

        const buttons: GamepadButton[] = [];
        for (const value of candidate.buttons) {
            if (!value || typeof value !== 'object') return null;
            const button = value as Record<string, unknown>;
            if (typeof button.pressed !== 'boolean') return null;
            if (
                button.value !== undefined &&
                (typeof button.value !== 'number' || !Number.isFinite(button.value) || button.value < 0 || button.value > 1)
            ) {
                return null;
            }
            if (button.touched !== undefined && typeof button.touched !== 'boolean') return null;
            buttons.push({
                pressed: button.pressed,
                value: (button.value as number | undefined) ?? 0,
                touched: (button.touched as boolean | undefined) ?? false,
            });
        }

        const axes: number[] = [];
        for (const value of candidate.axes) {
            if (typeof value !== 'number' || !Number.isFinite(value) || value < -1 || value > 1) return null;
            axes.push(value);
        }

        return controllerPreview(source, {
            index: candidate.index,
            id: candidate.id,
            connected: (candidate.connected as boolean | undefined) ?? true,
            mapping: candidate.mapping === 'standard' ? 'standard' : '',
            timestamp: (candidate.timestamp as number | undefined) ?? 0,
            buttons,
            axes,
        } as unknown as Gamepad);
    } catch {
        return null;
    }
}

export function resolvePreviewVisualStyle(
    preview: ControllerPreview,
    choice: PreviewVisualChoice
): PreviewVisualStyle {
    // A disconnected/idle preview has no mapping yet, but a user-selected model
    // should still be previewable before Start. Once native hardware is connected,
    // nonstandard mappings must remain the honest raw generic view.
    if (preview.connected && preview.source === 'native' && preview.mapping !== 'standard') return 'generic';
    if (choice === 'xbox' || choice === 'generic') return choice;
    if (choice === 'ps5') return 'playstation';
    return preview.family === 'xbox' || preview.family === 'playstation' ? preview.family : 'generic';
}

type DeviceSample = ControllerPreview & { timestamp: number };

function sample(gamepad: Gamepad): DeviceSample {
    return { ...controllerPreview('native', gamepad), timestamp: gamepad.timestamp };
}

function sameDevice(previous: DeviceSample, current: DeviceSample) {
    return (
        previous.id === current.id &&
        previous.mapping === current.mapping &&
        current.timestamp >= previous.timestamp
    );
}

function hasNewMeaningfulInput(previous: DeviceSample, current: DeviceSample) {
    const buttonCount = Math.max(previous.buttons.length, current.buttons.length);
    for (let index = 0; index < buttonCount; index++) {
        const before = previous.buttons[index] ?? { pressed: false, value: 0 };
        const after = current.buttons[index] ?? { pressed: false, value: 0 };
        if (before.pressed !== after.pressed || Math.abs(before.value - after.value) > 0.001) return true;
    }
    return current.axes.some(
        (axis, index) =>
            Math.abs(axis) > PREVIEW_AXIS_THRESHOLD &&
            (Math.abs(previous.axes[index] ?? 0) <= PREVIEW_AXIS_THRESHOLD ||
                Math.abs(axis - (previous.axes[index] ?? 0)) > 0.01)
    );
}

/** Selects one complete native snapshot for presentation without affecting service navigation. */
export class NativePreviewSelector {
    private previous = new Map<number, DeviceSample>();
    private selectedIndex: number | null = null;

    update(gamepads: ArrayLike<Gamepad | null>): ControllerPreview {
        const current = new Map<number, DeviceSample>();
        for (const gamepad of Array.from(gamepads)) {
            if (!gamepad || gamepad.connected === false || current.has(gamepad.index)) continue;
            current.set(gamepad.index, sample(gamepad));
        }
        const indices = [...current.keys()].sort((left, right) => left - right);

        if (this.selectedIndex === null || !current.has(this.selectedIndex)) {
            this.selectedIndex = indices[0] ?? null;
        } else {
            const candidates = indices.filter((index) => {
                const before = this.previous.get(index);
                const after = current.get(index)!;
                return !!before && sameDevice(before, after) && hasNewMeaningfulInput(before, after);
            });
            if (candidates.length) this.selectedIndex = candidates[0]!;
        }

        this.previous = current;
        return this.selectedIndex === null
            ? neutralControllerPreview('native')
            : current.get(this.selectedIndex) ?? neutralControllerPreview('native');
    }

    reset() {
        this.previous.clear();
        this.selectedIndex = null;
    }
}
