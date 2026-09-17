// logger.ts
// Centralized, leveled logger for the gamepad-ui-engine library.
// Replaces the ~80 inline `console.*` calls and the repeated emoji prefix literal.

/** Prefix used by every log line emitted by the library. */
export const LOG_PREFIX = '[🎮 🕹️ gamepad-ui-engine]';

/**
 * Log levels in order of increasing verbosity.
 * - `silent`: no output at all.
 * - `error`: only errors (default — a library should be quiet by default).
 * - `warn`: errors + warnings.
 * - `info`: errors + warnings + lifecycle/info messages.
 * - `debug`: everything, including per-frame/per-element diagnostics.
 */
export type LogLevel = 'silent' | 'error' | 'warn' | 'info' | 'debug';

const LEVEL_WEIGHT: Record<LogLevel, number> = {
    silent: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4,
};

/**
 * A tiny leveled logger. Messages below the active level are dropped *before*
 * any string building cost is paid, which matters for the hot navigation paths.
 */
export class Logger {
    private level: number;

    constructor(level: LogLevel = 'error') {
        this.level = LEVEL_WEIGHT[level];
    }

    /** Update the active log level at runtime. */
    setLevel(level: LogLevel): void {
        this.level = LEVEL_WEIGHT[level];
    }

    /** True when a message at `level` would be emitted — use to guard expensive interpolation. */
    enabled(level: Exclude<LogLevel, 'silent'>): boolean {
        return this.level >= LEVEL_WEIGHT[level];
    }

    error(...args: unknown[]): void {
        if (this.level >= LEVEL_WEIGHT.error) console.error(LOG_PREFIX, ...args);
    }

    warn(...args: unknown[]): void {
        if (this.level >= LEVEL_WEIGHT.warn) console.warn(LOG_PREFIX, ...args);
    }

    info(...args: unknown[]): void {
        if (this.level >= LEVEL_WEIGHT.info) console.info(LOG_PREFIX, ...args);
    }

    debug(...args: unknown[]): void {
        if (this.level >= LEVEL_WEIGHT.debug) console.debug(LOG_PREFIX, ...args);
    }
}

/**
 * Shared library-wide logger instance. Defaults to `error` (quiet). Configure it
 * via the `logLevel` service option or directly with `logger.setLevel(...)`.
 */
export const logger = new Logger('error');
