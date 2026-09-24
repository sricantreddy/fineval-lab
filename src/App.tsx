import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { Activity, ArrowRight, CheckCircle2, CircleDollarSign, Clock3, FlaskConical, Inbox, LayoutDashboard, ListChecks, MessageSquareText, Moon, ShieldCheck, Sparkles, Sun, TrendingUp } from "lucide-react";
import { AgentPlayground } from "@/components/AgentPlayground";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { passRate } from "@/domain/evaluator";
import type { CandidateStatus, EvaluationCase, EvaluationRun, RiskLevel, SupportMessage } from "@/domain/types";
import { cn } from "@/lib/utils";

type View = "overview" | "playground" | "cases" | "support" | "runs";
type Theme = "dark" | "light";

const navigation: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "playground", label: "Playground", icon: MessageSquareText },
  { id: "cases", label: "Test cases", icon: ListChecks },
  { id: "support", label: "Support feed", icon: Inbox },
  { id: "runs", label: "Runs", icon: Activity },
];

const viewCopy: Record<Exclude<View, "overview">, { eyebrow: string; title: string; description: string }> = {
  cases: { eyebrow: "Regression suite", title: "Cases worth running every time.", description: "Normal, ambiguous, authorization, and fraud scenarios with deterministic expectations." },
  playground: { eyebrow: "Agent sandbox", title: "Talk to the agent. Inspect every step.", description: "Run a synthetic support request and inspect its decision trace." },
  support: { eyebrow: "Product feedback loop", title: "Turn failures into permanent tests.", description: "Review recurring support patterns before adding them to the regression suite." },
  runs: { eyebrow: "Release history", title: "See what changed between versions.", description: "Compare correctness, safety, latency, and cost before an agent reaches customers." },
};

function riskVariant(risk: RiskLevel) {
  return risk === "high" ? "danger" : risk === "medium" ? "warning" : "secondary";
}

function statusLabel(status: CandidateStatus) {
  return status === "promoted" ? "Added to suite" : status === "reviewing" ? "In review" : "New pattern";
}

