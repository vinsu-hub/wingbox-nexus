import { NodeIO } from "@gltf-transform/core";
import { KHRDracoMeshCompression } from "@gltf-transform/extensions";
// draco3dgltf has no first-party types; import via require like gltf-pipeline.
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const draco3d = require("draco3dgltf") as {
  createDecoderModule: () => Promise<unknown>;
};

export interface GltfAuditResult {
  nodeCount: number;
  triangleCount: number;
  isSeparable: boolean;
}

const GENERIC_NAME_PATTERN = /^(mesh|node|object|group)[_\s-]?\d*$/i;

let ioPromise: Promise<NodeIO> | null = null;

/** Sketchfab and many other sources export .glb files already Draco-compressed
 * (KHR_draco_mesh_compression) — without registering the decoder, NodeIO
 * throws "Missing required extension" on any such file. Built once and reused
 * since the decoder module is expensive to initialize. */
function getIO(): Promise<NodeIO> {
  if (!ioPromise) {
    ioPromise = draco3d.createDecoderModule().then(decoder =>
      new NodeIO()
        .registerExtensions([KHRDracoMeshCompression])
        .registerDependencies({ "draco3d.decoder": decoder }),
    );
  }
  return ioPromise;
}

/** Reads a .glb/.gltf buffer and reports node/triangle counts and whether
 * the model has enough meaningfully-named mesh nodes to support Exploded View. */
export async function auditGltf(buffer: Buffer): Promise<GltfAuditResult> {
  const io = await getIO();
  const document = await io.readBinary(new Uint8Array(buffer));
  const root = document.getRoot();

  const meshNodes = root
    .listNodes()
    .filter(node => node.getMesh() !== null);

  const namedMeshNodes = meshNodes.filter(node => {
    const name = node.getName();
    return name.length > 0 && !GENERIC_NAME_PATTERN.test(name);
  });

  let triangleCount = 0;
  for (const mesh of root.listMeshes()) {
    for (const primitive of mesh.listPrimitives()) {
      const indices = primitive.getIndices();
      const position = primitive.getAttribute("POSITION");
      if (indices) {
        triangleCount += indices.getCount() / 3;
      } else if (position) {
        triangleCount += position.getCount() / 3;
      }
    }
  }

  return {
    nodeCount: root.listNodes().length,
    triangleCount: Math.round(triangleCount),
    isSeparable: namedMeshNodes.length >= 2,
  };
}
