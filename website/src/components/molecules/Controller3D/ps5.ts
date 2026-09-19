import { Box3, Group, Mesh, Quaternion, Vector3 } from 'three';
import { loadAsset } from './assets';
import { rest, type ControllerRig, type RigPart } from './rig';

export function rigStick(root: Group, click: Group, index: number) {
    const pivot = new Group();
    pivot.name = `stick-${index}`;
    pivot.position.copy(click.position);
    root.add(pivot);
    click.position.set(0, 0, 0);
    pivot.add(click);
    return { click: rest(click), stick: rest(pivot) };
}

/** Supplied Joystick PS5 geometry. Names are authored nodes under Empty.004_32. */
export async function createModel(): Promise<ControllerRig> {
    const { meshes, orientation, ownership } = await loadAsset(
        import.meta.env.BASE_URL + 'models/joystick-ps5.glb',
        0,
        'Empty004_32'
    );
    const root = new Group();
    try {
    root.name = 'Joystick PS5';
    root.quaternion.copy(orientation);
    // Turn the authored upside-down camera presentation around the presenter's view axis.
    root.quaternion.premultiply(
        new Quaternion().setFromAxisAngle(new Vector3(0, -3.82, -9).normalize(), Math.PI)
    );
    const byParent = new Map<string, Mesh[]>();
    for (const mesh of meshes) {
        for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
            // The supplied transparent, double-sided materials otherwise render twice.
            material.forceSinglePass = true;
            if ('transmission' in material) {
                (material as typeof material & { transmission: number }).transmission = 0;
            }
        }
        const name = mesh.parent?.name || '';
        const list = byParent.get(name) ?? [];
        list.push(mesh);
        byParent.set(name, list);
    }
    const moved = new Set<Mesh>();
    const group = (name: string, authoredName: string) => {
        const objects = byParent.get(authoredName);
        if (!objects?.length) throw new Error(`Missing PS5 control: ${authoredName}`);
        const bounds = new Box3();
        objects.forEach((object) => {
            object.geometry.computeBoundingBox();
            bounds.union(object.geometry.boundingBox!);
        });
        const center = bounds.getCenter(new Vector3());
        const pivot = new Group();
        pivot.name = name;
        pivot.position.copy(center);
        root.add(pivot);
        objects.forEach((object) => {
            object.position.copy(center).negate();
            object.rotation.set(0, 0, 0);
            object.scale.setScalar(1);
            pivot.add(object);
            moved.add(object);
        });
        return pivot;
    };
    const buttons = new Map<number, RigPart>();
    const names = new Map<number, string>([
        [0, 'X_31'],
        [1, 'O_22'],
        [2, 'cuadrado_15'],
        [3, 'Cylinder_17'],
        [4, 'L1_18'],
        [5, 'R1_27'],
        [8, 'Create_button_10'],
        [9, 'Options_button_23'],
        [12, 'cruz_Arriba_11'],
        [13, 'cruz_baja_12'],
        [14, 'cruz_L_13'],
        [15, 'cruz_R_14'],
        [16, 'Text_29'],
    ]);
    for (const [index, name] of names) buttons.set(index, rest(group(`button-${index}`, name)));
    const sticks = ['palanca_L_25', 'palanca_R_26'].map((name, index) => {
        const click = group(`button-${index + 10}`, name);
        const parts = rigStick(root, click, index);
        buttons.set(index + 10, parts.click);
        return parts.stick;
    }) as [RigPart, RigPart];
    const triggers = ['L2_19', 'R2_28'].map((name, index) => {
        const pivot = group(`trigger-${index}`, name);
        // Rotate around the authored upper edge instead of the control center.
        pivot.position.y += 0.12;
        for (const child of pivot.children) child.position.y -= 0.12;
        return rest(pivot);
    }) as [RigPart, RigPart];
    for (const mesh of meshes) {
        if (!moved.has(mesh)) {
            mesh.position.set(0, 0, 0);
            mesh.rotation.set(0, 0, 0);
            mesh.scale.setScalar(1);
            root.add(mesh);
        }
    }
    return { root, buttons, sticks, triggers, owned: ownership.adopt(root) };
    } catch (error) {
        ownership.track(root);
        ownership.dispose();
        throw error;
    }
}
