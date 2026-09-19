import { Group, Mesh, Vector3 } from 'three';
import { loadAsset, splitComponents } from './assets';
import { rest, type ControllerRig, type RigPart } from './rig';

/** Supplied Xbox Elite geometry; component IDs verified in T3-elite-topology.json. */
export async function createModel(): Promise<ControllerRig> {
    const { meshes, ownership } = await loadAsset(import.meta.env.BASE_URL + 'models/xbox-elite-controller.glb', 0.43);
    const root = new Group();
    try {
    root.name = 'Xbox Elite Controller';
    const buttons = new Map<number, RigPart>();
    const source = new Map(meshes.map((mesh) => [mesh.parent!.name, mesh]));
    const parts = new Map<string, ReturnType<typeof splitComponents>>();
    for (const name of ['Circle002', 'Circle009', 'Circle003', 'Cube003', 'Circle010'])
        parts.set(name, splitComponents(source.get(name)!, ownership));
    const moved = new Set<Mesh>();
    const group = (name: string, objects: Mesh[], center?: Vector3) => {
        const pivot = new Group();
        pivot.name = name;
        if (!center) {
            objects[0]!.geometry.computeBoundingBox();
            center = objects[0]!.geometry.boundingBox!.getCenter(new Vector3());
        }
        pivot.position.copy(center);
        root.add(pivot);
        objects.forEach((object) => {
            object.position.copy(center!).negate();
            object.rotation.set(0, 0, 0);
            object.scale.setScalar(1);
            pivot.add(object);
            moved.add(object);
        });
        return pivot;
    };
    const lookup = (name: string, id: number) => parts.get(name)!.find((part) => part.id === id)!;
    const faces = [
        [0, 2917, 865, 'Text003'],
        [1, 2145, 1289, 'Text002'],
        [2, 3140, 908, 'Text'],
        [3, 2799, 773, 'Text001'],
    ] as const;
    for (const [index, glass, base, text] of faces) {
        const part = lookup('Circle002', glass);
        buttons.set(
            index,
            rest(
                group(
                    'button-' + index,
                    [part.object, lookup('Circle009', base).object, source.get(text)!],
                    part.center
                )
            )
        );
    }
    const shoulders = [
        [4, 11179],
        [5, 6845],
    ] as const;
    shoulders.forEach(([index, id]) => {
        const part = lookup('Cube003', id);
        buttons.set(index, rest(group('button-' + index, [part.object], part.center)));
    });
    const triggers = [13389, 14480].map((id, index) => {
        const part = lookup('Cube003', id);
        const hinge = part.center.clone();
        hinge.y += 0.22;
        hinge.z += 0.25;
        return rest(group('trigger-' + index, [part.object], hinge));
    }) as [RigPart, RigPart];
    for (const [index, id] of [
        [8, 825],
        [9, 936],
    ] as const) {
        const part = lookup('Circle003', id);
        buttons.set(index, rest(group('button-' + index, [part.object], part.center)));
    }
    buttons.set(16, rest(group('button-16', [source.get('Circle004')!])));
    const sticks = ['Cube002', 'Cube005'].map((name, index) => {
        const mesh = source.get(name)!;
        mesh.geometry.computeBoundingBox();
        const center = mesh.geometry.boundingBox!.getCenter(new Vector3());
        const click = group('button-' + (index + 10), [mesh], center);
        buttons.set(index + 10, rest(click));
        const pivot = new Group();
        pivot.name = 'stick-' + index;
        pivot.position.copy(center);
        root.add(pivot);
        click.position.set(0, 0, 0);
        pivot.add(click);
        buttons.set(index + 10, rest(click));
        return rest(pivot);
    }) as [RigPart, RigPart];
    const dpad = rest(group('dpad', [source.get('Cylinder')!]));
    // Add untouched source meshes or disconnected leftovers. All material maps remain the author's.
    for (const mesh of meshes) {
        if (parts.has(mesh.parent?.name || '')) {
            for (const part of parts.get(mesh.parent!.name)!) {
                if (!moved.has(part.object)) root.add(part.object);
            }
            mesh.geometry.dispose();
        } else if (!moved.has(mesh)) {
            mesh.position.set(0, 0, 0);
            mesh.rotation.set(0, 0, 0);
            mesh.scale.setScalar(1);
            root.add(mesh);
        }
    }
    return { root, buttons, sticks, triggers, dpad, owned: ownership.adopt(root) };
    } catch (error) {
        ownership.track(root);
        ownership.dispose();
        throw error;
    }
}
