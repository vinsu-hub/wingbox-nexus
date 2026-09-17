// gltf-pipeline ships as CommonJS with no first-party types; import via require
// through createRequire rather than pulling in an extra @types package.
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { processGlb } = require("gltf-pipeline") as {
  processGlb: (glb: Buffer, options?: Record<string, unknown>) => Promise<{ glb: Buffer }>;
};

export const COMPRESSION_THRESHOLD_BYTES = 15 * 1024 * 1024; // 15MB

/** Draco-compresses a .glb buffer. Only call this for files over the size threshold. */
export async function compressGlb(buffer: Buffer): Promise<Buffer> {
  const result = await processGlb(buffer, { dracoOptions: { compressionLevel: 7 } });
  return result.glb;
}
