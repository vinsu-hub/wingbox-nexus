export type QcCategory = "inspection" | "parts" | "delivery";
export type LinkedEntityType = "inspection" | "part_request" | "aircraft" | "delivery";
export type QcStatus = "in_progress" | "passed" | "failed";
export type ItemResult = "pass" | "fail" | "na";

export interface QcItem {
  id: string;
  label: string;
  requiresPhoto: boolean;
}

export interface QcTemplate {
  id: string;
  name: string;
  category: QcCategory;
  items: QcItem[];
  createdAt: string;
}

export interface QcResult {
  itemId: string;
  result: ItemResult;
  notes?: string;
  photoUrl?: string;
}

export interface QcInstance {
  id: string;
  templateId: string;
  linkedEntityType: LinkedEntityType;
  linkedEntityId: string;
  status: QcStatus;
  completedBy: string | null;
  completedAt: string | null;
  results: QcResult[];
  createdAt: string;
}

export const QC_STATUS_LABEL: Record<QcStatus, string> = {
  in_progress: "In Progress",
  passed: "Passed",
  failed: "Failed",
};

export const LINKED_ENTITY_LABEL: Record<LinkedEntityType, string> = {
  inspection: "Inspection",
  part_request: "Part Request",
  aircraft: "Aircraft",
  delivery: "Delivery Event",
};

async function json<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? `Request failed (${response.status})`);
  return body as T;
}

export const fetchTemplates = () => fetch("/api/qc/templates").then(json<QcTemplate[]>);

export function fetchInstances(filter?: { linkedEntityType?: LinkedEntityType; linkedEntityId?: string }) {
  const params = new URLSearchParams();
  if (filter?.linkedEntityType) params.set("linkedEntityType", filter.linkedEntityType);
  if (filter?.linkedEntityId) params.set("linkedEntityId", filter.linkedEntityId);
  const query = params.toString();
  return fetch(`/api/qc/instances${query ? `?${query}` : ""}`).then(json<QcInstance[]>);
}

export const startInstance = (input: { templateId: string; linkedEntityType: LinkedEntityType; linkedEntityId: string }) =>
  fetch("/api/qc/instances", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }).then(json<QcInstance>);

export const submitInstance = (id: string, input: { results: QcResult[]; completedBy: string }) =>
  fetch(`/api/qc/instances/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }).then(json<QcInstance>);

export function uploadAttachment(file: File) {
  const form = new FormData();
  form.append("file", file);
  return fetch("/api/qc/attachments", { method: "POST", body: form }).then(json<{ path: string; url: string }>);
}
