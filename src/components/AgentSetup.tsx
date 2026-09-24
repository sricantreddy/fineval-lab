import { useQuery } from "convex/react";
import { Check, Copy, Database, ExternalLink, KeyRound, LockKeyhole, ServerCog } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { AGENT_SYSTEM_PROMPT } from "@/domain/syntheticAgent";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const variables = [
  ["AGENT_API_KEY", "The provider secret. Convex encrypts it and never returns it to the browser."],
  ["AGENT_MODEL", "The model identifier, for example gpt-4.1-mini or an OpenRouter model slug."],
  ["AGENT_API_BASE_URL", "The OpenAI-compatible API root. Defaults to https://api.openai.com/v1."],
  ["AGENT_PROVIDER", "A display name recorded with traces and evaluation runs."],
];

export function AgentSetup() {
  const status = useQuery(api.agentVersions.providerStatus);
  const versions = useQuery(api.agentVersions.list);
  const dataset = useQuery(api.goldenDataset.summary);

  return (
    <div className="space-y-5">
      <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-5">
            <div><CardTitle>Connected agent API</CardTitle><CardDescription>Add the model that acts as the agent brain.</CardDescription></div>
            <Badge variant="secondary">{status?.configured ? <><Check className="mr-1 size-3" />Configured</> : "Setup required"}</Badge>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-2xl border border-border bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
              Add secrets in the Convex dashboard under <span className="font-medium text-foreground">Settings → Environment Variables</span>. Add them separately to the development and production deployments. The app never stores an API key in Convex tables, local storage, Vercel, or GitHub.
            </div>
            <div className="space-y-3">{variables.map(([name, description]) => <div key={name} className="grid gap-2 rounded-2xl border border-border p-4 sm:grid-cols-[190px_1fr]"><code className="text-xs font-medium">{name}</code><p className="text-xs leading-5 text-muted-foreground">{description}</p></div>)}</div>
            <a href="https://dashboard.convex.dev/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground">Open Convex dashboard <ExternalLink className="size-3.5" /></a>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card><CardHeader><CardTitle>Provider status</CardTitle><CardDescription>Only non-secret metadata appears here.</CardDescription></CardHeader><CardContent className="space-y-4 text-sm"><Meta icon={ServerCog} label="Provider" value={status?.provider ?? "Loading"} /><Meta icon={KeyRound} label="Model" value={status?.model ?? "Loading"} /><Meta icon={LockKeyhole} label="Secret" value={status?.configured ? "Stored in Convex" : "Not configured"} /></CardContent></Card>
          <Card><CardHeader><CardTitle>Golden dataset</CardTitle><CardDescription>The approved regression baseline.</CardDescription></CardHeader><CardContent><div className="flex items-end justify-between"><div><p className="text-4xl font-semibold tracking-[-0.04em]">{dataset?.caseCount ?? 0}</p><p className="mt-1 text-xs text-muted-foreground">synthetic cases</p></div><Badge variant="secondary"><Database className="mr-1 size-3" />{dataset?.version ?? "Loading"}</Badge></div></CardContent></Card>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Agent versions</CardTitle><CardDescription>Every version pins its provider, model, prompt, and dataset.</CardDescription></CardHeader><CardContent className="space-y-3">{versions?.length ? versions.map((version) => <div key={version._id} className="rounded-2xl border border-border p-4"><div className="flex items-center justify-between gap-4"><p className="text-sm font-medium">{version.version} · {version.label}</p>{version.active ? <Badge variant="secondary">Active</Badge> : null}</div><p className="mt-2 text-xs leading-5 text-muted-foreground">{version.provider}/{version.model} · {version.promptVersion} · {version.datasetVersion}</p></div>) : <p className="text-sm text-muted-foreground">Seed the golden dataset to register the first version.</p>}</CardContent></Card>
        <Card><CardHeader><CardTitle>Current system prompt</CardTitle><CardDescription>The prompt text is versioned with the agent configuration.</CardDescription></CardHeader><CardContent><pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-2xl border border-border bg-background/50 p-4 font-mono text-xs leading-6 text-muted-foreground">{AGENT_SYSTEM_PROMPT}</pre></CardContent></Card>
      </section>
    </div>
  );
}

function Meta({ icon: Icon, label, value }: { icon: typeof Copy; label: string; value: string }) {
  return <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full border border-border bg-muted"><Icon className="size-4" /></span><div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-0.5 break-all font-medium">{value}</p></div></div>;
}
