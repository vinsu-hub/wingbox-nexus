import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bounds, Center, Html, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OrbitControlsImpl = any;

export type ViewerMode = "3D View" | "Exploded View" | "Wireframe";

/** A finding rendered as a numbered marker anchored to a real named part of
 * the loaded model, instead of a static x/y/z point — see HotspotMarker for
 * why: it keeps the marker correctly positioned through the explode
 * animation for free, since it tracks the part's actual live transform. */
export interface Viewer3DHotspot {
  id: string;
  /** Must match a real scene node name (findable via scene.getObjectByName). */
  partName: string;
  number: number;
  severity: "Low" | "Medium" | "High";
  label: string;
}

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

/** Tracks a named part's real, currently-animated world position every
 * frame and renders a numbered badge there. Deliberately reads the part's
 * position live (rather than a static stored x/y/z) so the marker follows
 * automatically through Exploded View / Wireframe's explode animation —
 * getWorldPosition gives the part's position in the top-level Scene's
 * space, which worldToLocal then converts into this marker's own parent's
 * local space (the Center-created group), matching how THREE interprets
 * `.position` — without that conversion the marker would be transformed
 * twice (once by its own position, once by the parent it's nested under). */
function HotspotMarker({
  scene,
  hotspot,
  selected,
  onSelect,
}: {
  scene: THREE.Object3D;
  hotspot: Viewer3DHotspot;
  selected: boolean;
  onSelect?: (id: string) => void;
}) {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null!);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  // A part's own origin (node.position) is its geometric centroid, and this
  // real engine kit's parts are laid out mainly along the engine's length —
  // exactly the axis the default ("Inspection detail") camera looks straight
  // down. Any offset chosen in an arbitrary world direction risks landing on
  // that same near-invisible-on-screen axis (tried centroid alone, then an
  // offset toward the part's own bounding-box top, then outward from the
  // whole model's center — all three still clustered on screen, because the
  // real separation between these specific parts is mostly depth, not
  // width/height, from this angle). Anchoring in the CAMERA's own screen
  // plane (its right/up vectors, captured once) instead guarantees visible
  // separation regardless of which world axis the real geometry varies on —
  // each marker gets pushed outward from its part's centroid at a distinct
  // angle around that screen plane, sized to the part's own extent. Computed
  // once (too expensive to redo every frame against multi-million-triangle
  // parts) as a local-space offset from the part's own origin, then cheaply
  // re-projected into world space each frame via localToWorld so it still
  // tracks correctly through the explode animation.
  const localAnchor = useRef<THREE.Vector3 | null>(null);

  useFrame(() => {
    const part = scene.getObjectByName(hotspot.partName);
    const group = groupRef.current;
    if (!part || !group || !group.parent) return;

    if (!localAnchor.current) {
      const partCenter = part.getWorldPosition(new THREE.Vector3());
      const partBox = new THREE.Box3().setFromObject(part);
      const partSize = partBox.getSize(new THREE.Vector3());
      const partRadius = Math.max(partSize.x, partSize.y, partSize.z) / 2;

      const cameraRight = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
      const cameraUp = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
      // Spread markers around a circle in the camera's screen plane, angle
      // keyed to each finding's stable number so different findings don't
      // pick the same direction even when their parts are close together.
      const angle = (hotspot.number / 4) * Math.PI * 2;
      const screenOffset = cameraRight.multiplyScalar(Math.cos(angle)).add(cameraUp.multiplyScalar(Math.sin(angle)));

      const worldAnchor = partCenter.clone().addScaledVector(screenOffset, partRadius * 2);
      localAnchor.current = part.worldToLocal(worldAnchor);
    }

    part.localToWorld(tmp.copy(localAnchor.current));
    group.parent.worldToLocal(tmp);
    group.position.copy(tmp);
  });

  const severityClass = hotspot.severity === "Medium" ? "hotspot-medium" : hotspot.severity === "Low" ? "hotspot-low" : "";

  return (
    <group ref={groupRef}>
      {/* No `center` prop here — .finding-hotspot already does its own
       * translate(-50%,-50%); adding drei's `center` would double that
       * offset and visibly mis-position every badge. */}
      <Html zIndexRange={[10, 0]}>
        <button
          type="button"
          className={["finding-hotspot", severityClass, selected ? "selected" : ""].filter(Boolean).join(" ")}
          onClick={() => onSelect?.(hotspot.id)}
        >
          <b>{hotspot.number}</b>
          <span>{hotspot.label}</span>
        </button>
      </Html>
    </group>
  );
}

function GltfModel({
  url,
  mode,
  hotspots,
  selectedHotspotId,
  onHotspotSelect,
}: {
  url: string;
  mode: ViewerMode;
  hotspots?: Viewer3DHotspot[];
  selectedHotspotId?: string;
  onHotspotSelect?: (id: string) => void;
}) {
  const { scene } = useGLTF(url, true);
  // A real multi-part kit's largest components dominate the scene's bounding
  // box, so a part sitting near the shared center gets a proportionally tiny
  // center-relative offset at the default factor — bump it here so parts of
  // any size pull apart clearly instead of only the outermost ones moving.
  useModeEffects(scene, mode, 2.6);
  return (
    <>
      <primitive object={scene} />
      {hotspots?.map(hotspot => (
        <HotspotMarker
          key={hotspot.id}
          scene={scene}
          hotspot={hotspot}
          selected={hotspot.id === selectedHotspotId}
          onSelect={onHotspotSelect}
        />
      ))}
    </>
  );
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
  hotspots,
  selectedHotspotId,
  onHotspotSelect,
}: {
  modelUrl: string | null;
  mode: ViewerMode;
  controlsRef: React.MutableRefObject<OrbitControlsImpl>;
  /** Index into the 5 filmstrip presets (Inspection detail, Engine inlet,
   * Left angle, Right angle, Lower cowl) — orbits the camera to match. */
  activeView?: number;
  /** Optional on-model finding markers. Only ever rendered against a real
   * loaded model (GltfModel) — the procedural placeholder has no real part
   * names for hotspots to anchor to, so this is simply never passed there. */
  hotspots?: Viewer3DHotspot[];
  selectedHotspotId?: string;
  onHotspotSelect?: (id: string) => void;
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
            {modelUrl ? (
              <GltfModel
                url={modelUrl}
                mode={mode}
                hotspots={hotspots}
                selectedHotspotId={selectedHotspotId}
                onHotspotSelect={onHotspotSelect}
              />
            ) : (
              <ProceduralEngine mode={mode} />
            )}
          </Center>
        </Bounds>
      </Suspense>
      <CameraPresetController presetIndex={activeView} controlsRef={controlsRef} />
      <OrbitControls ref={controlsRef} enableDamping makeDefault />
    </Canvas>
  );
}
