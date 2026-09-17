import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Center, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OrbitControlsImpl = any;

export type ViewerMode = "3D View" | "Exploded View" | "Wireframe";

function Model({ url, mode }: { url: string; mode: ViewerMode }) {
  const { scene } = useGLTF(url, true);
  const originalMaterials = useRef(new Map<THREE.Mesh, THREE.Material | THREE.Material[]>());
  const originalPositions = useRef(new Map<THREE.Object3D, THREE.Vector3>());

  const center = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    return box.getCenter(new THREE.Vector3());
  }, [scene]);

  useEffect(() => {
    scene.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      if (!originalMaterials.current.has(object)) {
        originalMaterials.current.set(object, object.material);
      }
      if (mode === "Wireframe") {
        object.material = new THREE.MeshBasicMaterial({
          color: 0x378add,
          wireframe: true,
          transparent: true,
          opacity: 0.85,
        });
      } else {
        const original = originalMaterials.current.get(object);
        if (original) object.material = original;
      }
    });
  }, [mode, scene]);

  useEffect(() => {
    scene.children.forEach(child => {
      if (!originalPositions.current.has(child)) {
        originalPositions.current.set(child, child.position.clone());
      }
    });
  }, [scene]);

  useFrame(() => {
    const exploded = mode === "Exploded View";
    scene.children.forEach(child => {
      const original = originalPositions.current.get(child);
      if (!original) return;
      const offset = original.clone().sub(center).multiplyScalar(exploded ? 1.6 : 0);
      child.position.lerp(original.clone().add(offset), 0.12);
    });
  });

  return <primitive object={scene} />;
}

export interface Viewer3DHandle {
  toggleAutoRotate: () => void;
  togglePanMode: () => void;
  zoom: (factor: number) => void;
  reset: () => void;
}

export function Viewer3D({
  modelUrl,
  mode,
  controlsRef,
}: {
  modelUrl: string;
  mode: ViewerMode;
  controlsRef: React.MutableRefObject<OrbitControlsImpl>;
}) {
  return (
    <Canvas camera={{ position: [3, 2, 4.5], fov: 45 }} dpr={[1, 2]}>
      <ambientLight intensity={0.65} />
      <directionalLight position={[5, 8, 5]} intensity={1.1} />
      <directionalLight position={[-5, -3, -5]} intensity={0.35} />
      <Suspense fallback={null}>
        <Center>
          <Model url={modelUrl} mode={mode} />
        </Center>
      </Suspense>
      <OrbitControls ref={controlsRef} enableDamping makeDefault />
    </Canvas>
  );
}
