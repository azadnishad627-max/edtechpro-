import * as THREE from "three";

export function disposeObject(root: THREE.Object3D) {
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.geometry?.dispose();
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      Object.values(material).forEach((value: any) => {
        if (value && typeof value.dispose === 'function') value.dispose();
      });
      material.dispose();
    });
  });
}
