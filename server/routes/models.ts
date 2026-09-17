import { Router } from "express";
import multer from "multer";
import { randomUUID } from "crypto";
import { supabase, MODELS_BUCKET, MODELS_TABLE } from "../lib/supabase.js";
import { auditGltf } from "../lib/gltfAudit.js";
import { compressGlb, COMPRESSION_THRESHOLD_BYTES } from "../lib/compressGlb.js";
import { assembleStlParts } from "../lib/stlAssembly.js";

const upload = multer({ storage: multer.memoryStorage() });
// Multi-part STL assembly intentionally allows much larger uploads than the
// single-file .glb path — a real disassembled-parts kit runs into hundreds
// of MB across dozens of files (see the plan's file-by-file size accounting).
const uploadLargeParts = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024, files: 64 },
});

export const modelsRouter = Router();

const ALLOWED_EXTENSIONS = [".glb", ".gltf"];

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot).toLowerCase();
}

interface IngestInput {
  buffer: Buffer;
  fileName: string;
  source: "upload" | "external-url";
  licenseNote: string;
  linkedComponentId?: string;
  linkedFindingId?: string;
}

async function ingest(input: IngestInput, res: import("express").Response) {
  const ext = extensionOf(input.fileName);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    res.status(400).json({
      error: `Unsupported format "${ext || "unknown"}". Only .glb and .gltf are accepted in this pass.`,
    });
    return;
  }
  if (input.source === "external-url" && !input.licenseNote.trim()) {
    res.status(400).json({ error: "license_note is required when importing from an external URL." });
    return;
  }

  let glbBuffer = input.buffer;
  if (glbBuffer.byteLength > COMPRESSION_THRESHOLD_BYTES) {
    glbBuffer = await compressGlb(glbBuffer);
  }

  const audit = await auditGltf(glbBuffer);

  const storagePath = `${randomUUID()}.glb`;
  const { error: uploadError } = await supabase.storage
    .from(MODELS_BUCKET)
    .upload(storagePath, glbBuffer, { contentType: "model/gltf-binary" });
  if (uploadError) {
    res.status(502).json({ error: `Storage upload failed: ${uploadError.message}` });
    return;
  }

  const { data: signed, error: signError } = await supabase.storage
    .from(MODELS_BUCKET)
    .createSignedUrl(storagePath, 60 * 60 * 24 * 7); // 7 days
  if (signError || !signed) {
    res.status(502).json({ error: `Could not create a fetchable URL: ${signError?.message}` });
    return;
  }

  const { data: row, error: insertError } = await supabase
    .from(MODELS_TABLE)
    .insert({
      file_url: storagePath,
      source: input.source,
      license_note: input.licenseNote || null,
      node_count: audit.nodeCount,
      triangle_count: audit.triangleCount,
      is_separable: audit.isSeparable,
      linked_component_id: input.linkedComponentId ?? null,
      linked_finding_id: input.linkedFindingId ?? null,
    })
    .select()
    .single();
  if (insertError) {
    res.status(502).json({ error: `Metadata insert failed: ${insertError.message}` });
    return;
  }

  res.status(201).json({
    id: row.id,
    url: signed.signedUrl,
    nodeCount: audit.nodeCount,
    triangleCount: audit.triangleCount,
    isSeparable: audit.isSeparable,
  });
}

/** Returns the most recently ingested model with a freshly-signed URL. Signed
 * URLs expire (7 days, set at ingest time) so the frontend must re-fetch this
 * on load rather than caching the URL returned at ingest time indefinitely. */
modelsRouter.get("/latest", async (_req, res) => {
  try {
    const { data: row, error } = await supabase
      .from(MODELS_TABLE)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      res.status(502).json({ error: `Lookup failed: ${error.message}` });
      return;
    }
    if (!row) {
      res.status(404).json({ error: "No models have been ingested yet." });
      return;
    }
    const { data: signed, error: signError } = await supabase.storage
      .from(MODELS_BUCKET)
      .createSignedUrl(row.file_url, 60 * 60 * 24 * 7);
    if (signError || !signed) {
      res.status(502).json({ error: `Could not sign a fetchable URL: ${signError?.message}` });
      return;
    }
    res.json({
      id: row.id,
      url: signed.signedUrl,
      nodeCount: row.node_count,
      triangleCount: row.triangle_count,
      isSeparable: row.is_separable,
    });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Unknown lookup error" });
  }
});

