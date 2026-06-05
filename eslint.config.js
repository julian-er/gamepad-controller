// ESLint flat config (ESLint 9+).
import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
    {
        ignores: ['dist/**', 'examples/**', 'node_modules/**', 'tests/**'],
    },
    js.configs.recommended,
    {
        files: ['src/**/*.ts'],
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                ecmaVersion: 2020,
                sourceType: 'module',
            },
            globals: {
                window: 'readonly',
                document: 'readonly',
                navigator: 'readonly',
                console: 'readonly',
                performance: 'readonly',
                requestAnimationFrame: 'readonly',
                cancelAnimationFrame: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                CustomEvent: 'readonly',
                Element: 'readonly',
                HTMLElement: 'readonly',
                HTMLInputElement: 'readonly',
                HTMLButtonElement: 'readonly',
                HTMLAnchorElement: 'readonly',
                NodeListOf: 'readonly',
                Event: 'readonly',
                EventListener: 'readonly',
                Gamepad: 'readonly',
                GamepadEvent: 'readonly',
                MutationObserver: 'readonly',
                Blob: 'readonly',
                URL: 'readonly',
                Node: 'readonly',
            },
        },
        plugins: {
            '@typescript-eslint': tseslint,
        },
        rules: {
            // The TS compiler (noUnusedLocals etc.) handles unused checks; avoid double-reporting.
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            'no-undef': 'off',
            quotes: ['warn', 'single', { avoidEscape: true }],
        },
    },
];
