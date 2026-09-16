import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { GamepadService, type GamepadActionEvent } from 'gamepad-controller';
import { DemoShell } from '../src/demos/DemoShell';
import Portfolio from '../src/demos/apps/Portfolio';
import ProductExplorer from '../src/demos/apps/ProductExplorer';
import PlanChooser from '../src/demos/apps/PlanChooser';
import { demos, type DemoId } from '../src/demos/registry';

let root: Root;
let frames: Map<number, FrameRequestCallback>;
let time: number;
let actions: GamepadActionEvent[];
function frame() {
    time += 200;
    const pending = [...frames.values()];
    frames.clear();
    act(() => pending.forEach((callback) => callback(time)));
}
function button(label: string) {
    const result = [...document.querySelectorAll<HTMLButtonElement>('button')].find(
        (node) => node.textContent?.trim() === label
    );
    if (!result) throw new Error('Missing button: ' + label);
    return result;
}
function click(label: string) {
    act(() => button(label).click());
}
function key(value: string, type = 'keydown') {
    act(() =>
        document.activeElement!.dispatchEvent(new KeyboardEvent(type, { key: value, bubbles: true, cancelable: true }))
    );
}
function tap(value: string) {
    key(value);
    frame();
    key(value, 'keyup');
    frame();
}
function mount(id: DemoId) {
    const app = id === 'portfolio' ? Portfolio : id === 'product-explorer' ? ProductExplorer : PlanChooser;
    const demo = { ...demos.find((entry) => entry.id === id)!, mode: 'spatial' as const };
    history.replaceState(null, '', '#/docs/demo-' + id);
    act(() => root.render(<DemoShell key={id} demo={demo} app={app} />));
}
beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    frames = new Map();
    actions = [];
    time = 1000;
    let counter = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => time);
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
        frames.set(++counter, callback);
        return counter;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
        frames.delete(id);
    });
    Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [] });
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
        const index = Math.max(0, [...document.querySelectorAll('button, a')].indexOf(this));
        const x = (index % 3) * 150,
            y = Math.floor(index / 3) * 150;
        return { x, y, left: x, top: y, right: x + 100, bottom: y + 100, width: 100, height: 100, toJSON() {} };
    });
    vi.spyOn(HTMLElement.prototype, 'getClientRects').mockImplementation(function () {
        return [this.getBoundingClientRect()] as unknown as DOMRectList;
    });
    Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
        configurable: true,
        get() {
            return document.body;
        },
    });
    HTMLDialogElement.prototype.showModal = function () {
        this.open = true;
    };
    HTMLDialogElement.prototype.close = function () {
        this.open = false;
    };
    const matches = Element.prototype.matches;
    vi.spyOn(Element.prototype, 'matches').mockImplementation(function (selector) {
        return selector === ':modal' ? this instanceof HTMLDialogElement && this.open : matches.call(this, selector);
    });
    const init = GamepadService.prototype.init;
    vi.spyOn(GamepadService.prototype, 'init').mockImplementation(function () {
        this.on('beforeaction', (event) => actions.push(event));
        init.call(this);
    });
    document.body.innerHTML = '<div id="root"></div>';
    root = createRoot(document.getElementById('root')!);
});
afterEach(() => {
    act(() => root.unmount());
    vi.restoreAllMocks();
    document.body.innerHTML = '';
});

it('routes portfolio links once per held select, restores the opener and keeps the documentation hash', () => {
    mount('portfolio');
    click('Start demo');
    frame();
    const project = document.querySelector<HTMLAnchorElement>('[data-project="common"]')!;
    const href = project.getAttribute('href')!;
    expect(href).toBe('#/docs/demo-portfolio#portfolio-common');
    act(() => project.focus());
    key('Enter');
    frame();
    frame();
    frame();
    expect(document.getElementById('portfolio-common')?.textContent).toContain('Room for everyone');
    expect(document.activeElement?.textContent).toContain('All projects');
    expect(actions.filter((event) => event.type === 'select')).toHaveLength(1);
    expect(actions.find((event) => event.type === 'select')?.defaultPrevented).toBe(true);
    expect(location.hash).toBe('#/docs/demo-portfolio');
    key('Enter', 'keyup');
    frame();
    tap('Escape');
    expect(document.getElementById('portfolio-common')).toBeNull();
    expect(document.activeElement).toBe(project);
    const back = vi.spyOn(history, 'back');
    tap('Escape');
    expect(back).not.toHaveBeenCalled();
    expect(location.hash).toBe('#/docs/demo-portfolio');
});

