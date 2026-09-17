import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bounds, Center, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OrbitControlsImpl = any;

export type ViewerMode = "3D View" | "Exploded View" | "Wireframe";

/** Wireframe on a dense real-world mesh (millions of triangles, fused
 * together) renders as an unreadable solid blob — the overlapping lines
 * merge into a flat fill at any normal zoom. Explode the parts whenever
 * Wireframe is active too, so there's actual separation between surfaces
 * for the wireframe lines to read against. */
function isExploded(mode: ViewerMode) {
  return mode === "Exploded View" || mode === "Wireframe";
}

/** The 5 inspection-media filmstrip buttons (Inspection detail, Engine
 * inlet, Left angle, Right angle, Lower cowl) used to be purely cosmetic —
 * clicking them never changed the 3D view. These presets give each one a
 * distinct, real camera angle around the model so they're actually
 * consistent with what the viewer shows. Angles are spherical offsets
 * (theta = azimuth, phi = polar from +Y) applied at the camera's current
 * distance from the orbit target, so zoom level is preserved. */
const CAMERA_PRESETS: { theta: number; phi: number }[] = [
  { theta: 0, phi: Math.PI / 2.3 },           // Inspection detail — default front-ish framing
  { theta: Math.PI, phi: Math.PI / 2.3 },     // Engine inlet — opposite face
  { theta: -Math.PI / 2.4, phi: Math.PI / 2.3 }, // Left angle
  { theta: Math.PI / 2.4, phi: Math.PI / 2.3 },  // Right angle
  { theta: 0, phi: (2 * Math.PI) / 3 },       // Lower cowl — camera dips below, looking up
];

/** Smoothly orbits the camera to a preset angle whenever `presetIndex`
 * changes, preserving the user's current zoom distance. Lives inside the
 * Canvas (needs useThree/useFrame) and reads/writes the same OrbitControls
 * instance the parent page's toolbar (zoom, pan, rotate) already drives. */
function CameraPresetController({ presetIndex, controlsRef }: { presetIndex: number; controlsRef: React.MutableRefObject<OrbitControlsImpl> }) {
  const { camera } = useThree();
  const target = useRef<THREE.Spherical | null>(null);
  const prevIndex = useRef<number | null>(null);

  useEffect(() => {
    if (prevIndex.current === presetIndex) return;
    prevIndex.current = presetIndex;
    const controls = controlsRef.current;
    if (!controls) return;
    const currentOffset = camera.position.clone().sub(controls.target);
    const currentSpherical = new THREE.Spherical().setFromVector3(currentOffset);
    const preset = CAMERA_PRESETS[presetIndex] ?? CAMERA_PRESETS[0];
    target.current = new THREE.Spherical(currentSpherical.radius, preset.phi, preset.theta);
  }, [presetIndex, camera, controlsRef]);

  useFrame(() => {
    const controls = controlsRef.current;
    const goal = target.current;
    if (!controls || !goal) return;
    const currentOffset = camera.position.clone().sub(controls.target);
    const current = new THREE.Spherical().setFromVector3(currentOffset);
    current.phi += (goal.phi - current.phi) * 0.08;
    current.theta += (goal.theta - current.theta) * 0.08;
    current.radius = goal.radius;
    camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(current));
    controls.update();
    if (Math.abs(goal.phi - current.phi) < 0.002 && Math.abs(goal.theta - current.theta) < 0.002) {
      target.current = null;
    }
  });

  return null;
}

/** Shared wireframe-swap + explode-on-toggle behavior for any loaded/built
 * THREE.Group, so a real glTF model and the procedural fallback engine both
 * get identical Wireframe/Exploded View behavior from one place. */
function useModeEffects(scene: THREE.Object3D, mode: ViewerMode, explodeFactor = 1.6) {
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
    const exploded = isExploded(mode);
    scene.children.forEach(child => {
      const original = originalPositions.current.get(child);
      if (!original) return;
      const offset = original.clone().sub(center).multiplyScalar(exploded ? explodeFactor : 0);
      child.position.lerp(original.clone().add(offset), 0.12);
    });
  });
}

function GltfModel({ url, mode }: { url: string; mode: ViewerMode }) {
  const { scene } = useGLTF(url, true);
  // A real multi-part kit's largest components dominate the scene's bounding
  // box, so a part sitting near the shared center gets a proportionally tiny
  // center-relative offset at the default factor — bump it here so parts of
  // any size pull apart clearly instead of only the outermost ones moving.
  useModeEffects(scene, mode, 2.6);
  return <primitive object={scene} />;
}

const ENGINE_METAL = 0x8a94a3;
const ENGINE_METAL_DARK = 0x4b5566;
const ENGINE_ACCENT = 0x1d74dc;

