import { useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FlaskConical,
  Inbox,
  LayoutDashboard,
  ListChecks,
  Menu,
  Play,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { demoCases, demoRuns, demoSupportMessages } from "@/data/demo";
import { passRate } from "@/domain/evaluator";
import type { CandidateStatus, RiskLevel, SupportMessage } from "@/domain/types";
import { cn } from "@/lib/utils";

type View = "overview" | "cases" | "support" | "runs";

const navigation: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "cases", label: "Test cases", icon: ListChecks },
  { id: "support", label: "Support feed", icon: Inbox },
  { id: "runs", label: "Evaluation runs", icon: Activity },
];

const viewCopy: Record<View, { title: string; description: string }> = {
  overview: { title: "Agent quality overview", description: "Track whether each release is safer and more reliable than the last." },
  cases: { title: "Regression test cases", description: "Review normal, ambiguous, authorization, and fraud scenarios." },
  support: { title: "Support improvement feed", description: "Turn production failures into reviewed regression cases." },
  runs: { title: "Evaluation runs", description: "Compare agent versions across correctness, safety, latency, and cost." },
};

function riskVariant(risk: RiskLevel) {
  return risk === "high" ? "danger" : risk === "medium" ? "warning" : "secondary";
}

function statusLabel(status: CandidateStatus) {
  return status === "promoted" ? "Added to suite" : status === "reviewing" ? "In review" : "New pattern";
}

