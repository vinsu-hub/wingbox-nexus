export type EventType = "delivery" | "redelivery";
export type EventStatus = "in_progress" | "discrepancies_open" | "complete";

export interface DeliveryEvent {
  id: string;
  tail: string;
  eventType: EventType;
  counterparty: string;
  targetDate: string;
  status: EventStatus;
  checklistInstanceId: string | null;
  checklistStatus: "in_progress" | "passed" | "failed" | null;
  openDiscrepancies: number;
  signedOffBy: string | null;
  signedOffAt: string | null;
  createdAt: string;
}

export interface Discrepancy {
  id: string;
  description: string;
  linkedComplianceDirectiveId: string | null;
  linkedDirective: { referenceNo: string; title: string } | null;
  linkedFindingId: string | null;
  status: "open" | "resolved";
  raisedBy: string;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface DeliveryEventDetail extends DeliveryEvent {
  discrepancies: Discrepancy[];
}

export const EVENT_STATUS_LABEL: Record<EventStatus, string> = {
  in_progress: "In Progress",
  discrepancies_open: "Discrepancies Open",
  complete: "Complete",
};

export const EVENT_TYPE_LABEL: Record<EventType, string> = {
  delivery: "Delivery (in)",
  redelivery: "Redelivery (lease return)",
};

async function json<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? `Request failed (${response.status})`);
  return body as T;
}

const post = <T,>(url: string, body: unknown, method = "POST") =>
  fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(json<T>);

export const fetchEvents = () => fetch("/api/delivery/events").then(json<DeliveryEvent[]>);
export const fetchEvent = (id: string) => fetch(`/api/delivery/events/${id}`).then(json<DeliveryEventDetail>);

export const createEvent = (input: { tail: string; eventType: EventType; counterparty: string; targetDate: string }) =>
  post<DeliveryEvent>("/api/delivery/events", input);

export const raiseDiscrepancy = (
  eventId: string,
  input: { description: string; linkedComplianceDirectiveId?: string; linkedFindingId?: string },
) => post<{ discrepancy: Discrepancy; eventStatus: EventStatus }>(`/api/delivery/events/${eventId}/discrepancies`, input);

export const resolveDiscrepancy = (id: string) =>
  post<{ discrepancy: Discrepancy; eventStatus: EventStatus }>(`/api/delivery/discrepancies/${id}/resolve`, {}, "PATCH");

export const signOffEvent = (id: string) => post<DeliveryEvent>(`/api/delivery/events/${id}/sign-off`, {});
