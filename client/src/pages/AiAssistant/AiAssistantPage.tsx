import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "wouter";
import {
  ArrowRight, BookOpen, ChartNoAxesCombined, ClipboardList, FileText,
  Lightbulb, MessageCircleQuestion, Send, ShieldCheck, Sparkles, Wrench,
} from "lucide-react";
import {
  scriptedConversations, suggestedPromptGroups,
  type AssistantReply,
} from "@/data/mock/ai-assistant";

interface Message {
  id: number;
  role: "user" | "assistant";
  text?: string;
  reply?: AssistantReply;
}

const quickEntries = [
  { title: "Ask Questions", description: "Get answers from sample maintenance records.", icon: MessageCircleQuestion, conversationId: "maintenance", step: 0 },
  { title: "Analyze Data", description: "Explore findings and fleet insights.", icon: ChartNoAxesCombined, conversationId: "inspection", step: 0 },
  { title: "Troubleshoot", description: "Review a recorded issue and next step.", icon: Wrench, conversationId: "inspection", step: 1 },
  { title: "Work Smarter", description: "Find recorded ADs quickly.", icon: Lightbulb, conversationId: "maintenance", step: 1 },
] as const;
const categoryIcons = { Maintenance: Wrench, Compliance: ShieldCheck, Troubleshooting: Lightbulb, Reports: FileText };

function ResponseTable({ table }: { table: NonNullable<AssistantReply["table"]> }) {
  return (
    <div className="ai-assistant-table-scroll">
      <table className="ai-assistant-table">
        <caption>{table.title}</caption>
        <thead><tr>{table.columns.map(column => <th key={column}>{column}</th>)}<th>Record</th></tr></thead>
        <tbody>{table.rows.map((row, index) => <tr key={`${row.cells[0]}-${index}`}>
          {row.cells.map((cell, cellIndex) => <td key={cellIndex}>
            {cellIndex === row.cells.length - 1 ? <span className={`ai-assistant-status ${cell.toLowerCase().replaceAll(" ", "-")}`}>{cell}</span> : cell}
          </td>)}
          <td>{row.href ? <Link href={row.href} className="ai-assistant-record-link">View <ArrowRight size={12} /></Link> : "—"}</td>
        </tr>)}</tbody>
      </table>
    </div>
  );
}

function AssistantMessage({ reply, onFollowUp }: { reply: AssistantReply; onFollowUp: (text: string) => void }) {
  return <div className="ai-assistant-answer">
    <p>{reply.intro}</p>
    {reply.table && <ResponseTable table={reply.table} />}
    {reply.outro && <p>{reply.outro}</p>}
    {reply.citations && <div className="ai-assistant-citations"><BookOpen size={13} /> Sources: {reply.citations.map((citation, index) => <span key={citation.label}>{index > 0 && " · "}<Link href={citation.href}>{citation.label}</Link></span>)}</div>}
    {reply.followUp && <button className="ai-assistant-follow-up" onClick={() => onFollowUp(reply.followUp!)}>Ask: {reply.followUp} <ArrowRight size={13} /></button>}
  </div>;
}

