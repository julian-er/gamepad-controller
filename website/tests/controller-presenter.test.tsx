import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { BoxGeometry, Group, Mesh, MeshStandardMaterial, Texture, Vector3 } from 'three';
import { AssetOwnership } from '../src/components/molecules/Controller3D/assets';
import { FrameDemandMonitor } from '../src/components/molecules/Controller3D/renderer';
import { Controller3D } from '../src/components/molecules/Controller3D/Controller3D';
import { rest, type ControllerRig } from '../src/components/molecules/Controller3D/rig';
import { rigStick } from '../src/components/molecules/Controller3D/ps5';
function createModel(): ControllerRig {
    const root = new Group();
    const buttons = new Map<number, ReturnType<typeof rest>>();
    for (const i of [0, 1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 13, 14, 15, 16]) {
        const part = new Group();
        root.add(part);
        buttons.set(i, rest(part));
    }
    const sticks = [rest(new Group()), rest(new Group())] as ControllerRig['sticks'];
    const triggers = [rest(new Group()), rest(new Group())] as ControllerRig['triggers'];
    return { root, buttons, sticks, triggers };
}
import { applyPreview, disposeRig } from '../src/components/molecules/Controller3D/rig';
import { neutralControllerPreview } from '../src/demos/controller-preview';

describe('procedural controller rig', () => {
    it('preserves authored neutral stick geometry after reparenting and neutral presentation', () => {
        const root = new Group();
        root.rotation.set(0.2, -0.35, 0.1);
        const click = new Group();
        click.position.set(-1.06, -0.56, 0.94);
        const geometry = new Group();
        geometry.position.set(0.08, 0.03, -0.02);
        click.add(geometry);
        root.add(click);
        root.updateMatrixWorld(true);
        const authored = geometry.getWorldPosition(new Vector3());
        const parts = rigStick(root, click, 0);
        const rig: ControllerRig = {
            root,
            buttons: new Map([[10, parts.click]]),
            sticks: [parts.stick, rest(new Group())],
            triggers: [rest(new Group()), rest(new Group())],
        };
        applyPreview(rig, neutralControllerPreview('simulation'));
        root.updateMatrixWorld(true);
        expect(geometry.getWorldPosition(new Vector3()).distanceTo(authored)).toBeLessThan(1e-10);
    });
    it('applies both sticks, click and analog travel independently without accumulating transforms', () => {
        const rig = createModel();
        const preview = neutralControllerPreview('simulation');
        preview.connected = true;
        preview.axes = [1, -1, -1, 1];
        preview.buttons[0] = { pressed: true, value: 1 };
        preview.buttons[10] = { pressed: true, value: 1 };
        preview.buttons[12] = { pressed: true, value: 1 };
        preview.buttons[7] = { pressed: false, value: 0.5 };
        applyPreview(rig, preview);
        expect(rig.sticks[0].object.rotation.y).toBeCloseTo(0.32);
        expect(rig.sticks[0].object.rotation.x).toBeCloseTo(-0.32);
        expect(rig.sticks[1].object.rotation.y).toBeCloseTo(-0.32);
        expect(rig.sticks[1].object.rotation.x).toBeCloseTo(0.32);
        expect(rig.triggers[1].object.rotation.x).toBeCloseTo(-0.325);
        for (const index of [0, 10, 12])
            expect(rig.buttons.get(index)!.object.position.z).toBeCloseTo(rig.buttons.get(index)!.position.z - 0.09);
        applyPreview(rig, preview);
        expect(rig.triggers[1].object.rotation.x).toBeCloseTo(-0.325);
        for (const value of [0, 0.25, 0.5, 1]) {
            preview.buttons[7]!.value = value;
            applyPreview(rig, preview);
            expect(rig.triggers[1].object.rotation.x).toBeCloseTo(-value * 0.65);
        }
        applyPreview(rig, neutralControllerPreview('simulation'));
        for (const part of [...rig.buttons.values(), ...rig.sticks, ...rig.triggers]) {
            expect(part.object.position.equals(part.position)).toBe(true);
            expect(part.object.quaternion.equals(part.quaternion)).toBe(true);
        }
        disposeRig(rig);
        expect(rig.root.children).toHaveLength(0);
    });
    it('has semantic independent parts and finite neutral transforms', () => {
        const rig = createModel();
        expect([...rig.buttons.keys()].sort((a, b) => a - b)).toEqual([
            0, 1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 13, 14, 15, 16,
        ]);
        const preview = neutralControllerPreview('native');
        preview.connected = true;
        preview.axes = [NaN, Infinity, -Infinity, 0];
        applyPreview(rig, preview);
        expect(rig.sticks[0].object.rotation.x).toBe(0);
        expect(rig.sticks[0].object.rotation.y).toBe(0);
        disposeRig(rig);
    });
});

