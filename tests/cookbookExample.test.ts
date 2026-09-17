import { readFileSync } from 'node:fs';
import { afterEach, expect, it, vi } from 'vitest';
import { GamepadService } from '../src/index';
import { makeElementsVisible } from './helpers';

afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
});

it('runs the cookbook starter with repeat protection, round reset, and cleanup', () => {
    const markdown = readFileSync('docs/PROJECT_COOKBOOK.md', 'utf8').replace(/\r\n/g, '\n');
    const html = /```html\n([\s\S]*?)```/.exec(markdown)![1]!;
    const script = /```js\n([\s\S]*?)```/.exec(markdown)![1]!;
    document.body.innerHTML = /<body>([\s\S]*?)<\/body>/.exec(html)![1]!;
    makeElementsVisible();
    Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [] });
    vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
    vi.spyOn(window, 'cancelAnimationFrame').mockReturnValue(undefined);
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const mount = new Function('GamepadService', script
        .replace("import { GamepadService } from 'gamepad-ui-engine';", '')
        .replace('export function', 'function')
        .split('let dispose = mountTreasure();')[0] + '\nreturn mountTreasure;')(GamepadService);
    const dispose = mount();
    try {
        const tiles = document.querySelectorAll<HTMLButtonElement>('[data-tile]');
        const result = document.querySelector('.result')!;
        expect(tiles).toHaveLength(9);
        tiles[1]!.click();
        tiles[1]!.click();
        expect(result.textContent).toBe('Attempts: 1. Keep looking!');
        tiles[0]!.click();
        expect(result.textContent).toContain('Treasure found in 2 attempts!');
        tiles[2]!.click();
        expect(tiles[2]!.textContent).toBe('Tile 3');
        document.querySelector<HTMLButtonElement>('.restart')!.click();
        expect(document.activeElement).toBe(tiles[0]);
        expect(tiles[0]!.textContent).toBe('Tile 1');
        dispose();
        tiles[0]!.click();
        expect(tiles[0]!.textContent).toBe('Tile 1');
    } finally {
        dispose();
    }
});
