import { Color, Group, Mesh, MeshStandardMaterial, type Object3D, type Quaternion, type Vector3 } from 'three';
import type { ControllerPreview } from '../../../demos/controller-preview';

const materialRest = new WeakMap<MeshStandardMaterial, { color: Color; intensity: number }>();
function highlight(material: MeshStandardMaterial, value: number) {
    let base = materialRest.get(material);
    if (!base) {
        base = { color: material.emissive.clone(), intensity: material.emissiveIntensity };
        materialRest.set(material, base);
    }
    material.emissive.copy(base.color).lerp(new Color(0x10b981), value);
    material.emissiveIntensity = base.intensity + value * 0.8;
}

export type RigPart = { object: Object3D; position: Vector3; quaternion: Quaternion };
export type OwnedRigResources = {
    geometries: Set<import('three').BufferGeometry>;
    materials: Set<import('three').Material>;
    textures: Set<import('three').Texture>;
};
export type ControllerRig = {
    root: Group;
    buttons: Map<number, RigPart>;
    sticks: [RigPart, RigPart];
    triggers: [RigPart, RigPart];
    dpad?: RigPart;
    owned?: OwnedRigResources;
};
export function rest(object: Object3D): RigPart {
    return { object, position: object.position.clone(), quaternion: object.quaternion.clone() };
}
const unit = (value: number | undefined, min = 0) => (Number.isFinite(value) ? Math.max(min, Math.min(1, value!)) : 0);
/** Every pose starts at rest: repeated snapshots never accumulate travel. */
export function applyPreview(rig: ControllerRig, preview: ControllerPreview) {
    const active = preview.connected;
    if (rig.dpad) {
        const part = rig.dpad;
        part.object.quaternion.copy(part.quaternion);
        part.object.rotation.x += active
            ? ((preview.buttons[13]?.pressed ? 1 : 0) - (preview.buttons[12]?.pressed ? 1 : 0)) * 0.12
            : 0;
        part.object.rotation.y += active
            ? ((preview.buttons[15]?.pressed ? 1 : 0) - (preview.buttons[14]?.pressed ? 1 : 0)) * 0.12
            : 0;
    }
    for (const [index, part] of rig.buttons) {
        const value = active
            ? Math.max(unit(preview.buttons[index]?.value), preview.buttons[index]?.pressed ? 1 : 0)
            : 0;
        part.object.position.copy(part.position);
        part.object.quaternion.copy(part.quaternion);
        part.object.position.z -= value * 0.09;
        part.object.traverse((child) => {
            if (child instanceof Mesh && child.material instanceof MeshStandardMaterial) {
                highlight(child.material, value);
            }
        });
    }
    rig.sticks.forEach((part, index) => {
        part.object.position.copy(part.position);
        part.object.quaternion.copy(part.quaternion);
        part.object.rotation.y += active ? unit(preview.axes[index * 2], -1) * 0.32 : 0;
        part.object.rotation.x += active ? unit(preview.axes[index * 2 + 1], -1) * 0.32 : 0;
    });
    rig.triggers.forEach((part, index) => {
        part.object.position.copy(part.position);
        part.object.quaternion.copy(part.quaternion);
        const value = active ? unit(preview.buttons[index + 6]?.value) : 0;
        part.object.rotation.x -= value * 0.65;
        part.object.traverse((child) => {
            if (child instanceof Mesh && child.material instanceof MeshStandardMaterial) {
                highlight(child.material, value);
            }
        });
    });
}
export function disposeRig(rig: ControllerRig) {
    const geometries = rig.owned?.geometries ?? new Set<import('three').BufferGeometry>();
    const materials = rig.owned?.materials ?? new Set<import('three').Material>();
    const textures = rig.owned?.textures ?? new Set<import('three').Texture>();
    if (!rig.owned)
        rig.root.traverse((child) => {
            if (!(child instanceof Mesh)) return;
            geometries.add(child.geometry);
            for (const material of Array.isArray(child.material) ? child.material : [child.material])
                materials.add(material);
        });
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) =>
        Object.values(material).forEach((value) => {
            if (value && typeof value === 'object' && value.isTexture) textures.add(value);
        })
    );
    const images = new Set<unknown>();
    textures.forEach((texture) => {
        texture.dispose();
        if (typeof ImageBitmap !== 'undefined' && texture.image instanceof ImageBitmap) images.add(texture.image);
    });
    images.forEach((image) => (image as ImageBitmap).close());
    materials.forEach((material) => material.dispose());
    rig.root.clear();
}
