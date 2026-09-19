import {
    Box3,
    BufferGeometry,
    Float32BufferAttribute,
    Group,
    Matrix4,
    Mesh,
    MeshStandardMaterial,
    Quaternion,
    Texture,
    Vector3,
    type Material,
    type Object3D,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { OwnedRigResources } from './rig';

function collectResources(root: Object3D, target: OwnedRigResources) {
    root.traverse((object) => {
        if (!(object instanceof Mesh)) return;
        target.geometries.add(object.geometry);
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
            target.materials.add(material);
            for (const value of Object.values(material))
                if (value instanceof Texture) target.textures.add(value);
        }
    });
}

function disposeResources(resources: OwnedRigResources, retainedImages = new Set<unknown>()) {
    resources.geometries.forEach((geometry) => geometry.dispose());
    resources.materials.forEach((material: Material) => material.dispose());
    const images = new Set<unknown>();
    resources.textures.forEach((texture) => {
        texture.dispose();
        if (
            typeof ImageBitmap !== 'undefined' &&
            texture.image instanceof ImageBitmap &&
            !retainedImages.has(texture.image)
        )
            images.add(texture.image);
    });
    images.forEach((image) => (image as ImageBitmap).close());
}

export class AssetOwnership {
    private resources: OwnedRigResources = { geometries: new Set(), materials: new Set(), textures: new Set() };
    constructor(scene: Object3D) {
        collectResources(scene, this.resources);
    }
    track(object: Object3D) {
        collectResources(object, this.resources);
    }
    adopt(root: Object3D) {
        const retained: OwnedRigResources = { geometries: new Set(), materials: new Set(), textures: new Set() };
        collectResources(root, retained);
        const retainedImages = new Set([...retained.textures].map((texture) => texture.image));
        disposeResources(
            {
                geometries: new Set([...this.resources.geometries].filter((value) => !retained.geometries.has(value))),
                materials: new Set([...this.resources.materials].filter((value) => !retained.materials.has(value))),
                textures: new Set([...this.resources.textures].filter((value) => !retained.textures.has(value))),
            },
            retainedImages
        );
        this.resources = retained;
        return retained;
    }
    dispose() {
        disposeResources(this.resources);
        this.resources = { geometries: new Set(), materials: new Set(), textures: new Set() };
    }
}

/** Weld only for connectivity discovery; preserve every original UV/normal attribute. */
export function splitComponents(mesh: Mesh, ownership?: AssetOwnership) {
    const geometry = mesh.geometry;
    const position = geometry.attributes.position!;
    const indices = geometry.index!.array;
    const parent = Array.from({ length: position.count }, (_, index) => index);
    const find = (value: number): number => {
        while (parent[value] !== value) {
            parent[value] = parent[parent[value]!]!;
            value = parent[value]!;
        }
        return value;
    };
    const union = (a: number, b: number) => {
        parent[find(b)] = find(a);
    };
    const weld = new Map<string, number>();
    for (let index = 0; index < position.count; index++) {
        const key = [position.getX(index), position.getY(index), position.getZ(index)]
            .map((value) => value.toFixed(5))
            .join(',');
        const previous = weld.get(key);
        if (previous !== undefined) union(index, previous);
        else weld.set(key, index);
    }
    for (let index = 0; index < indices.length; index += 3) {
        union(indices[index]!, indices[index + 1]!);
        union(indices[index]!, indices[index + 2]!);
    }
    const groups = new Map<number, number[]>();
    for (let index = 0; index < indices.length; index += 3) {
        const root = find(indices[index]!);
        if (!groups.has(root)) groups.set(root, []);
        groups.get(root)!.push(indices[index]!, indices[index + 1]!, indices[index + 2]!);
    }
    return [...groups].map(([id, indices]) => {
        const part = new BufferGeometry();
        for (const [name, attribute] of Object.entries(geometry.attributes)) part.setAttribute(name, attribute);
        part.setIndex(indices);
        const bounds = new Box3();
        for (const index of indices) bounds.expandByPoint(new Vector3().fromBufferAttribute(position, index));
        // Bounding from selected indices matters: attributes intentionally preserve all original vertices.
        part.boundingBox = bounds;
        part.computeBoundingSphere();
        const material = (mesh.material as MeshStandardMaterial).clone();
        if ('transmission' in material) (material as MeshStandardMaterial & { transmission: number }).transmission = 0;
        const object = new Mesh(part, material);
        object.name = mesh.parent!.name + '-' + id;
        ownership?.track(object);
        return { id, object, center: bounds.getCenter(new Vector3()), triangles: indices.length / 3 };
    });
}
export async function loadAsset(url: string, rotationX: number, subtreeName?: string) {
    const gltf = await new GLTFLoader().loadAsync(url);
    const ownership = new AssetOwnership(gltf.scene);
    gltf.scene.rotation.x = rotationX;
    gltf.scene.updateMatrixWorld(true);
    const sourceRoot = subtreeName ? gltf.scene.getObjectByName(subtreeName) : gltf.scene;
    if (!sourceRoot) {
        ownership.dispose();
        throw new Error(`Missing model subtree: ${subtreeName}`);
    }
    const orientation = sourceRoot.getWorldQuaternion(new Quaternion()).invert();
    const bounds = new Box3().setFromObject(sourceRoot),
        center = bounds.getCenter(new Vector3());
    const scale = 5.3 / bounds.getSize(new Vector3()).x;
    const normalize = new Matrix4()
        .makeScale(scale, scale, scale)
        .multiply(new Matrix4().makeTranslation(-center.x, -center.y, -center.z));
    const meshes: Mesh[] = [];
    sourceRoot.traverse((object) => {
        if (object instanceof Mesh) {
            object.material = Array.isArray(object.material)
                ? object.material.map((material) => material.clone())
                : object.material.clone();
            ownership.track(object);
            object.geometry.applyMatrix4(new Matrix4().multiplyMatrices(normalize, object.matrixWorld));
            meshes.push(object);
        }
    });
    return { gltf, meshes, orientation, ownership };
}
