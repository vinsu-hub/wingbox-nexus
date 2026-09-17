import { NodeIO } from "@gltf-transform/core";

export interface GltfAuditResult {
  nodeCount: number;
  triangleCount: number;
  isSeparable: boolean;
}

const GENERIC_NAME_PATTERN = /^(mesh|node|object|group)[_\s-]?\d*$/i;

/** Reads a .glb/.gltf buffer and reports node/triangle counts and whether
 * the model has enough meaningfully-named mesh nodes to support Exploded View. */
export async function auditGltf(buffer: Buffer): Promise<GltfAuditResult> {
  const io = new NodeIO();
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
