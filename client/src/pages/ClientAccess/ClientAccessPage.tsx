import { DemoDataBadge } from "@/components/DemoDataBadge";
import { useState } from "react";
import { CheckCircle2, HelpCircle, MessageSquareText, Search, X } from "lucide-react";
import { toast } from "sonner";
import { partRequests, type PartRequest } from "@/data/mock/parts-requests";
import { StatusPill } from "@/components/shared/StatusPill";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { stages } from "@/pages/PartsRequests/PartsRequestsPage";

const clientName = "Skyline Air";
const clientRequests = partRequests.filter(request => request.client === clientName);

export function ClientAccessPage() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<PartRequest | null>(null);
  const [question, setQuestion] = useState("");
  const [questionOpen, setQuestionOpen] = useState(false);
  const [received, setReceived] = useState<string[]>([]);
  const visible = clientRequests.filter(request => `${request.id} ${request.partName} ${request.partNumber} ${request.category}`.toLowerCase().includes(query.trim().toLowerCase()));
  const markReceived = (request: PartRequest) => {
    setReceived(current => current.includes(request.id) ? current : [...current, request.id]);
    toast.success(`${request.id} marked as received`, { description: "Demo acknowledgement — resets on refresh." });
  };
  const openQuestion = (request: PartRequest) => { setSelected(request); setQuestion(""); setQuestionOpen(true); };
  return (
    <section className="client-access-page">
      <DemoDataBadge variant="page" />
      <header className="client-identity"><div className="client-monogram">SA</div><div><span className="eyebrow">CLIENT PORTAL / PRIVATE WORKSPACE</span><h1>{clientName}</h1><p>Your parts requests, from request to fulfillment.</p></div><span className="client-scope"><CheckCircle2 size={15} /> Client view</span></header>
      <div className="client-access-intro"><div><h2>Parts requests</h2><p>Track your submitted requests and contact the parts team about a specific item.</p></div><span>{clientRequests.length} requests in your workspace</span></div>
      <div className="parts-toolbar"><label><Search size={16} /><input aria-label="Search client requests" placeholder="Search part, P/N, or request…" value={query} onChange={event => setQuery(event.target.value)} /></label><span>{visible.length} shown</span></div>
      <div className="parts-board client-parts-board">{stages.map((stage, index) => {
        const rows = visible.filter(request => request.stage === stage);
        return <section className="parts-column" key={stage} aria-label={`${stage} requests`}><div className="parts-column-head"><span className={`parts-column-dot ${["blue", "amber", "violet", "green"][index]}`} /><h3>{stage}</h3><em className="parts-column-count">{rows.length}</em></div><div className="parts-column-cards">{rows.map(request => <article className="parts-card" key={request.id}>
          <button className="parts-card-open" onClick={() => setSelected(request)} aria-label={`View ${request.id} ${request.partName}`}><img className="parts-image" src={request.photo} alt={`Illustrative ${request.partName}`} /><span className="parts-card-id">{request.id} · {request.category}</span><strong>{request.partName}</strong><span className="parts-card-pn">P/N: {request.partNumber}</span><span className="parts-card-meta">{request.aircraftType}</span><div className="parts-card-footer"><span>Qty: {request.qty}</span><StatusPill status={request.priority} /></div><time>{request.requestDate}</time></button>
          <div className="client-card-actions"><button onClick={() => openQuestion(request)}><MessageSquareText size={14} /> Ask a Question</button>{stage === "Fulfilled" && <button className={received.includes(request.id) ? "received" : ""} onClick={() => markReceived(request)} disabled={received.includes(request.id)}><CheckCircle2 size={14} /> {received.includes(request.id) ? "Received" : "Mark as Fulfilled"}</button>}</div>
        </article>)}</div>{!rows.length && <p className="parts-empty">No requests in this stage.</p>}</section>;
      })}</div>
      <p className="client-demo-note">Demo client workspace · Request details and acknowledgements are sample data. Changes reset on refresh. Part photographs are illustrative.</p>
      <Dialog open={!!selected && !questionOpen} onOpenChange={open => { if (!open) setSelected(null); }}><DialogContent className="client-detail-dialog"><DialogHeader><span className="eyebrow">REQUEST {selected?.id}</span><DialogTitle>{selected?.partName}</DialogTitle><DialogDescription>{selected?.stage} · {selected?.partNumber}</DialogDescription></DialogHeader>{selected && <><img src={selected.photo} alt={`Illustrative ${selected.partName}`} /><dl><div><dt>Quantity</dt><dd>{selected.qty}</dd></div><div><dt>Aircraft type</dt><dd>{selected.aircraftType}</dd></div><div><dt>Requested</dt><dd>{selected.requestDate}</dd></div><div><dt>Priority</dt><dd>{selected.priority}</dd></div></dl><p>{selected.notes}</p>{selected.quote && <p><strong>Quote:</strong> {selected.quote.supplier} · {selected.quote.leadTime} lead time</p>}<div className="client-detail-actions"><button onClick={() => openQuestion(selected)}><HelpCircle size={15} /> Ask a Question</button>{selected.stage === "Fulfilled" && <button className="primary-button" disabled={received.includes(selected.id)} onClick={() => markReceived(selected)}><CheckCircle2 size={15} /> {received.includes(selected.id) ? "Received" : "Mark as Fulfilled"}</button>}</div></>}</DialogContent></Dialog>
      <Dialog open={questionOpen} onOpenChange={open => { setQuestionOpen(open); if (!open) setSelected(null); }}><DialogContent className="client-question-dialog"><DialogHeader><span className="eyebrow">CONTACT PARTS TEAM</span><DialogTitle>Ask a Question</DialogTitle><DialogDescription>About {selected?.id} · {selected?.partName}</DialogDescription></DialogHeader><label>Your question<textarea value={question} onChange={event => setQuestion(event.target.value)} placeholder="What would you like to know about this request?" rows={5} /></label><div className="client-detail-actions"><button onClick={() => { setQuestionOpen(false); setSelected(null); }}><X size={15} /> Cancel</button><button className="primary-button" disabled={!question.trim()} onClick={() => { toast.success("Question saved for this demo", { description: "Messaging is not connected; no message was sent." }); setQuestionOpen(false); setSelected(null); }}>Submit question</button></div></DialogContent></Dialog>
    </section>
  );
}