describe('presenter lifecycle safeguards', () => {
    it('offers a truthful page reload after a renderer chunk fails to load', async () => {
        const previousObserver = globalThis.IntersectionObserver;
        class VisibleObserver {
            constructor(private callback: IntersectionObserverCallback) {}
            observe(element: Element) {
                this.callback([{ isIntersecting: true, target: element } as IntersectionObserverEntry], this as never);
            }
            disconnect() {}
            unobserve() {}
            takeRecords() { return []; }
            root = null;
            rootMargin = '';
            thresholds = [0];
        }
        globalThis.IntersectionObserver = VisibleObserver as never;
        document.body.innerHTML = '<div id="recovery-root"></div>';
        const root = createRoot(document.getElementById('recovery-root')!);
        const reloadPage = vi.fn();
        const loadModules = vi.fn().mockRejectedValue(new TypeError('Failed to fetch dynamically imported module'));
        await act(async () =>
            root.render(
                <Controller3D
                    running
                    preview={neutralControllerPreview('simulation')}
                    variant="xbox"
                    visualStyle="xbox"
                    loadModules={loadModules}
                    reloadPage={reloadPage}
                />
            )
        );
        await act(async () => {
            [...document.querySelectorAll('button')].find((button) => button.textContent === '3D')!.click();
            await Promise.resolve();
        });
        expect(document.querySelector('[role="status"]')!.textContent).toContain('Reload this page');
        expect(document.querySelector('[role="status"]')!.textContent).not.toContain('Retry 3D');
        act(() =>
            [...document.querySelectorAll('button')].find((button) => button.textContent === 'Reload page')!.click()
        );
        expect(reloadPage).toHaveBeenCalledOnce();
        act(() => root.unmount());
        globalThis.IntersectionObserver = previousObserver;
        document.body.innerHTML = '';
    });
    it('ignores low-frequency input when deciding whether rendering is slow', () => {
        const monitor = new FrameDemandMonitor();
        const actions = [];
        for (let now = 100; now <= 15000; now += 100) {
            monitor.signal(now);
            actions.push(monitor.frame(now));
        }
        expect(actions.filter(Boolean)).toEqual([]);
    });
    it('degrades only after consecutive slow windows with sustained frame demand', () => {
        const monitor = new FrameDemandMonitor();
        const actions: string[] = [];
        for (let now = 50; now <= 12500; now += 50) {
            monitor.signal(now);
            const action = monitor.frame(now);
            if (action) actions.push(action);
        }
        expect(actions).toEqual(['lower-dpr', 'fallback']);
    });
    it('keeps shared retained textures alive while disposing excluded parsed resources', () => {
        const shared = new Texture();
        const retainedGeometry = new BoxGeometry();
        const excludedGeometry = new BoxGeometry();
        const retainedMaterial = new MeshStandardMaterial({ map: shared });
        const excludedMaterial = new MeshStandardMaterial();
        const scene = new Group();
        scene.add(new Mesh(retainedGeometry, retainedMaterial), new Mesh(excludedGeometry, excludedMaterial));
        const ownership = new AssetOwnership(scene);
        const root = new Group();
        const clonedMaterial = retainedMaterial.clone();
        root.add(new Mesh(retainedGeometry, clonedMaterial));
        ownership.track(root);
        const sharedDispose = vi.spyOn(shared, 'dispose');
        const excludedDispose = vi.spyOn(excludedGeometry, 'dispose');
        const owned = ownership.adopt(root);
        expect(excludedDispose).toHaveBeenCalledOnce();
        expect(sharedDispose).not.toHaveBeenCalled();
        const rig = createModel();
        rig.root.clear();
        rig.root.add(root);
        rig.owned = owned;
        disposeRig(rig);
        expect(sharedDispose).toHaveBeenCalledOnce();
    });
});
