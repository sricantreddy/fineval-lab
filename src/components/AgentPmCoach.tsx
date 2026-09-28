import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpenCheck, Check, RotateCcw, ShieldQuestion, X } from "lucide-react";
import {
  AGENT_PM_CHALLENGES,
  answerChallenge,
  coachLensCopy,
  compareRunToChallenge,
  lensProgress,
  type AgentPmChallenge,
  type CoachAnswers,
  type CoachLens,
} from "@/domain/agentPmCoach";
import type { SyntheticAgentRun } from "@/domain/syntheticAgent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "fineval-agent-pm-coach-v1";
const lenses: CoachLens[] = ["capability", "boundary", "failure", "operating_rule"];

function loadAnswers(): CoachAnswers {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) as CoachAnswers : {};
  } catch {
    return {};
  }
}

export function AgentPmCoach({ run, onRunChallenge, pending }: {
  run: SyntheticAgentRun | null;
  onRunChallenge: (challenge: AgentPmChallenge) => void;
  pending: boolean;
}) {
  const [answers, setAnswers] = useState<CoachAnswers>(loadAnswers);
  const [challengeIndex, setChallengeIndex] = useState(() => {
    const firstUnanswered = AGENT_PM_CHALLENGES.findIndex((challenge) => !loadAnswers()[challenge.id]);
    return firstUnanswered === -1 ? 0 : firstUnanswered;
  });
  const challenge = AGENT_PM_CHALLENGES[challengeIndex];
  const answer = answers[challenge.id];
  const matchingRun = run?.message === challenge.message ? run : null;
  const comparison = matchingRun ? compareRunToChallenge(matchingRun, challenge) : null;
  const totalCorrect = Object.values(answers).filter((item) => item.correct).length;
  const totalAnswered = Object.keys(answers).length;

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
  }, [answers]);

  const progress = useMemo(() => lenses.map((lens) => ({ lens, ...lensProgress(answers, lens) })), [answers]);

  function chooseAnswer(optionId: string) {
    setAnswers((current) => ({ ...current, [challenge.id]: answerChallenge(challenge, optionId) }));
  }

  function nextChallenge() {
    setChallengeIndex((current) => (current + 1) % AGENT_PM_CHALLENGES.length);
  }

  function resetPractice() {
    setAnswers({});
    setChallengeIndex(0);
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <div className="mb-2 flex items-center gap-2"><ShieldQuestion className="size-4" /><CardTitle>Agent PM practice</CardTitle></div>
            <CardDescription>Make the product decision first. Then run the agent and compare your judgment with its behavior.</CardDescription>
          </div>
          <div className="flex items-center gap-2"><Badge variant="secondary">{totalCorrect}/{totalAnswered || 0} correct</Badge><Button variant="ghost" size="sm" onClick={resetPractice} disabled={totalAnswered === 0}><RotateCcw className="size-3.5" />Reset</Button></div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 p-5 sm:p-6 xl:grid-cols-[0.75fr_1.25fr]">
        <section>
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Learning coverage</p>
          <div className="mt-4 space-y-4">
            {progress.map((item) => {
              const width = item.total === 0 ? 0 : (item.answered / item.total) * 100;
              return <div key={item.lens}><div className="mb-1.5 flex items-center justify-between text-xs"><span>{coachLensCopy[item.lens].label}</span><span className="text-muted-foreground">{item.correct}/{item.total}</span></div><div className="h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${width}%` }} /></div></div>;
            })}
          </div>
          <div className="mt-5 rounded-2xl border border-border bg-muted/30 p-4">
            <p className="text-sm font-medium">Actions produce information.</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Your prediction, the recorded trace, and the regression rule turn one sandbox action into reusable product experience. Progress stays on this browser.</p>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-background/40 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><Badge variant="secondary">{coachLensCopy[challenge.lens].label}</Badge><span className="text-xs text-muted-foreground">Challenge {challengeIndex + 1} of {AGENT_PM_CHALLENGES.length}</span></div>{answer ? <Badge variant={answer.correct ? "success" : "danger"}>{answer.correct ? <Check className="mr-1 size-3" /> : <X className="mr-1 size-3" />}{answer.correct ? "Sound decision" : "Revisit this"}</Badge> : null}</div>
          <h3 className="mt-4 text-lg font-semibold tracking-tight">{challenge.title}</h3>
          <p className="mt-2 rounded-xl bg-muted/50 p-3 text-sm leading-6">Customer: "{challenge.message}"</p>
          <p className="mt-4 text-sm font-medium">{challenge.question}</p>
          <div className="mt-3 grid gap-2">
            {challenge.options.map((option) => {
              const selected = answer?.selectedOptionId === option.id;
              const correct = answer && option.id === challenge.correctOptionId;
              return <button key={option.id} onClick={() => chooseAnswer(option.id)} className={cn("rounded-xl border px-3 py-2.5 text-left text-sm transition", selected ? "border-foreground bg-primary text-primary-foreground" : "border-border hover:bg-muted/60", correct && !selected && "border-foreground/40")}><span className="mr-2 text-xs opacity-60">{String.fromCharCode(65 + challenge.options.indexOf(option))}.</span>{option.label}</button>;
            })}
          </div>

          {answer ? <div className="mt-4 space-y-3 border-t border-border pt-4"><p className="text-sm leading-6 text-muted-foreground">{challenge.explanation}</p><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-muted/40 p-3"><p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Never do</p><p className="mt-1 text-xs leading-5">{challenge.forbiddenAction}</p></div><div className="rounded-xl bg-muted/40 p-3"><p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Applied in the product</p><p className="mt-1 text-xs leading-5">{challenge.appliedIn}</p></div></div>
            {comparison ? <div className="flex flex-col justify-between gap-3 rounded-xl border border-border p-3 sm:flex-row sm:items-center"><div><p className="text-sm font-medium">Observed agent behavior {comparison.passed ? "matched" : "did not match"}</p><p className="mt-1 text-xs text-muted-foreground">Intent {comparison.intent ? "matched" : "failed"} · Tool {comparison.tool ? "matched" : "failed"}</p></div><Badge variant={comparison.passed ? "success" : "danger"}>{comparison.passed ? "Regression passed" : "Regression candidate"}</Badge></div> : null}
            <div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => onRunChallenge(challenge)} disabled={pending}>{pending ? "Running" : "Run and inspect"}<BookOpenCheck className="size-3.5" /></Button><Button size="sm" variant="outline" onClick={nextChallenge}>Next challenge <ArrowRight className="size-3.5" /></Button></div>
          </div> : <p className="mt-4 text-xs leading-5 text-muted-foreground">Choose before running the scenario. The goal is to practice the product judgment, not guess what the current code happens to do.</p>}
        </section>
      </CardContent>
    </Card>
  );
}
