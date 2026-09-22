import { DirectionalLight, HemisphereLight, OrthographicCamera, Scene, WebGLRenderer } from 'three';
import { applyPreview, disposeRig, type ControllerRig } from './rig';
import type { ControllerPreview } from '../../../demos/controller-preview';
export { disposeRig } from './rig';

/** Measures renderer throughput only while updates continuously demand frames. */
export class FrameDemandMonitor {
    private demandStart = 0;
    private lastDemand = 0;
    private frames = 0;
    private slowWindows = 0;
    signal(now: number) {
        if (!this.lastDemand || now - this.lastDemand > 75) this.reset(now);
        this.lastDemand = now;
    }
    frame(now: number): 'lower-dpr' | 'fallback' | undefined {
        if (!this.lastDemand || now - this.lastDemand > 75) return;
        this.frames++;
        if (now - this.demandStart < 3000) return;
        this.slowWindows = (this.frames * 1000) / (now - this.demandStart) < 30 ? this.slowWindows + 1 : 0;
        this.demandStart = now;
        this.frames = 0;
        if (this.slowWindows >= 4) return 'fallback';
        if (this.slowWindows === 2) return 'lower-dpr';
    }
    private reset(now: number) {
        this.demandStart = now;
        this.lastDemand = 0;
        this.frames = 0;
        this.slowWindows = 0;
    }
}

export function createPresenter(host: HTMLElement, rig: ControllerRig, onError: () => void) {
    let renderer: WebGLRenderer;
    try {
        renderer = new WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch (error) {
        disposeRig(rig);
        throw error;
    }
    if (!renderer.capabilities.isWebGL2) {
        renderer.dispose();
        renderer.forceContextLoss();
        disposeRig(rig);
        throw new Error('WebGL 2 is unavailable.');
    }
    const scene = new Scene();
    const camera = new OrthographicCamera(-3.2, 3.2, 2.25, -2.25, 0.1, 30);
    camera.zoom = rig.cameraZoom ?? 1;
    camera.updateProjectionMatrix();
    camera.position.set(0, 3.7, 9);
    camera.lookAt(0, -0.12, 0);
    scene.add(new HemisphereLight(0xecfff8, 0x263343, rig.lighting?.hemisphere ?? 2.5));
    const key = new DirectionalLight(0xffffff, rig.lighting?.key ?? 3);
    key.position.set(-3, 5, 7);
    scene.add(key);
    const rim = new DirectionalLight(0x8ae1cb, rig.lighting?.rim ?? 1.5);
    rim.position.set(4, 0, -1);
    scene.add(rim);
    scene.add(rig.root);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.domElement.setAttribute('aria-hidden', 'true');
    host.append(renderer.domElement);
    let frame = 0,
        disposed = false;
    let latest: ControllerPreview | undefined;
    let lastInput = '';
    const performanceMonitor = new FrameDemandMonitor();
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    let renders = 0;
    const lost = (event: Event) => {
        event.preventDefault();
        onError();
    };
    renderer.domElement.addEventListener('webglcontextlost', lost);
    const draw = (now: number) => {
        frame = 0;
        if (disposed || document.hidden || !latest) return;
        try {
            applyPreview(rig, latest);
            const width = Math.max(1, host.clientWidth),
                height = Math.max(1, host.clientHeight);
            renderer.setSize(width, height, false);
            const halfWidth = Math.max(3.15, (2.05 * width) / height),
                halfHeight = (halfWidth * height) / width;
            camera.left = -halfWidth;
            camera.right = halfWidth;
            camera.top = halfHeight;
            camera.bottom = -halfHeight;
            camera.updateProjectionMatrix();
            renderer.render(scene, camera);
            renders++;
            // Counts stay on this owned DOM node for baseline-relative browser verification.
            Object.assign(host.dataset, {
                renders: String(renders),
                triangles: String(renderer.info.render.triangles),
                drawCalls: String(renderer.info.render.calls),
                geometries: String(renderer.info.memory.geometries),
                textures: String(renderer.info.memory.textures),
                dpr: String(renderer.getPixelRatio()),
            });
            const performanceAction = performanceMonitor.frame(now);
            if (performanceAction === 'lower-dpr') renderer.setPixelRatio(1);
            if (performanceAction === 'fallback') onError();
        } catch {
            onError();
        }
    };
    const schedule = () => {
        if (!disposed && !frame && !document.hidden) frame = requestAnimationFrame(draw);
    };
    const resize = new ResizeObserver(schedule);
    resize.observe(host);
    return {
        update(preview: ControllerPreview) {
            latest = preview;
            const input = JSON.stringify([preview.connected, preview.buttons, preview.axes]);
            if (input !== lastInput) {
                lastInput = input;
                performanceMonitor.signal(globalThis.performance.now());
                if (reducedMotion && !disposed && !document.hidden) draw(performance.now());
                else schedule();
            }
        },
        dispose() {
            if (disposed) return;
            disposed = true;
            cancelAnimationFrame(frame);
            frame = 0;
            resize.disconnect();
            renderer.domElement.removeEventListener('webglcontextlost', lost);
            disposeRig(rig);
            scene.clear();
            renderer.dispose();
            renderer.forceContextLoss();
            renderer.domElement.remove();
        },
    };
}
export type Presenter = ReturnType<typeof createPresenter>;