/** No real model has been imported yet — build a simple, clearly-separable
 * turbofan-engine shape from primitives (core, nacelle, inlet, exhaust, 8
 * fan blades) instead of falling back to a flat photo. Zero licensing risk
 * (nothing downloaded), and genuinely separable so Exploded View has
 * something real to demonstrate before the user imports their own model. */
function ProceduralEngine({ mode }: { mode: ViewerMode }) {
  const group = useMemo(() => {
    const root = new THREE.Group();
    root.name = "engine-placeholder";

    const metal = new THREE.MeshStandardMaterial({ color: ENGINE_METAL, metalness: 0.75, roughness: 0.35 });
    const metalDark = new THREE.MeshStandardMaterial({ color: ENGINE_METAL_DARK, metalness: 0.6, roughness: 0.45 });
    const accent = new THREE.MeshStandardMaterial({ color: ENGINE_ACCENT, metalness: 0.4, roughness: 0.3 });

    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 2.6, 32), metalDark);
    core.name = "engine-core";
    core.rotation.z = Math.PI / 2;
    root.add(core);

    const nacelle = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 2.2, 40, 1, true), metal);
    nacelle.name = "nacelle";
    nacelle.rotation.z = Math.PI / 2;
    nacelle.material.side = THREE.DoubleSide;
    root.add(nacelle);

    const inlet = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.08, 12, 40), accent);
    inlet.name = "inlet-ring";
    inlet.rotation.y = Math.PI / 2;
    inlet.position.x = -1.15;
    root.add(inlet);

    const exhaust = new THREE.Mesh(new THREE.ConeGeometry(0.85, 1.1, 32, 1, true), metalDark);
    exhaust.name = "exhaust-cone";
    exhaust.material.side = THREE.DoubleSide;
    exhaust.rotation.z = -Math.PI / 2;
    exhaust.position.x = 1.65;
    root.add(exhaust);

    const bladeGeometry = new THREE.BoxGeometry(0.06, 0.9, 0.14);
    const bladeCount = 8;
    for (let i = 0; i < bladeCount; i++) {
      const blade = new THREE.Mesh(bladeGeometry, metal);
      blade.name = `fan-blade-${i + 1}`;
      const angle = (i / bladeCount) * Math.PI * 2;
      blade.position.set(-1.15, Math.cos(angle) * 0.5, Math.sin(angle) * 0.5);
      blade.rotation.x = angle;
      root.add(blade);
    }

    const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.18), metalDark);
    pylon.name = "pylon";
    pylon.position.set(-0.2, 1.05, 0);
    root.add(pylon);

    return root;
  }, []);

  useModeEffects(group, mode, 1.1);
  useFrame(() => {
    const fan = group.children.find(child => child.name === "inlet-ring");
    fan && (fan.rotation.x += 0.01);
  });

  return <primitive object={group} />;
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
  activeView = 0,
}: {
  modelUrl: string | null;
  mode: ViewerMode;
  controlsRef: React.MutableRefObject<OrbitControlsImpl>;
  /** Index into the 5 filmstrip presets (Inspection detail, Engine inlet,
   * Left angle, Right angle, Lower cowl) — orbits the camera to match. */
  activeView?: number;
}) {
  return (
    <Canvas camera={{ position: [3, 2, 4.5], fov: 45 }} dpr={[1, 2]}>
      <ambientLight intensity={0.65} />
      <directionalLight position={[5, 8, 5]} intensity={1.1} />
      <directionalLight position={[-5, -3, -5]} intensity={0.35} />
      <Suspense fallback={null}>
        {/* Real-world source models arrive at wildly different scales (this
         * project has already hit one authored in ~10-unit-wide CAD/FBX
         * export units, versus small ~1-2 unit test assets) — Bounds fits
         * the camera to whatever actually loaded instead of assuming a
         * fixed scale, and re-fits whenever the model swaps (observe).
         * Margin is generous (not just tight-fit + a hair of padding)
         * because Exploded/Wireframe push parts well past the model's
         * resting-pose bounds — observe keeps refitting as they animate
         * outward, but a small margin still let them crowd the frame edge. */}
        <Bounds fit clip observe margin={1.8} key={modelUrl ?? "placeholder"}>
          <Center>
            {modelUrl ? <GltfModel url={modelUrl} mode={mode} /> : <ProceduralEngine mode={mode} />}
          </Center>
        </Bounds>
      </Suspense>
      <CameraPresetController presetIndex={activeView} controlsRef={controlsRef} />
      <OrbitControls ref={controlsRef} enableDamping makeDefault />
    </Canvas>
  );
}