export function App() {
  const [view, setView] = useState<View>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>(demoSupportMessages);
  const latestRun = demoRuns[0];
  const candidateCount = messages.filter((message) => message.status !== "promoted").length;
  const promotedCount = messages.filter((message) => message.status === "promoted").length;

  const metrics = useMemo(
    () => [
      { label: "Pass rate", value: `${passRate(latestRun)}%`, note: "+2.8 points", icon: TrendingUp, tone: "text-emerald-700" },
      { label: "Safety violations", value: String(latestRun.safetyViolations), note: "Target is zero", icon: ShieldCheck, tone: "text-emerald-700" },
      { label: "Support candidates", value: String(candidateCount), note: `${promotedCount} already promoted`, icon: Sparkles, tone: "text-amber-700" },
      { label: "Average latency", value: `${(latestRun.avgLatencyMs / 1000).toFixed(2)}s`, note: "Limit is 4 seconds", icon: Clock3, tone: "text-blue-700" },
    ],
    [candidateCount, latestRun, promotedCount],
  );

  function promoteMessage(id: string) {
    setMessages((current) => current.map((message) => message.id === id ? { ...message, status: "promoted" } : message));
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside className={cn("fixed inset-y-0 left-0 z-40 w-64 border-r border-sidebar-border bg-sidebar px-4 py-5 transition-transform lg:static lg:translate-x-0", sidebarOpen ? "translate-x-0" : "-translate-x-full")}>
          <div className="mb-8 flex items-center justify-between px-2">
            <button className="flex items-center gap-3 text-left" onClick={() => setView("overview")}>
              <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground"><FlaskConical className="size-5" /></span>
              <span><span className="block text-sm font-semibold">FinEval Lab</span><span className="block text-xs text-muted-foreground">Banking agent quality</span></span>
            </button>
            <Button className="lg:hidden" size="icon" variant="ghost" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><X className="size-4" /></Button>
          </div>
          <nav className="space-y-1">
            {navigation.map((item) => (
              <button key={item.id} onClick={() => { setView(item.id); setSidebarOpen(false); }} className={cn("flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors", view === item.id ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground")}>
                <item.icon className="size-4" />{item.label}
                {item.id === "support" && candidateCount > 0 ? <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">{candidateCount}</span> : null}
              </button>
            ))}
          </nav>
          <div className="absolute bottom-5 left-4 right-4 rounded-lg border border-sidebar-border bg-background/70 p-3">
            <p className="text-xs font-medium">Environment</p>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground"><span className="size-2 rounded-full bg-emerald-500" />Demo data, ready for Convex</div>
          </div>
        </aside>

        {sidebarOpen ? <button className="fixed inset-0 z-30 bg-black/20 lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close navigation overlay" /> : null}

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur md:px-8">
            <div className="flex items-center gap-3">
              <Button className="lg:hidden" size="icon" variant="ghost" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu className="size-5" /></Button>
              <div><h1 className="text-base font-semibold md:text-lg">{viewCopy[view].title}</h1><p className="hidden text-sm text-muted-foreground sm:block">{viewCopy[view].description}</p></div>
            </div>
            <Button><Play className="size-4" />Run evaluation</Button>
          </header>

          <div className="mx-auto max-w-7xl p-4 md:p-8">
            {view === "overview" ? (
              <Overview metrics={metrics} messages={messages} onPromote={promoteMessage} />
            ) : view === "support" ? (
              <SupportFeed messages={messages} onPromote={promoteMessage} />
            ) : view === "cases" ? (
              <Cases />
            ) : (
              <Runs />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function Overview({ metrics, messages, onPromote }: { metrics: { label: string; value: string; note: string; icon: typeof Activity; tone: string }[]; messages: SupportMessage[]; onPromote: (id: string) => void }) {
  return <div className="space-y-6">
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => <Card key={metric.label}><CardContent className="flex items-start justify-between pt-5"><div><p className="text-sm text-muted-foreground">{metric.label}</p><p className="mt-2 text-3xl font-semibold tracking-tight">{metric.value}</p><p className="mt-1 text-xs text-muted-foreground">{metric.note}</p></div><span className={cn("rounded-lg bg-muted p-2.5", metric.tone)}><metric.icon className="size-5" /></span></CardContent></Card>)}
    </section>
    <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
      <RunTable compact />
      <Card>
        <CardHeader><CardTitle>Release gate</CardTitle><CardDescription>agent-v0.4.2 compared with the current production version</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          {[{ label: "Correctness", value: 92.5, target: 90 }, { label: "Tool selection", value: 96.2, target: 95 }, { label: "Safe authorization", value: 100, target: 100 }, { label: "Grounded answers", value: 91.4, target: 90 }].map((gate) => <div key={gate.label}><div className="mb-1.5 flex justify-between text-sm"><span>{gate.label}</span><span className="font-medium">{gate.value}%</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className={cn("h-full rounded-full", gate.value >= gate.target ? "bg-emerald-500" : "bg-amber-500")} style={{ width: `${gate.value}%` }} /></div></div>)}
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800"><CheckCircle2 className="size-4 shrink-0" />All mandatory gates pass. Ready for human approval.</div>
        </CardContent>
      </Card>
    </section>
    <SupportPanel messages={messages.slice(0, 3)} onPromote={onPromote} />
  </div>;
}

function SupportPanel({ messages, onPromote }: { messages: SupportMessage[]; onPromote: (id: string) => void }) {
  return <Card><CardHeader className="flex-row items-start justify-between"><div><CardTitle>Support messages to regression cases</CardTitle><CardDescription>Review recurring failures before adding them to the permanent suite.</CardDescription></div><Badge variant="warning">Human review required</Badge></CardHeader><CardContent className="space-y-3">{messages.map((message) => <SupportRow key={message.id} message={message} onPromote={onPromote} />)}</CardContent></Card>;
}

function SupportFeed({ messages, onPromote }: { messages: SupportMessage[]; onPromote: (id: string) => void }) {
  return <div className="space-y-6"><Card><CardContent className="grid gap-4 pt-5 md:grid-cols-3"><div><p className="text-sm text-muted-foreground">New patterns</p><p className="mt-1 text-2xl font-semibold">{messages.filter((m) => m.status === "new").length}</p></div><div><p className="text-sm text-muted-foreground">In review</p><p className="mt-1 text-2xl font-semibold">{messages.filter((m) => m.status === "reviewing").length}</p></div><div><p className="text-sm text-muted-foreground">Added to suite</p><p className="mt-1 text-2xl font-semibold">{messages.filter((m) => m.status === "promoted").length}</p></div></CardContent></Card><SupportPanel messages={messages} onPromote={onPromote} /></div>;
}

function SupportRow({ message, onPromote }: { message: SupportMessage; onPromote: (id: string) => void }) {
  return <div className="grid gap-4 rounded-lg border border-border p-4 lg:grid-cols-[1.3fr_1fr_auto] lg:items-center"><div><div className="mb-2 flex flex-wrap items-center gap-2"><Badge variant={riskVariant(message.risk)}>{message.risk} risk</Badge><span className="text-xs text-muted-foreground">{message.intent}</span></div><p className="text-sm font-medium leading-6">“{message.message}”</p></div><div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Observed failure</p><p className="mt-1 text-sm leading-5 text-muted-foreground">{message.failurePattern}</p></div>{message.status === "promoted" ? <Badge variant="success"><CheckCircle2 className="mr-1 size-3" />{statusLabel(message.status)}</Badge> : <Button size="sm" variant="outline" onClick={() => onPromote(message.id)}>Create test case<ArrowRight className="size-3.5" /></Button>}</div>;
}

function Cases() {
  return <Card><CardHeader><CardTitle>Golden test suite</CardTitle><CardDescription>{demoCases.length} starter cases are shown. The first milestone expands this to 200.</CardDescription></CardHeader><CardContent className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="pb-3 font-medium">Case</th><th className="pb-3 font-medium">Expected intent</th><th className="pb-3 font-medium">Expected tool</th><th className="pb-3 font-medium">Risk</th></tr></thead><tbody>{demoCases.map((item) => <tr key={item.id} className="border-b last:border-0"><td className="py-4"><p className="font-medium">{item.name}</p><p className="mt-1 max-w-md text-xs text-muted-foreground">{item.message}</p></td><td className="py-4 font-mono text-xs">{item.expectedIntent}</td><td className="py-4 font-mono text-xs">{item.expectedTool ?? "No tool call"}</td><td className="py-4"><Badge variant={riskVariant(item.risk)}>{item.risk}</Badge></td></tr>)}</tbody></table></CardContent></Card>;
}

function RunTable({ compact = false }: { compact?: boolean }) {
  return <Card><CardHeader><CardTitle>Recent evaluation runs</CardTitle><CardDescription>Regression results for the latest agent versions.</CardDescription></CardHeader><CardContent className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="border-b text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="pb-3 font-medium">Version</th><th className="pb-3 font-medium">Pass rate</th><th className="pb-3 font-medium">Safety</th><th className="pb-3 font-medium">Latency</th>{!compact ? <th className="pb-3 font-medium">Cost</th> : null}</tr></thead><tbody>{demoRuns.map((run) => <tr key={run.id} className="border-b last:border-0"><td className="py-4"><p className="font-medium">{run.version}</p><p className="text-xs text-muted-foreground">{run.createdAt}</p></td><td className="py-4 font-medium">{passRate(run)}%</td><td className="py-4"><Badge variant={run.safetyViolations === 0 ? "success" : "danger"}>{run.safetyViolations === 0 ? "Passed" : `${run.safetyViolations} failed`}</Badge></td><td className="py-4">{(run.avgLatencyMs / 1000).toFixed(2)}s</td>{!compact ? <td className="py-4">${run.avgCostUsd.toFixed(3)}</td> : null}</tr>)}</tbody></table></CardContent></Card>;
}

function Runs() {
  return <div className="space-y-6"><RunTable /><div className="grid gap-4 md:grid-cols-2"><Card><CardContent className="flex items-center gap-4 pt-5"><span className="rounded-lg bg-blue-50 p-3 text-blue-700"><CircleDollarSign className="size-5" /></span><div><p className="text-sm text-muted-foreground">Estimated cost for latest run</p><p className="text-xl font-semibold">${(demoRuns[0].avgCostUsd * demoRuns[0].totalCases).toFixed(2)}</p></div></CardContent></Card><Card><CardContent className="flex items-center gap-4 pt-5"><span className="rounded-lg bg-emerald-50 p-3 text-emerald-700"><ShieldCheck className="size-5" /></span><div><p className="text-sm text-muted-foreground">High-risk cases passed</p><p className="text-xl font-semibold">100%</p></div></CardContent></Card></div></div>;
}
