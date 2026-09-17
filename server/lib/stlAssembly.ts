import { Document, NodeIO } from "@gltf-transform/core";
import { parseBinaryStl } from "./stlParser.js";

export interface StlPart {
  name: string;
  buffer: Buffer;
}

export interface StlAssemblyResult {
  glb: Buffer;
  nodeCount: number;
  triangleCount: number;
}

/** Combines N separate binary-STL parts into a single .glb with one named
 * Mesh+Node per part, all as direct children of one Scene. STL vertex
 * coordinates are already in the shared coordinate system the parts were
 * originally modeled/exported in, so no per-part repositioning is needed —
 * loading each part's geometry as-is reconstructs the assembled shape. */
export async function assembleStlParts(parts: StlPart[]): Promise<StlAssemblyResult> {
  const document = new Document();
  const buffer = document.createBuffer();
  const material = document
    .createMaterial("Engine Metal")
    .setBaseColorFactor([0.58, 0.6, 0.64, 1])
    .setMetallicFactor(0.85)
    .setRoughnessFactor(0.4);

  const scene = document.createScene("Scene");
  let triangleCount = 0;

  for (const part of parts) {
    const { positions, normals, triangleCount: partTriangles } = parseBinaryStl(part.buffer);
    if (partTriangles === 0) continue;

    // Each part's vertices arrive in the shared kit coordinate system (so the
    // assembled whole reconstructs correctly), but that means every node's
    // local transform would otherwise default to the same origin — leaving
    // Exploded View (which offsets nodes based on their own position) with
    // nothing to distinguish one part from another. Re-center this part's
    // geometry on its own centroid and carry that centroid as the node's
    // translation instead, so each part has a distinct position to explode
    // from while the assembled (non-exploded) pose is unchanged.
    let cx = 0, cy = 0, cz = 0;
    const vertexCount = positions.length / 3;
    for (let i = 0; i < positions.length; i += 3) {
      cx += positions[i];
      cy += positions[i + 1];
      cz += positions[i + 2];
    }
    cx /= vertexCount;
    cy /= vertexCount;
    cz /= vertexCount;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] -= cx;
      positions[i + 1] -= cy;
      positions[i + 2] -= cz;
    }

    const positionAccessor = document
      .createAccessor(`${part.name}_position`)
      .setType("VEC3")
      .setArray(positions)
      .setBuffer(buffer);
    const normalAccessor = document
      .createAccessor(`${part.name}_normal`)
      .setType("VEC3")
      .setArray(normals)
      .setBuffer(buffer);

    const primitive = document
      .createPrimitive()
      .setAttribute("POSITION", positionAccessor)
      .setAttribute("NORMAL", normalAccessor)
      .setMaterial(material);

    const mesh = document.createMesh(part.name).addPrimitive(primitive);
    const node = document.createNode(part.name).setMesh(mesh).setTranslation([cx, cy, cz]);
    scene.addChild(node);
    triangleCount += partTriangles;
  }

  document.getRoot().setDefaultScene(scene);

  const io = new NodeIO();
  const glb = Buffer.from(await io.writeBinary(document));

  return {
    glb,
    nodeCount: scene.listChildren().length,
    triangleCount,
  };
}
