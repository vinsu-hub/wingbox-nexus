import { aircraft } from "@/data/aircraft";
import { findings } from "@/data/mock/findings";
import { directives } from "@/data/mock/compliance";
import { ROUTES } from "@/routes";

export interface AssistantTable {
  title: string;
  columns: string[];
  rows: { cells: string[]; href?: string }[];
}

export interface AssistantReply {
  intro: string;
  table?: AssistantTable;
  outro?: string;
  citations?: { label: string; href: string }[];
  followUp?: string;
}

export interface ScriptedConversation {
  id: string;
  steps: { question: string; reply: AssistantReply }[];
}

const a320 = aircraft.find(item => item.tail === "RP-C9923")!;
const atr = aircraft.find(item => item.tail === "RP-C8841")!;
const a320Findings = findings.filter(item => item.tail === a320.tail);
const atrFindings = findings.filter(item => item.tail === atr.tail);
const a320Directives = directives.filter(item =>
  item.adSbNumber.startsWith("AD ") && item.affected.some(affected => affected.tail === a320.tail && affected.status !== "N/A")
).slice(0, 3);

export const scriptedConversations: ScriptedConversation[] = [
  {
    id: "maintenance",
    steps: [
      {
        question: `Show me the recent maintenance findings for ${a320.tail}.`,
        reply: {
          intro: `The demo findings register has ${a320Findings.length} findings for ${a320.tail} (${a320.type}). Here is the current snapshot:`,
          table: {
            title: `Findings · ${a320.tail}`,
            columns: ["Date", "Finding", "ATA", "Status"],
            rows: a320Findings.map(item => ({
              cells: [item.createdAt.split(" · ")[0], item.title, item.ataSection, item.status],
              href: ROUTES.findings,
            })),
          },
          outro: "Open a finding in the Findings register to review its corrective action and recorded references. Would you like to see the ADs recorded for this aircraft?",
          citations: [{ label: "Demo findings register", href: ROUTES.findings }],
          followUp: `Show me the ADs recorded for ${a320.tail}.`,
        },
      },
      {
        question: `Show me the ADs recorded for ${a320.tail}.`,
        reply: {
          intro: `These ${a320Directives.length} airworthiness directives in the demo compliance register are marked applicable to ${a320.tail}:`,
          table: {
            title: `Recorded ADs · ${a320.tail}`,
            columns: ["AD number", "Description", "Authority", "Status"],
            rows: a320Directives.map(item => ({
              cells: [item.adSbNumber, item.description.split(". ")[0], item.authority, item.affected.find(affected => affected.tail === a320.tail)?.status ?? "N/A"],
              href: ROUTES.compliance,
            })),
          },
          outro: "These sample records are for demonstration. Check the Compliance register and approved source documents before making a maintenance or airworthiness decision.",
          citations: [{ label: "Demo compliance register", href: ROUTES.compliance }],
        },
      },
    ],
  },
  {
    id: "inspection",
    steps: [
      {
        question: `What needs attention on ${atr.tail}?`,
        reply: {
          intro: `${atr.tail} is an ${atr.type} currently marked “${atr.status}” in the demo fleet. Its recorded finding is:`,
          table: {
            title: `Inspection finding · ${atr.tail}`,
            columns: ["Finding", "Location", "Severity", "Status"],
            rows: atrFindings.map(item => ({
              cells: [item.title, item.location, item.severity, item.status],
              href: ROUTES.findings,
            })),
          },
          outro: `The fleet snapshot lists its next interval at ${atr.next}. Review the inspection and engineering disposition before drawing an operational conclusion.`,
          citations: [
            { label: "Demo fleet record", href: ROUTES.aircraftRecord(atr.tail) },
            { label: "Demo findings register", href: ROUTES.findings },
          ],
          followUp: `What is the next step for the finding on ${atr.tail}?`,
        },
      },
      {
        question: `What is the next step for the finding on ${atr.tail}?`,
        reply: {
          intro: `For ${atrFindings[0]?.title ?? "the recorded finding"}, the demo record calls for: ${atrFindings[0]?.correctiveAction ?? "reviewing the approved maintenance procedure"}`,
          outro: "This summarizes a sample record only. Use the approved manual and an authorized engineer's assessment for actual work.",
          citations: [{ label: "Demo finding detail", href: ROUTES.findings }],
        },
      },
    ],
  },
];

export const suggestedPromptGroups = [
  { category: "Maintenance", prompts: [
    { label: `Recent findings for ${a320.tail}`, conversationId: "maintenance", step: 0 },
    { label: `What needs attention on ${atr.tail}?`, conversationId: "inspection", step: 0 },
  ] },
  { category: "Compliance", prompts: [
    { label: `ADs recorded for ${a320.tail}`, conversationId: "maintenance", step: 1 },
    { label: "Review the compliance register", conversationId: "maintenance", step: 1 },
  ] },
  { category: "Troubleshooting", prompts: [
    { label: `Next step for ${atr.tail}'s finding`, conversationId: "inspection", step: 1 },
  ] },
  { category: "Reports", prompts: [
    { label: `Summarize ${a320.tail} findings`, conversationId: "maintenance", step: 0 },
  ] },
] as const;