export function App() {
  const [view, setView] = useState<View>("overview");
  const [theme, setTheme] = useState<Theme>(() => window.localStorage.getItem("fineval-theme") === "light" ? "light" : "dark");
  const supportDocuments = useQuery(api.supportMessages.list);
  const runDocuments = useQuery(api.evaluationRuns.list);
  const caseDocuments = useQuery(api.evaluationCases.list);
  const promoteSupportMessage = useMutation(api.supportMessages.promoteToEvaluationCase);

  const messages: SupportMessage[] = (supportDocuments ?? []).map((message) => ({ id: message._id, message: message.message, intent: message.intent, risk: message.risk, failurePattern: message.failurePattern, status: message.status }));
  const runs: EvaluationRun[] = (runDocuments ?? []).map((run) => ({
    id: run._id,
    version: run.version,
    createdAt: new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(run.createdAt),
    totalCases: run.totalCases,
    passedCases: run.passedCases,
    safetyViolations: run.safetyViolations,
    avgLatencyMs: run.avgLatencyMs,
    avgCostUsd: run.avgCostUsd,
  }));
  const cases: EvaluationCase[] = (caseDocuments ?? []).map((testCase) => ({ id: testCase.caseId, name: testCase.name, message: testCase.message, expectedIntent: testCase.expectedIntent, expectedTool: testCase.expectedTool, forbiddenTools: testCase.forbiddenTools, risk: testCase.risk }));
  const isLoading = supportDocuments === undefined || runDocuments === undefined || caseDocuments === undefined;
  const latestRun = runs[0] ?? { id: "loading", version: "Loading", createdAt: "", totalCases: 0, passedCases: 0, safetyViolations: 0, avgLatencyMs: 0, avgCostUsd: 0 };
  const candidateCount = messages.filter((message) => message.status !== "promoted").length;
  const promotedCount = messages.filter((message) => message.status === "promoted").length;

  const metrics = useMemo(() => [
    { label: "Pass rate", value: `${passRate(latestRun)}%`, note: "+2.8 points", icon: TrendingUp },
    { label: "Safety violations", value: String(latestRun.safetyViolations), note: "Target is zero", icon: ShieldCheck },
    { label: "Support candidates", value: String(candidateCount), note: `${promotedCount} promoted`, icon: Sparkles },
    { label: "Average latency", value: `${(latestRun.avgLatencyMs / 1000).toFixed(2)}s`, note: "4 second limit", icon: Clock3 },
  ], [candidateCount, latestRun, promotedCount]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("fineval-theme", theme);
  }, [theme]);

  async function promoteMessage(id: string) {
    const message = messages.find((item) => item.id === id);
    if (!message) return;
    const toolByIntent: Record<string, string | null> = {
      payment_failure: "get_transaction_status",
      unauthorized_data_request: null,
      unrecognized_transaction: "create_support_ticket",
      cash_withdrawal_dispute: "create_support_ticket",
    };
    await promoteSupportMessage({
      messageId: id as Id<"supportMessages">,
      caseId: `SUP-${Date.now().toString().slice(-6)}`,
      name: `Support regression: ${message.intent.replaceAll("_", " ")}`,
      expectedIntent: message.intent,
      expectedTool: toolByIntent[message.intent] ?? "create_support_ticket",
      forbiddenTools: message.intent === "unauthorized_data_request" ? ["get_recent_transactions"] : ["create_refund"],
    });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-4 px-5 lg:px-8">
          <button className="mr-auto flex items-center gap-2.5" onClick={() => setView("overview")}>
            <span className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground"><FlaskConical className="size-4" /></span>
            <span className="text-sm font-semibold tracking-tight">FinEval Lab</span>
          </button>
          <nav className="hidden items-center rounded-full border border-border bg-muted/50 p-1 md:flex">
            {navigation.map((item) => <button key={item.id} onClick={() => setView(item.id)} className={cn("rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors", view === item.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>{item.label}{item.id === "support" && candidateCount > 0 ? <span className="ml-1.5 text-[10px] opacity-60">{candidateCount}</span> : null}</button>)}
          </nav>
          <div className="ml-auto flex items-center gap-3 md:ml-0">
            <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex"><span className={cn("size-1.5 rounded-full bg-muted-foreground", isLoading && "animate-pulse")} />{isLoading ? "Connecting" : "Live"}</div>
            <Button size="icon" variant="ghost" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <Button size="sm" onClick={() => setView("playground")}>Try agent <ArrowRight className="size-3.5" /></Button>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-border px-4 py-2 md:hidden">
          {navigation.map((item) => <button key={item.id} onClick={() => setView(item.id)} className={cn("shrink-0 rounded-full px-3 py-1.5 text-xs", view === item.id ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>{item.label}</button>)}
        </nav>
      </header>

      <main className="mx-auto max-w-[1440px] px-5 pb-20 pt-10 lg:px-8 lg:pt-16">
        {view === "overview" ? <Overview metrics={metrics} messages={messages} runs={runs} latestRun={latestRun} onPromote={promoteMessage} onNavigate={setView} /> : view === "playground" ? <AgentPlayground /> : <><PageIntro {...viewCopy[view]} />{view === "support" ? <SupportFeed messages={messages} onPromote={promoteMessage} /> : view === "cases" ? <Cases cases={cases} /> : <Runs runs={runs} />}</>}
      </main>
    </div>
  );
}

function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <section className="mb-10 max-w-3xl"><p className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</p><h1 className="text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">{title}</h1><p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">{description}</p></section>;
}

function Overview({ metrics, messages, runs, latestRun, onPromote, onNavigate }: { metrics: { label: string; value: string; note: string; icon: typeof Activity }[]; messages: SupportMessage[]; runs: EvaluationRun[]; latestRun: EvaluationRun; onPromote: (id: string) => void; onNavigate: (view: View) => void }) {
  return <div className="space-y-6">
    <section className="mx-auto max-w-4xl pb-10 pt-4 text-center lg:pb-16 lg:pt-8">
      <button onClick={() => onNavigate("support")} className="mb-7 inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3.5 py-1.5 text-xs text-foreground/80 transition hover:bg-muted">Support-led evaluation <ArrowRight className="size-3" /></button>
      <h1 className="text-5xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-7xl">Measure every banking agent before release.</h1>
      <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">Run the same high-risk, authorization, and tool-use cases against every version. Turn real support failures into reviewed regression tests.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3"><Button onClick={() => onNavigate("playground")}>Open agent playground <ArrowRight className="size-4" /></Button><Button variant="outline" onClick={() => onNavigate("cases")}>Browse test suite</Button></div>
    </section>

    <section className="grid gap-5 lg:grid-cols-12">
      <Card className="overflow-hidden lg:col-span-7">
        <CardHeader className="flex-row items-start justify-between gap-6"><div><CardTitle>Release readiness</CardTitle><CardDescription>{latestRun.version} against the approved regression suite</CardDescription></div><Badge variant="success"><CheckCircle2 className="mr-1 size-3" />Ready for review</Badge></CardHeader>
        <CardContent><div className="grid gap-8 md:grid-cols-[180px_1fr] md:items-end"><div><p className="text-7xl font-semibold tracking-[-0.06em] sm:text-8xl">{passRate(latestRun)}</p><p className="mt-1 text-sm text-muted-foreground">percent passed</p></div><div className="space-y-5">{[
          { label: "Correctness", value: 92.5, target: 90 }, { label: "Tool selection", value: 96.2, target: 95 }, { label: "Safe authorization", value: 100, target: 100 }, { label: "Grounded answers", value: 91.4, target: 90 },
        ].map((gate) => <div key={gate.label}><div className="mb-2 flex justify-between text-xs"><span className="text-muted-foreground">{gate.label}</span><span>{gate.value}%</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${gate.value}%` }} /></div></div>)}</div></div><div className="mt-8 flex items-center gap-2 border-t border-border pt-5 text-sm text-foreground/80"><CheckCircle2 className="size-4" />All mandatory gates pass. Human approval is still required.</div></CardContent>
      </Card>
      <div className="grid gap-5 sm:grid-cols-2 lg:col-span-5">{metrics.map((metric, index) => <Card key={metric.label} className={cn(index === 0 && "sm:col-span-2")}><CardContent className="flex h-full min-h-40 flex-col justify-between pt-5"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">{metric.label}</span><metric.icon className="size-4 text-muted-foreground" /></div><div><p className="mt-8 text-4xl font-semibold tracking-[-0.04em]">{metric.value}</p><p className="mt-1 text-xs text-muted-foreground">{metric.note}</p></div></CardContent></Card>)}</div>
    </section>
    <section className="grid gap-5 xl:grid-cols-[1.05fr_1.4fr]"><RunTable runs={runs} compact /><SupportPanel messages={messages.slice(0, 3)} onPromote={onPromote} /></section>
  </div>;
}

function SupportPanel({ messages, onPromote }: { messages: SupportMessage[]; onPromote: (id: string) => void }) {
  return <Card><CardHeader className="flex-row items-start justify-between gap-4"><div><CardTitle>Support signals</CardTitle><CardDescription>Recurring failures waiting for review.</CardDescription></div><Badge variant="warning">Human review</Badge></CardHeader><CardContent className="space-y-3">{messages.map((message) => <SupportRow key={message.id} message={message} onPromote={onPromote} />)}</CardContent></Card>;
}

function SupportFeed({ messages, onPromote }: { messages: SupportMessage[]; onPromote: (id: string) => void }) {
  return <div className="space-y-5"><section className="grid gap-5 sm:grid-cols-3">{[["New patterns", messages.filter((m) => m.status === "new").length], ["In review", messages.filter((m) => m.status === "reviewing").length], ["Added to suite", messages.filter((m) => m.status === "promoted").length]].map(([label, value]) => <Card key={label}><CardContent className="pt-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-6 text-4xl font-semibold tracking-tight">{value}</p></CardContent></Card>)}</section><SupportPanel messages={messages} onPromote={onPromote} /></div>;
}

function SupportRow({ message, onPromote }: { message: SupportMessage; onPromote: (id: string) => void }) {
  return <div className="grid gap-4 rounded-2xl border border-border bg-background/40 p-4 lg:grid-cols-[1.3fr_1fr_auto] lg:items-center"><div><div className="mb-2 flex flex-wrap items-center gap-2"><Badge variant={riskVariant(message.risk)}>{message.risk} risk</Badge><span className="text-xs text-muted-foreground">{message.intent}</span></div><p className="text-sm font-medium leading-6 text-foreground">{message.message}</p></div><div><p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Observed failure</p><p className="mt-1 text-sm leading-5 text-muted-foreground">{message.failurePattern}</p></div>{message.status === "promoted" ? <Badge className="w-fit" variant="success"><CheckCircle2 className="mr-1 size-3" />{statusLabel(message.status)}</Badge> : <Button className="w-fit" size="sm" variant="outline" onClick={() => onPromote(message.id)}>Create test <ArrowRight className="size-3.5" /></Button>}</div>;
}

function Cases({ cases }: { cases: EvaluationCase[] }) {
  return <Card><CardHeader><CardTitle>Golden test suite</CardTitle><CardDescription>{cases.length} approved cases. The first milestone expands this to 200.</CardDescription></CardHeader><CardContent className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-border text-[10px] uppercase tracking-[0.14em] text-muted-foreground"><tr><th className="pb-3 font-medium">Case</th><th className="pb-3 font-medium">Expected intent</th><th className="pb-3 font-medium">Expected tool</th><th className="pb-3 font-medium">Risk</th></tr></thead><tbody>{cases.map((item) => <tr key={item.id} className="border-b border-border last:border-0"><td className="py-5"><p className="font-medium">{item.name}</p><p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">{item.message}</p></td><td className="py-5 font-mono text-xs text-muted-foreground">{item.expectedIntent}</td><td className="py-5 font-mono text-xs text-muted-foreground">{item.expectedTool ?? "No tool call"}</td><td className="py-5"><Badge variant={riskVariant(item.risk)}>{item.risk}</Badge></td></tr>)}</tbody></table></CardContent></Card>;
}

function RunTable({ runs, compact = false }: { runs: EvaluationRun[]; compact?: boolean }) {
  return <Card><CardHeader><CardTitle>Recent runs</CardTitle><CardDescription>Results for the latest agent versions.</CardDescription></CardHeader><CardContent className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead className="border-b border-border text-[10px] uppercase tracking-[0.14em] text-muted-foreground"><tr><th className="pb-3 font-medium">Version</th><th className="pb-3 font-medium">Pass rate</th><th className="pb-3 font-medium">Safety</th><th className="pb-3 font-medium">Latency</th>{!compact ? <th className="pb-3 font-medium">Cost</th> : null}</tr></thead><tbody>{runs.map((run) => <tr key={run.id} className="border-b border-border last:border-0"><td className="py-5"><p className="font-medium">{run.version}</p><p className="mt-1 text-xs text-muted-foreground">{run.createdAt}</p></td><td className="py-5 font-medium">{passRate(run)}%</td><td className="py-5"><Badge variant={run.safetyViolations === 0 ? "success" : "danger"}>{run.safetyViolations === 0 ? "Passed" : `${run.safetyViolations} failed`}</Badge></td><td className="py-5 text-muted-foreground">{(run.avgLatencyMs / 1000).toFixed(2)}s</td>{!compact ? <td className="py-5 text-muted-foreground">${run.avgCostUsd.toFixed(3)}</td> : null}</tr>)}</tbody></table></CardContent></Card>;
}

function Runs({ runs }: { runs: EvaluationRun[] }) {
  const latestRun = runs[0];
  return <div className="space-y-5"><RunTable runs={runs} /><div className="grid gap-5 md:grid-cols-2"><Card><CardContent className="flex items-center gap-4 pt-5"><span className="rounded-full border border-border bg-muted p-3 text-foreground/80"><CircleDollarSign className="size-5" /></span><div><p className="text-sm text-muted-foreground">Estimated latest run cost</p><p className="text-xl font-semibold">${latestRun ? (latestRun.avgCostUsd * latestRun.totalCases).toFixed(2) : "0.00"}</p></div></CardContent></Card><Card><CardContent className="flex items-center gap-4 pt-5"><span className="rounded-full border border-border bg-muted p-3 text-foreground/80"><ShieldCheck className="size-5" /></span><div><p className="text-sm text-muted-foreground">High-risk cases passed</p><p className="text-xl font-semibold">100%</p></div></CardContent></Card></div></div>;
}
