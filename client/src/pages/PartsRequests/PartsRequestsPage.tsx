import { useState } from "react";
import { Plus, X, FileText, Search } from "lucide-react";
import { toast } from "sonner";
import { partRequests, type PartRequest } from "@/data/mock/parts-requests";
import { StatusPill } from "@/components/shared/StatusPill";
import {
  Drawer,
  DrawerContent,
  DrawerClose,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { NewRequestForm } from "./NewRequestForm";

export const stages: PartRequest["stage"][] = [
  "Requested",
  "Quoted",
  "QA/QC",
  "Fulfilled",
];
const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    value
  );
export function PartsRequestsPage() {
  const [requests, setRequests] = useState(partRequests);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = requests.find(row => row.id === selectedId);
  const visible = requests.filter(row =>
    `${row.partName} ${row.partNumber} ${row.client} ${row.id}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );
  const move = (id: string, stage: PartRequest["stage"]) => {
    setRequests(rows =>
      rows.map(row => (row.id === id ? { ...row, stage } : row))
    );
    toast.success(`${id} moved to ${stage}`, {
      description: "Demo change — resets on refresh.",
    });
  };
  return (
    <section className="parts-page">
      <header className="page-heading">
        <div>
          <div className="eyebrow">PROCUREMENT / PARTS</div>
          <h1>Parts Requests</h1>
          <p>Track and manage your part requests from quote to delivery.</p>
        </div>
        <button className="primary-button" onClick={() => setCreateOpen(true)}>
          <Plus size={16} /> New Part Request
        </button>
      </header>
      <div className="parts-toolbar">
        <label>
          <Search size={16} />
          <input
            aria-label="Search requests"
            placeholder="Search part, P/N, client or request…"
            value={query}
            onChange={event => setQuery(event.target.value)}
          />
        </label>
        <span>
          {visible.length} of {requests.length} requests
        </span>
      </div>
      <p className="parts-disclosure">
        Demo workspace · Requests and stage changes reset on refresh.
        AI-generated part photographs are illustrative, not inventory evidence.
      </p>
      <div className="parts-board">
        {stages.map((stage, index) => {
          const rows = visible.filter(row => row.stage === stage);
          return (
            <section
              className="parts-column"
              key={stage}
              aria-label={`${stage} requests`}
            >
              <div className="parts-column-head">
                <span
                  className={`parts-column-dot ${["blue", "amber", "violet", "green"][index]}`}
                />
                <h3>{stage}</h3>
                <em className="parts-column-count">{rows.length}</em>
              </div>
              <div className="parts-column-cards">
                {rows.map(row => (
                  <article className="parts-card" key={row.id}>
                    <button
                      className="parts-card-open"
                      onClick={() => setSelectedId(row.id)}
                      aria-label={`Open ${row.id} ${row.partName}`}
                    >
                      <img
                        className="parts-image"
                        src={row.photo}
                        alt={`Illustrative ${row.partName}`}
                        loading="lazy"
                      />
                      <span className="parts-card-id">
                        {row.id} · {row.category}
                      </span>
                      <strong>{row.partName}</strong>
                      <span className="parts-card-pn">
                        P/N: {row.partNumber}
                      </span>
                      <span className="parts-card-meta">
                        {row.aircraftType} · {row.client}
                      </span>
                      <div className="parts-card-footer">
                        <span>Qty: {row.qty}</span>
                        <StatusPill status={row.priority} />
                      </div>
                      <time>{row.requestDate}</time>
                    </button>
                    <label className="parts-move">
                      Move to
                      <select
                        aria-label={`Move ${row.id} to stage`}
                        value={row.stage}
                        onChange={event =>
                          move(
                            row.id,
                            event.target.value as PartRequest["stage"]
                          )
                        }
                      >
                        {stages.map(value => (
                          <option key={value}>{value}</option>
                        ))}
                      </select>
                    </label>
                  </article>
                ))}
              </div>
              {!rows.length && (
                <p className="parts-empty">No requests in this stage.</p>
              )}
            </section>
          );
        })}
      </div>
      <Drawer
        direction="right"
        open={!!selected}
        onOpenChange={open => {
          if (!open) setSelectedId(null);
        }}
      >
        <DrawerContent className="directive-drawer parts-detail">
          <DrawerHeader>
            <DrawerClose
              className="directive-close"
              aria-label="Close part details"
            >
              <X size={18} />
            </DrawerClose>
            <span className="eyebrow">{selected?.id}</span>
            <DrawerTitle>{selected?.partName}</DrawerTitle>
            <DrawerDescription>
              Full mock request record · Illustrative photography
            </DrawerDescription>
          </DrawerHeader>
          {selected && (
            <div className="parts-detail-body">
              <img
                className="parts-detail-image"
                src={selected.photo}
                alt={`Illustrative ${selected.partName}`}
              />
              <div className="parts-detail-badges">
                <StatusPill status={selected.stage} />
                <StatusPill status={selected.priority} />
              </div>
              <label className="parts-move">
                Request stage
                <select
                  value={selected.stage}
                  onChange={event =>
                    move(
                      selected.id,
                      event.target.value as PartRequest["stage"]
                    )
                  }
                >
                  {stages.map(stage => (
                    <option key={stage}>{stage}</option>
                  ))}
                </select>
              </label>
              <dl className="parts-record">
                {Object.entries({
                  "Part name": selected.partName,
                  "P/N": selected.partNumber,
                  Serial: selected.serial || "Not provided",
                  "Aircraft type": selected.aircraftType,
                  Quantity: selected.qty,
                  Client: selected.client,
                  "Requested by": selected.requestedBy,
                  "Request date": selected.requestDate,
                  Priority: selected.priority,
                  Category: selected.category,
                }).map(([key, value]) => (
                  <div key={key}>
                    <dt>{key}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              <section>
                <h3>Notes</h3>
                <p>{selected.notes || "No notes provided."}</p>
              </section>
              <section>
                <h3>Quote</h3>
                {selected.quote ? (
                  <dl className="parts-record">
                    {Object.entries({
                      Supplier: selected.quote.supplier,
                      "Quote number": selected.quote.quoteNo,
                      "Unit price (USD)": money(selected.quote.unitPrice),
                      "Total price (USD)": money(selected.quote.totalPrice),
                      "Lead time": selected.quote.leadTime,
                      Approval: selected.quote.approvalStatus,
                    }).map(([key, value]) => (
                      <div key={key}>
                        <dt>{key}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p>No quote supplied.</p>
                )}
              </section>
              <section>
                <h3>QA/QC checklist</h3>
                <ul className="parts-checklist">
                  {selected.qaqc.map(check => (
                    <li key={check.label}>
                      <div>
                        <strong>{check.label}</strong>
                        <p>{check.description}</p>
                        {check.date && <time>{check.date}</time>}
                      </div>
                      <StatusPill
                        status={check.status}
                        tone={
                          check.status === "Complete"
                            ? "green"
                            : check.status === "In Progress"
                              ? "amber"
                              : "gray"
                        }
                      />
                    </li>
                  ))}
                </ul>
              </section>
              <section>
                <h3>Documents</h3>
                {selected.documents.length ? (
                  <ul className="parts-documents">
                    {selected.documents.map(doc => (
                      <li key={doc.name}>
                        <FileText size={16} />
                        <span>{doc.name}</span>
                        <small>{doc.size}</small>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No documents attached.</p>
                )}
                <small>
                  Mock document metadata only; file downloads are unavailable.
                </small>
              </section>
            </div>
          )}
        </DrawerContent>
      </Drawer>
      <NewRequestForm
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={row => {
          setRequests(rows => [row, ...rows]);
          setQuery("");
          setCreateOpen(false);
          toast.success(`${row.id} added to Requested`, {
            description:
              "Client-side demo only — this request resets on refresh.",
          });
        }}
        nextId={`PR-${String(Math.max(...requests.map(row => Number(row.id.slice(3)))) + 1).padStart(3, "0")}`}
      />
    </section>
  );
}