it('uses the same local destination for pointer activation and restores focus when returning', () => {
    mount('portfolio');
    const project = document.querySelector<HTMLAnchorElement>('[data-project="atlas"]')!;
    act(() => project.click());
    expect(document.getElementById('portfolio-atlas')).not.toBeNull();
    act(() => document.querySelector<HTMLAnchorElement>('.landing-portfolio-return')!.click());
    expect(document.activeElement).toBe(project);
    expect(location.hash).toBe('#/docs/demo-portfolio');
    expect(frames.size).toBe(0);
});

it('opens a portfolio deep link as a real case-study destination', () => {
    history.replaceState(null, '', '#/docs/demo-portfolio#portfolio-field');
    act(() => root.render(<DemoShell demo={demos.find((entry) => entry.id === 'portfolio')!} app={Portfolio} />));
    expect(document.getElementById('portfolio-field')?.textContent).toContain('Small observations');
    act(() => document.querySelector<HTMLAnchorElement>('.landing-portfolio-return')!.click());
    expect(document.activeElement).toBe(document.querySelector('[data-project="field"]'));
});

it('opens a plan deep link and returns to an eligible plan link', () => {
    history.replaceState(null, '', '#/docs/demo-plan-chooser#plan-collective');
    act(() => root.render(<DemoShell demo={demos.find((entry) => entry.id === 'plan-chooser')!} app={PlanChooser} />));
    expect(document.getElementById('plan-collective')?.textContent).toContain('Collective looks good');
    act(() => document.querySelector<HTMLAnchorElement>('.landing-plan-return')!.click());
    expect(document.activeElement).toBe(document.querySelector('[data-plan="collective"]'));
});

it('changes all product previews while retaining focus and contains details with eligible return focus', () => {
    mount('product-explorer');
    click('Start demo');
    frame();
    const evening = button('☾Evening calm');
    act(() => evening.focus());
    tap('Enter');
    expect(document.querySelector('.landing-product-preview')?.textContent).toContain('Let the day settle');
    expect(document.activeElement).toBe(evening);
    expect(actions.find((event) => event.type === 'select')?.defaultPrevented).toBe(false);
    click('☀Gentle mornings');
    expect(document.querySelector('.landing-product-preview')?.textContent).toContain('A softer start');
    const hero = button('Explore Luma');
    act(() => {
        hero.focus();
        hero.click();
    });
    expect(document.querySelector('dialog')?.textContent).toContain('sunrise concept');
    tap('ArrowRight');
    expect(document.querySelector('dialog')!.contains(document.activeElement)).toBe(true);
    tap('Escape');
    expect(document.querySelector('dialog')).toBeNull();
    expect(document.activeElement).toBe(hero);
    tap('Escape');
    expect(location.hash).toBe('#/docs/demo-product-explorer');
});

it('preserves billing focus, routes a plan once, returns locally, and handles scoped details', () => {
    mount('plan-chooser');
    click('Start demo');
    frame();
    const annual = button('Annual Save up to 25%');
    act(() => annual.focus());
    tap('Enter');
    expect(annual.getAttribute('aria-pressed')).toBe('true');
    expect(document.activeElement).toBe(annual);
    expect(document.querySelector('.landing-plan-price')?.textContent).toContain('$6');
    const studio = document.querySelector<HTMLAnchorElement>('[data-plan="studio"]')!;
    act(() => studio.focus());
    key('Enter');
    frame();
    frame();
    frame();
    expect(document.querySelector('.landing-plan-summary')?.textContent).toContain('$168 yearly');
    expect(actions.filter((event) => event.type === 'select' && event.defaultPrevented)).toHaveLength(1);
    key('Enter', 'keyup');
    frame();
    tap('Escape');
    expect(document.activeElement).toBe(studio);
    expect(annual.getAttribute('aria-pressed')).toBe('true');
    const detail = button('Collective details');
    act(() => {
        detail.focus();
        detail.click();
    });
    tap('ArrowRight');
    expect(document.querySelector('dialog')!.contains(document.activeElement)).toBe(true);
    tap('Escape');
    expect(document.activeElement).toBe(detail);
    expect(location.hash).toBe('#/docs/demo-plan-chooser');
    const back = vi.spyOn(history, 'back');
    tap('Escape');
    expect(back).not.toHaveBeenCalled();
});

it('can select plans with a pointer while idle and resets local state and live input cleanly', () => {
    mount('plan-chooser');
    act(() => document.querySelector<HTMLAnchorElement>('[data-plan="solo"]')!.click());
    expect(document.querySelector('.landing-plan-summary')?.textContent).toContain('$8 per month');
    act(() => document.querySelector<HTMLAnchorElement>('.landing-plan-return')!.click());
    click('Start demo');
    frame();
    click('Studio details');
    click('Reset example');
    expect(document.querySelector('dialog')).toBeNull();
    expect(button('Monthly').getAttribute('aria-pressed')).toBe('true');
    click('Stop demo');
    expect(frames.size).toBe(0);
});