export function AiAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const nextId = useRef(0);
  const transcriptEnd = useRef<HTMLDivElement>(null);

  useEffect(() => { transcriptEnd.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [messages]);

  const addExchange = (question: string, reply: AssistantReply) => {
    setMessages(current => [
      ...current,
      { id: ++nextId.current, role: "user", text: question },
      { id: ++nextId.current, role: "assistant", reply },
    ]);
  };
  const runScript = (conversationId: string, step: number) => {
    const conversation = scriptedConversations.find(item => item.id === conversationId);
    if (!conversation) return;
    const steps = conversation.steps.slice(0, step + 1);
    setMessages(steps.flatMap(item => [
      { id: ++nextId.current, role: "user" as const, text: item.question },
      { id: ++nextId.current, role: "assistant" as const, reply: item.reply },
    ]));
    setDraft("");
  };
  const submitQuestion = (question: string) => {
    const clean = question.trim();
    if (!clean) return;
    const matched = scriptedConversations.flatMap(conversation => conversation.steps).find(step => step.question.toLowerCase() === clean.toLowerCase());
    addExchange(clean, matched?.reply ?? {
      intro: "This is a scripted demo, so I cannot search live records or answer that question reliably. Try one of the suggested prompts to explore sample findings and ADs.",
      citations: [{ label: "Browse demo findings", href: "/findings" }],
    });
    setDraft("");
  };
  const onSubmit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); submitQuestion(draft); };

  return <section className="ai-assistant-page">
    <header className="ai-assistant-heading">
      <div><div className="eyebrow">TECHNICAL / AI ASSISTANT</div><h1>AI Assistant</h1><p>Explore maintenance questions, fleet records, and compliance examples.</p></div>
      <span className="ai-assistant-demo-label"><Sparkles size={13} /> Scripted demo · sample data</span>
    </header>
    <div className="ai-assistant-main">
      <div className="ai-assistant-workspace">
        <div className="ai-assistant-quick-grid">
          {quickEntries.map(entry => <button key={entry.title} className="ai-assistant-quick-card" onClick={() => runScript(entry.conversationId, entry.step)}>
            <span className="ai-assistant-quick-icon"><entry.icon size={19} /></span><span><strong>{entry.title}</strong><small>{entry.description}</small></span>
          </button>)}
        </div>
        <div className="ai-assistant-chat-layout">
          <aside className="ai-assistant-prompts panel" aria-label="Suggested prompts">
            <h2>Suggested Prompts</h2>
            {suggestedPromptGroups.map(group => {
              const Icon = categoryIcons[group.category];
              return <div className="ai-assistant-prompt-group" key={group.category}>
                <h3><Icon size={14} /> {group.category}</h3>
                {group.prompts.map(prompt => <button key={prompt.label} onClick={() => runScript(prompt.conversationId, prompt.step)}>{prompt.label}<ArrowRight size={13} /></button>)}
              </div>;
            })}
          </aside>
          <div className="ai-assistant-chat panel">
            <div className="ai-assistant-chat-head"><span><Sparkles size={16} /> Demo conversation</span><button onClick={() => setMessages([])} disabled={messages.length === 0}>New chat</button></div>
            <div className="ai-assistant-transcript" aria-live="polite">
              {messages.length === 0 && <div className="ai-assistant-empty"><span><Sparkles size={23} /></span><h2>What would you like to explore?</h2><p>Choose a card or suggested prompt to open a sample conversation, or type your own question.</p><button onClick={() => runScript("maintenance", 1)}>See findings and related ADs <ArrowRight size={14} /></button></div>}
              {messages.map(message => <div key={message.id} className={`ai-assistant-message ${message.role}`}>
                <span className="ai-assistant-message-avatar">{message.role === "user" ? "You" : <Sparkles size={15} />}</span>
                <div className="ai-assistant-message-content">{message.role === "user" ? <p>{message.text}</p> : message.reply && <AssistantMessage reply={message.reply} onFollowUp={submitQuestion} />}</div>
              </div>)}
              <div ref={transcriptEnd} />
            </div>
            <form className="ai-assistant-composer" onSubmit={onSubmit}><label htmlFor="ai-assistant-input" className="sr-only">Your question</label><input id="ai-assistant-input" value={draft} onChange={event => setDraft(event.target.value)} placeholder="Ask a question (scripted demo; no live AI)" /><button type="submit" aria-label="Send question" disabled={!draft.trim()}><Send size={16} /></button></form>
          </div>
        </div>
      </div>
      <aside className="ai-assistant-intro panel" aria-label="Assistant guide">
        <div className="ai-assistant-intro-banner"><span><Sparkles size={18} /> AI Assistant</span><small>Ask. Analyze. Get Results.</small><div className="ai-assistant-illustration"><div className="ai-assistant-bot"><span>● ᴗ ●</span></div><div className="ai-assistant-speech"><i /><i /><i /></div></div></div>
        <div className="ai-assistant-intro-body"><h2>Hello, I’m your WingBox AI Assistant.</h2><p>This demo walks through sample fleet findings, compliance records, and follow-up questions.</p><div className="ai-assistant-examples"><h3>Example questions</h3><button onClick={() => runScript("maintenance", 0)}><ClipboardList size={14} /> Recent findings for RP-C9923</button><button onClick={() => runScript("maintenance", 1)}><ShieldCheck size={14} /> ADs recorded for RP-C9923</button><button onClick={() => runScript("inspection", 0)}><Wrench size={14} /> What needs attention on RP-C8841?</button></div><div className="ai-assistant-tip"><Lightbulb size={17} /><div><strong>Tip</strong><p>Choose a prompt to see a cited sample table. Demo answers are not maintenance guidance.</p></div></div></div>
        <div className="ai-assistant-intro-foot"><span /> Sample records · No live AI connection</div>
      </aside>
    </div>
  </section>;
}
