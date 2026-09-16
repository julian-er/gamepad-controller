/**
 * Validate and copy an untrusted host gamepad snapshot.
 *
 * Host events are a transport boundary. The returned value contains new arrays and new button
 * records, so later mutation of the event detail cannot alter input state.
 */
export function normalizeSnapshot(value: unknown): Gamepad | null {
    try {
        if (!value || typeof value !== 'object') return null;

        const source = value as Record<string, unknown>;
        const index = source.index;
        const id = source.id;
        const buttons = source.buttons;
        const axes = source.axes;
        const connected = source.connected;
        const mapping = source.mapping;
        const timestamp = source.timestamp;

        if (
            typeof index !== 'number' ||
            !Number.isSafeInteger(index) ||
            index < 0 ||
            typeof id !== 'string' ||
            !Array.isArray(buttons) ||
            !Array.isArray(axes)
        ) {
            return null;
        }
        if (connected !== undefined && typeof connected !== 'boolean') return null;
        if (mapping !== undefined && mapping !== '' && mapping !== 'standard') return null;
        if (timestamp !== undefined && (typeof timestamp !== 'number' || !Number.isFinite(timestamp) || timestamp < 0))
            return null;

        const normalizedButtons: GamepadButton[] = [];
        for (const button of buttons) {
            if (!button || typeof button !== 'object') return null;
            const buttonSource = button as Record<string, unknown>;
            const pressed = buttonSource.pressed;
            const buttonValue = buttonSource.value;
            const touched = buttonSource.touched;

            if (typeof pressed !== 'boolean') return null;
            if (
                buttonValue !== undefined &&
                (typeof buttonValue !== 'number' || !Number.isFinite(buttonValue) || buttonValue < 0 || buttonValue > 1)
            )
                return null;
            if (touched !== undefined && typeof touched !== 'boolean') return null;

            normalizedButtons.push({
                pressed,
                value: buttonValue ?? 0,
                touched: touched ?? false,
            });
        }

        const normalizedAxes: number[] = [];
        for (const axis of axes) {
            if (typeof axis !== 'number' || !Number.isFinite(axis) || axis < -1 || axis > 1) return null;
            normalizedAxes.push(axis);
        }

        return {
            id,
            index,
            connected: connected ?? true,
            mapping: mapping === 'standard' ? 'standard' : '',
            timestamp: timestamp ?? 0,
            buttons: normalizedButtons,
            axes: normalizedAxes,
            vibrationActuator: null,
        } as unknown as Gamepad;
    } catch {
        // Event detail can contain proxies or accessors. Reject it rather than let host data
        // escape the transport boundary as an exception.
        return null;
    }
}