/** Combines multiple binary-STL parts (a disassembled-model kit) into one
 * .glb with a genuinely flat, separable node hierarchy — unlike a typical
 * finished single-mesh/FBX-sourced .glb, this gives Exploded View real,
 * distinct parts to pull apart. Not exposed in the Import modal UI (V1
 * scope stays single-file glTF for end users); this is a backend path for
 * setting up a curated default model. */
modelsRouter.post("/ingest-parts", uploadLargeParts.array("files"), async (req, res) => {
  try {
    const files = Array.isArray(req.files) ? req.files : [];
    if (files.length === 0) {
      res.status(400).json({ error: "Provide one or more multipart 'files' (.stl)." });
      return;
    }
    const nonStl = files.find(file => extensionOf(file.originalname) !== ".stl");
    if (nonStl) {
      res.status(400).json({ error: `Unsupported format for "${nonStl.originalname}". Only .stl parts are accepted here.` });
      return;
    }

    const parts = files.map(file => ({
      name: file.originalname.replace(/\.stl$/i, ""),
      buffer: file.buffer,
    }));
    const assembled = await assembleStlParts(parts);

    let glbBuffer = assembled.glb;
    if (glbBuffer.byteLength > COMPRESSION_THRESHOLD_BYTES) {
      glbBuffer = await compressGlb(glbBuffer);
    }

    const storagePath = `${randomUUID()}.glb`;
    const { error: uploadError } = await supabase.storage
      .from(MODELS_BUCKET)
      .upload(storagePath, glbBuffer, { contentType: "model/gltf-binary" });
    if (uploadError) {
      res.status(502).json({ error: `Storage upload failed: ${uploadError.message}` });
      return;
    }

    const { data: signed, error: signError } = await supabase.storage
      .from(MODELS_BUCKET)
      .createSignedUrl(storagePath, 60 * 60 * 24 * 7);
    if (signError || !signed) {
      res.status(502).json({ error: `Could not create a fetchable URL: ${signError?.message}` });
      return;
    }

    const licenseNote = typeof req.body.licenseNote === "string" ? req.body.licenseNote : "";
    const { data: row, error: insertError } = await supabase
      .from(MODELS_TABLE)
      .insert({
        file_url: storagePath,
        source: "upload",
        license_note: licenseNote || null,
        node_count: assembled.nodeCount,
        triangle_count: assembled.triangleCount,
        is_separable: true,
        linked_component_id: req.body.linkedComponentId ?? null,
        linked_finding_id: req.body.linkedFindingId ?? null,
      })
      .select()
      .single();
    if (insertError) {
      res.status(502).json({ error: `Metadata insert failed: ${insertError.message}` });
      return;
    }

    res.status(201).json({
      id: row.id,
      url: signed.signedUrl,
      nodeCount: assembled.nodeCount,
      triangleCount: assembled.triangleCount,
      isSeparable: true,
      partCount: parts.length,
    });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Unknown assembly error" });
  }
});

modelsRouter.post("/ingest", upload.single("file"), async (req, res) => {
  try {
    if (req.file) {
      await ingest(
        {
          buffer: req.file.buffer,
          fileName: req.file.originalname,
          source: "upload",
          licenseNote: typeof req.body.licenseNote === "string" ? req.body.licenseNote : "",
          linkedComponentId: req.body.linkedComponentId,
          linkedFindingId: req.body.linkedFindingId,
        },
        res,
      );
      return;
    }

    const { url, licenseNote, linkedComponentId, linkedFindingId } = req.body ?? {};
    if (typeof url !== "string" || !url) {
      res.status(400).json({ error: "Provide either a multipart 'file' or a JSON 'url'." });
      return;
    }

    const response = await fetch(url);
    if (!response.ok) {
      res.status(400).json({ error: `Could not fetch model URL (HTTP ${response.status}).` });
      return;
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    const fileName = new URL(url).pathname.split("/").pop() || "model.glb";

    await ingest(
      {
        buffer,
        fileName,
        source: "external-url",
        licenseNote: typeof licenseNote === "string" ? licenseNote : "",
        linkedComponentId,
        linkedFindingId,
      },
      res,
    );
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Unknown ingestion error" });
  }
});
