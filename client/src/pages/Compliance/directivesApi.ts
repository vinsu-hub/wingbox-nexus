import type { Directive } from "@/data/mock/compliance";

type RecordStatus = "Compliant" | "Due Soon" | "Overdue" | "N/A";

export interface ApiComplianceRecord {
  id: string;
  directiveId: string;
  tailNumber: string;
  status: RecordStatus;
  compliedDate: string | null;
  compliedBy: string | null;
  signedOffBy: string | null;
  referenceDocUrl: string | null;
}

export interface ApiDirective {
  id: string;
  type: "AD" | "SB";
  referenceNo: string;
  title: string;
  applicability: string | null;
  issuingAuthority: string | null;
  effectiveDate: string | null;
  complianceDue: string | null;
  status: "open" | "in_progress" | "complied" | "not_applicable";
  ataChapter: string | null;
  notes: string | null;
  createdAt: string;
  records: ApiComplianceRecord[];
}

export interface DirectiveInput {
  type: "AD" | "SB";
  referenceNo: string;
  title: string;
  applicability?: string;
  issuingAuthority?: string;
  effectiveDate?: string;
  complianceDue?: string;
  ataChapter?: string;
  notes?: string;
}

async function parseJsonOrThrow(response: Response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? `Request failed (${response.status})`);
  return body;
}

export async function fetchDirectives(): Promise<ApiDirective[]> {
  const response = await fetch("/api/directives");
  return parseJsonOrThrow(response);
}

export async function createDirective(input: DirectiveInput): Promise<ApiDirective> {
  const response = await fetch("/api/directives", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseJsonOrThrow(response);
}

export async function updateDirective(id: string, input: Partial<DirectiveInput>): Promise<ApiDirective> {
  const response = await fetch(`/api/directives/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseJsonOrThrow(response);
}

export interface MarkCompliedInput {
  tailNumber: string;
  status: RecordStatus;
  compliedDate?: string;
  compliedBy?: string;
  signedOffBy?: string;
  referenceDocUrl?: string;
}

export async function markCompliance(directiveId: string, input: MarkCompliedInput): Promise<ApiComplianceRecord & { warning?: string }> {
  const response = await fetch(`/api/directives/${directiveId}/compliance-records`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseJsonOrThrow(response);
}

/** Reshapes the normalized API response into the dense per-aircraft matrix
 * `ComplianceView.tsx` already renders (every fleet tail present, "N/A" for
 * ones with no compliance_records row) — same contract the old mock data
 * module produced, so the page's filter/summary/render logic didn't need
 * to change, only its data source. */
export function toDirectiveWithAffected(api: ApiDirective, allTails: string[]): Directive {
  const statusByTail = new Map(api.records.map(record => [record.tailNumber, record.status]));
  return {
    id: api.id,
    adSbNumber: api.referenceNo,
    authority: api.issuingAuthority ?? "",
    issueDate: api.effectiveDate ?? "",
    deadline: api.complianceDue ?? "",
    description: api.notes ?? api.title,
    ammSection: api.ataChapter ?? "",
    affected: allTails.map(tail => ({ tail, status: statusByTail.get(tail) ?? "N/A" })),
  };
}
