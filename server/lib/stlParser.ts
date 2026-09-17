export interface StlTriangleData {
  /** Float32Array, 9 floats per triangle (3 vertices × xyz), no indexing — STL is inherently a triangle soup. */
  positions: Float32Array;
  /** Float32Array, 9 floats per triangle (repeated flat normal per vertex). */
  normals: Float32Array;
  triangleCount: number;
}

/** Parses a binary STL buffer (the near-universal export format from CAD/slicer
 * tools): 80-byte header, 4-byte little-endian triangle count, then 50 bytes
 * per triangle (12-byte normal + 3×12-byte vertices + 2-byte attribute byte
 * count, ignored). No ASCII-STL support — every file in this app's use case
 * is a binary export. */
export function parseBinaryStl(buffer: Buffer): StlTriangleData {
  if (buffer.byteLength < 84) {
    throw new Error("File is too small to be a binary STL.");
  }
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const triangleCount = view.getUint32(80, true);
  const expectedLength = 84 + triangleCount * 50;
  if (buffer.byteLength < expectedLength) {
    throw new Error(
      `STL triangle count (${triangleCount}) doesn't match file size — likely an ASCII STL, which isn't supported.`,
    );
  }

  const positions = new Float32Array(triangleCount * 9);
  const normals = new Float32Array(triangleCount * 9);

  let offset = 84;
  for (let i = 0; i < triangleCount; i++) {
    const nx = view.getFloat32(offset, true);
    const ny = view.getFloat32(offset + 4, true);
    const nz = view.getFloat32(offset + 8, true);
    offset += 12;

    const base = i * 9;
    for (let v = 0; v < 3; v++) {
      positions[base + v * 3] = view.getFloat32(offset, true);
      positions[base + v * 3 + 1] = view.getFloat32(offset + 4, true);
      positions[base + v * 3 + 2] = view.getFloat32(offset + 8, true);
      normals[base + v * 3] = nx;
      normals[base + v * 3 + 1] = ny;
      normals[base + v * 3 + 2] = nz;
      offset += 12;
    }
    offset += 2; // attribute byte count, unused
  }

  return { positions, normals, triangleCount };
}
