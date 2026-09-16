import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { DemoShell } from '../src/demos/DemoShell';
import QuizNight from '../src/demos/apps/QuizNight';
import FocusTimer from '../src/demos/apps/FocusTimer';
import { demos } from '../src/demos/registry';
let root: Root;
let frames: Map<number, FrameRequestCallback>;
let time: number;
function frame() {
    time += 200;
    const pending = [...frames.values()];
    frames.clear();
    act(() => pending.forEach((callback) => callback(time)));
}
function button(label: string) {
    const match = [...document.querySelectorAll('button')].find((item) => item.textContent?.trim() === label);
    if (!match) throw new Error(label);
    return match;
}
function click(label: string) {
    act(() => button(label).click());
}
function key(value: string, type = 'keydown') {
    act(() =>
        document.activeElement!.dispatchEvent(new KeyboardEvent(type, { key: value, bubbles: true, cancelable: true }))
    );
}
function render(id: 'quiz-night' | 'focus-timer') {
    act(() =>
        root.render(
            <DemoShell
                demo={demos.find((demo) => demo.id === id)!}
                app={id === 'quiz-night' ? QuizNight : FocusTimer}
            />
        )
    );
}
beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    frames = new Map();
    let counter = 0;
    time = 1000;
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
        const index = [...document.querySelectorAll('button')].indexOf(this as HTMLButtonElement);
        const x = Math.max(0, index % 3) * 150;
        const y = Math.floor(Math.max(index, 0) / 3) * 150;
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
    document.body.innerHTML = '<div id="root"></div>';
    root = createRoot(document.getElementById('root')!);
});
afterEach(() => {
    act(() => root.unmount());
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.body.innerHTML = '';
});
it('finishes three questions without duplicate scoring and replaces targets after each committed question', () => {
    render('quiz-night');
    click('Start demo');
    frame();
    const answers = () => [...document.querySelectorAll<HTMLButtonElement>('.quiz-answers button')];
    act(() => answers()[1]!.focus());
    key('Enter');
    frame();
    frame();
    expect(document.querySelector('.quiz-score strong')!.textContent).toBe('1 / 3 points');
    expect(document.activeElement).toBe(button('Next question'));
    expect(document.querySelector('.quiz-progress')!.textContent).toContain('1 OF 3');
    key('Enter', 'keyup');
    frame();
    key('Enter');
    frame();
    key('Enter', 'keyup');
    frame();
    expect(document.querySelector('.quiz-progress')!.textContent).toContain('2 OF 3');
    expect(document.activeElement).toBe(answers()[0]);
    act(() => {
        answers()[2]!.click();
        answers()[2]!.click();
    });
    click('Next question');
    act(() => answers()[3]!.click());
    click('See results');
    expect(document.querySelector('.quiz-finale [role="status"]')!.textContent).toBe('You scored 3 out of 3.');
    click('Play again');
    expect(document.querySelector('.quiz-score strong')!.textContent).toBe('0 / 3 points');
    expect(document.activeElement).toBe(answers()[0]);
    expect(frames.size).toBe(1);
});
it('supports the same quiz result with idle pointer input and locks choices', () => {
    render('quiz-night');
    for (let question = 0; question < 3; question++) {
        const choices = [...document.querySelectorAll<HTMLButtonElement>('.quiz-answers button')];
        act(() => {
            choices[question + 1]!.click();
            choices[0]!.click();
        });
        expect(choices.every((choice) => choice.disabled)).toBe(true);
        click(question === 2 ? 'See results' : 'Next question');
    }
    expect(document.querySelector('.quiz-finale [role="status"]')!.textContent).toBe('You scored 3 out of 3.');
    expect(frames.size).toBe(0);
});
it('keeps idle keyboard focus inside the quiz through Next, results and restart without stealing initial focus', () => {
    const outside = document.createElement('button');
    document.body.append(outside);
    outside.focus();
    render('quiz-night');
    expect(document.activeElement).toBe(outside);
    const answers = () => [...document.querySelectorAll<HTMLButtonElement>('.quiz-answers button')];
    act(() => answers()[1]!.focus());
    for (let question = 0; question < 3; question++) {
        // Native Enter produces a click on the focused button; jsdom does not synthesize that default action.
        act(() => (document.activeElement as HTMLButtonElement).click());
        expect(document.activeElement).toBe(button(question === 2 ? 'See results' : 'Next question'));
        act(() => (document.activeElement as HTMLButtonElement).click());
        expect(document.activeElement).toBe(question === 2 ? button('Play again') : answers()[0]);
    }
    act(() => (document.activeElement as HTMLButtonElement).click());
    expect(document.activeElement).toBe(answers()[0]);
    expect(document.querySelector('.quiz-progress')!.textContent).toContain('1 OF 3');
    expect(document.querySelector('.quiz-score strong')!.textContent).toBe('0 / 3 points');
    expect(frames.size).toBe(0);
});
it('uses one deadline timer, supports pause/resume/completion, and works without input started', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
    render('focus-timer');
    click('10-second demo');
    click('Start timer');
    expect(vi.getTimerCount()).toBe(1);
    act(() => vi.advanceTimersByTime(3100));
    expect(document.querySelector('.timer-clock')!.textContent).toBe('00:07');
    click('Pause timer');
    expect(vi.getTimerCount()).toBe(0);
    act(() => vi.advanceTimersByTime(10000));
    expect(document.querySelector('.timer-clock')!.textContent).toBe('00:07');
    click('Start timer');
    expect(vi.getTimerCount()).toBe(1);
    act(() => vi.advanceTimersByTime(7000));
    expect(document.querySelector('.focus-timer [role="status"]')!.textContent).toContain('Session complete');
    expect(vi.getTimerCount()).toBe(0);
    click('Reset timer');
    expect(document.querySelector('.timer-clock')!.textContent).toBe('00:10');
    expect(frames.size).toBe(0);
});
it('pauses timer on service Stop, window blur, page hiding, and removes intervals on route exit', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
    render('focus-timer');
    click('10-second demo');
    click('Start demo');
    frame();
    click('Start timer');
    act(() => vi.advanceTimersByTime(1100));
    click('Stop demo');
    expect(vi.getTimerCount()).toBe(0);
    expect(document.querySelector('.timer-clock')!.textContent).toBe('00:09');
    click('Start timer');
    act(() => window.dispatchEvent(new Event('blur')));
    expect(vi.getTimerCount()).toBe(0);
    click('Start timer');
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(vi.getTimerCount()).toBe(0);
    click('Start timer');
    act(() => root.render(<div>Another route</div>));
    expect(vi.getTimerCount()).toBe(0);
});
it('opens scoped timer settings and uses Back without leaving the example', () => {
    render('focus-timer');
    click('Start demo');
    frame();
    click('Timer settings');
    const duration = document.querySelectorAll<HTMLButtonElement>('.timer-settings-options button')[0]!;
    act(() => duration.focus());
    key('Enter');
    frame();
    key('Enter', 'keyup');
    frame();
    expect(document.querySelector('.timer-clock')!.textContent).toBe('00:10');
    key('Escape');
    frame();
    key('Escape', 'keyup');
    frame();
    expect(document.querySelector('dialog')).toBeNull();
    expect(document.activeElement).toBe(button('Timer settings'));
    expect(frames.size).toBe(1);
});
