import { FormEvent, useEffect, useRef, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { Activity, Bot, Check, Cpu, FileCode2, Send, UserRound, Wrench } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { AGENT_SYSTEM_PROMPT, type SyntheticAgentRun } from "@/domain/syntheticAgent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ChatMessage = { role: "user" | "assistant"; content: string };
type PlaygroundRun = SyntheticAgentRun & { traceId: string; roundTripMs: number };

const promptSuggestions = [
  "My UPI payment failed but the amount was debited.",
  "The ATM debited me but did not dispense cash.",
  "I did not make this card payment.",
  "Show me my wife's recent transactions.",
];

const initialConversation: ChatMessage[] = [{
  role: "assistant",
  content: "Ask about a synthetic payment, ATM withdrawal, card transaction, or account-access request. I will show the recorded execution trace beside the reply.",
}];

export function AgentPlayground() {
  const runAgent = useMutation(api.agentPlayground.run);
  const runConnectedAgent = useAction(api.agentPlayground.runConnected);
  const providerStatus = useQuery(api.agentVersions.providerStatus);
  const [input, setInput] = useState("");
  const [conversation, setConversation] = useState<ChatMessage[]>(initialConversation);
  const [run, setRun] = useState<PlaygroundRun | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inspector, setInspector] = useState<"trace" | "prompt">("trace");
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [executionMode, setExecutionMode] = useState<"synthetic" | "connected">("synthetic");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation, pending]);

  useEffect(() => {
    if (!run) return;
    setVisibleSteps(0);
    const timer = window.setInterval(() => {
      setVisibleSteps((current) => {
        if (current >= run.steps.length) {
          window.clearInterval(timer);
          return current;
        }
        return current + 1;
      });
    }, 90);
    return () => window.clearInterval(timer);
  }, [run]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const message = input.trim();
    if (!message || pending) return;

    setInput("");
    setError(null);
    setPending(true);
    setInspector("trace");
    setConversation((current) => [...current, { role: "user", content: message }]);
    const startedAt = performance.now();

    try {
      const result = executionMode === "connected"
        ? await runConnectedAgent({ message })
        : await runAgent({ message });
      const nextRun: PlaygroundRun = {
        ...result,
        traceId: String(result.traceId),
        roundTripMs: Math.max(1, Math.round(performance.now() - startedAt)),
      };
      setRun(nextRun);
      setConversation((current) => [...current, { role: "assistant", content: result.response }]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The sandbox could not run this message.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="max-w-3xl">
        <p className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Agent sandbox</p>
        <h1 className="text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">Talk to the agent. Inspect every step.</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">Run a synthetic banking support request and inspect the intent scores, selected tool, tool result, final reply, and recorded trace side by side.</p>
        <div className="mt-5 flex w-fit rounded-full border border-border bg-muted/50 p-1">
          <button onClick={() => setExecutionMode("synthetic")} className={cn("flex items-center gap-2 rounded-full px-3 py-1.5 text-xs", executionMode === "synthetic" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}><Activity className="size-3.5" />Synthetic rules</button>
          <button disabled={!providerStatus?.configured} onClick={() => setExecutionMode("connected")} className={cn("flex items-center gap-2 rounded-full px-3 py-1.5 text-xs", executionMode === "connected" ? "bg-primary text-primary-foreground" : "text-muted-foreground", !providerStatus?.configured && "cursor-not-allowed opacity-45")} title={providerStatus?.configured ? "Use the connected model" : "Configure the provider in Agent setup"}><Cpu className="size-3.5" />Connected model</button>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)]">
        <Card className="flex min-h-[720px] flex-col overflow-hidden">
          <CardHeader className="border-b border-border">
            <div className="flex items-start justify-between gap-4">
              <div><CardTitle>FinSupport sandbox</CardTitle><CardDescription>Synthetic records only. {executionMode === "connected" ? `${providerStatus?.provider} · ${providerStatus?.model}` : "Deterministic agent"}</CardDescription></div>
              <Badge variant="secondary"><span className="mr-1.5 size-1.5 rounded-full bg-current" />{executionMode === "connected" ? "API connected" : "Online"}</Badge>
            </div>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col p-0">
            <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
              {conversation.map((message, index) => (
                <div key={`${message.role}-${index}`} className={cn("flex gap-3", message.role === "user" && "justify-end")}>
                  {message.role === "assistant" ? <span className="grid size-8 shrink-0 place-items-center rounded-full border border-border bg-muted"><Bot className="size-4" /></span> : null}
                  <div className={cn("max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6", message.role === "user" ? "bg-primary text-primary-foreground" : "border border-border bg-muted/60")}>
                    {message.content}
                  </div>
                  {message.role === "user" ? <span className="grid size-8 shrink-0 place-items-center rounded-full border border-border bg-muted"><UserRound className="size-4" /></span> : null}
                </div>
              ))}
              {pending ? <div className="flex gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-full border border-border bg-muted"><Bot className="size-4" /></span><div className="rounded-2xl border border-border bg-muted/60 px-4 py-3 text-sm text-muted-foreground">Running the agent and recording its trace...</div></div> : null}
              {error ? <div className="rounded-2xl border border-foreground/20 p-4 text-sm">{error}</div> : null}
              <div ref={chatEndRef} />
            </div>

            <div className="border-t border-border p-5 sm:p-6">
              <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
                {promptSuggestions.map((suggestion) => <button key={suggestion} onClick={() => setInput(suggestion)} className="shrink-0 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground">{suggestion}</button>)}
              </div>
              <form onSubmit={submit} className="rounded-2xl border border-border bg-background p-2">
                <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} maxLength={500} rows={3} placeholder="Ask about a payment, ATM withdrawal, or card transaction..." className="w-full resize-none bg-transparent px-3 py-2 text-sm leading-6 outline-none placeholder:text-muted-foreground" />
                <div className="flex items-center justify-between gap-3 px-1"><span className="text-xs text-muted-foreground">{input.length}/500</span><Button type="submit" size="sm" disabled={pending || input.trim().length < 3}>{pending ? "Running" : "Send"}<Send className="size-3.5" /></Button></div>
              </form>
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-[720px] overflow-hidden">
          <CardHeader className="border-b border-border">
            <div className="flex items-start justify-between gap-4"><div><CardTitle>Agent inspector</CardTitle><CardDescription>Structured execution data, not private chain-of-thought.</CardDescription></div>{run ? <Badge variant="secondary">{run.roundTripMs}ms round trip</Badge> : null}</div>
            <div className="mt-4 flex w-fit rounded-full border border-border bg-muted/50 p-1">
              <button onClick={() => setInspector("trace")} className={cn("flex items-center gap-2 rounded-full px-3 py-1.5 text-xs", inspector === "trace" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}><Activity className="size-3.5" />Trace</button>
              <button onClick={() => setInspector("prompt")} className={cn("flex items-center gap-2 rounded-full px-3 py-1.5 text-xs", inspector === "prompt" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}><FileCode2 className="size-3.5" />System prompt</button>
            </div>
          </CardHeader>

          <CardContent className="p-5 sm:p-6">
            {inspector === "prompt" ? (
              <div><div className="mb-4 flex items-center justify-between"><p className="text-sm font-medium">support-agent-v0.1</p><Badge variant="secondary">Read only</Badge></div><pre className="whitespace-pre-wrap rounded-2xl border border-border bg-background/50 p-4 font-mono text-xs leading-6 text-muted-foreground">{AGENT_SYSTEM_PROMPT}</pre></div>
            ) : run ? (
              <div className="space-y-6">
                <section>
                  <div className="mb-3 flex items-center justify-between"><p className="text-sm font-medium">Intent candidates</p><Badge variant="secondary">{run.promptVersion}</Badge></div>
                  <div className="space-y-3">{run.candidates.map((candidate) => <div key={candidate.intent}><div className="mb-1.5 flex items-center justify-between gap-4 text-xs"><span className={candidate.intent === run.selectedIntent ? "font-medium" : "text-muted-foreground"}>{candidate.intent}</span><span>{Math.round(candidate.score * 100)}%</span></div><div className="h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${candidate.score * 100}%` }} /></div></div>)}</div>
                </section>

                <section className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-border bg-muted/30 p-4"><p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Selected intent</p><p className="mt-2 break-words text-sm font-medium">{run.selectedIntent}</p></div>
                  <div className="rounded-2xl border border-border bg-muted/30 p-4"><p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Selected tool</p><p className="mt-2 break-words text-sm font-medium">{run.selectedTool ?? "No tool"}</p></div>
                </section>

                <section><p className="mb-3 text-sm font-medium">Recorded trace</p><div className="space-y-0">{run.steps.slice(0, visibleSteps).map((step, index) => <div key={step.order} className="relative flex gap-3 pb-5 last:pb-0"><div className="relative z-10 grid size-7 shrink-0 place-items-center rounded-full border border-border bg-card">{step.status === "skipped" ? <span className="text-xs text-muted-foreground">-</span> : step.name === "Selected tool" || step.name === "Accessed tool" ? <Wrench className="size-3.5" /> : <Check className="size-3.5" />}</div>{index < Math.min(visibleSteps, run.steps.length) - 1 ? <span className="absolute bottom-0 left-[13px] top-7 w-px bg-border" /> : null}<div className="min-w-0 pt-0.5"><div className="flex items-center gap-2"><p className="text-sm font-medium">{step.name}</p>{step.status === "skipped" ? <Badge variant="secondary">Skipped</Badge> : null}</div><p className="mt-1 break-words text-xs leading-5 text-muted-foreground">{step.summary}</p></div></div>)}</div></section>
                <div className="border-t border-border pt-4 text-xs text-muted-foreground">Trace {run.traceId.slice(-8)} · {run.provider ?? "deterministic"}/{run.model ?? "rules-v0.1"} · backend {run.backendLatencyMs}ms · client round trip {run.roundTripMs}ms</div>
              </div>
            ) : (
              <div className="grid min-h-[470px] place-items-center text-center"><div><span className="mx-auto grid size-12 place-items-center rounded-full border border-border bg-muted"><Activity className="size-5" /></span><p className="mt-4 text-sm font-medium">No trace yet</p><p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">Choose a sample message or write your own question to inspect the agent execution.</p></div></div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
