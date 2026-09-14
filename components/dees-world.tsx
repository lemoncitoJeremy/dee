"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { RefreshCw, Sparkles } from "lucide-react";
import { useAppData } from "@/lib/repository/provider";
import type { DeeQuestion } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const shortLabels: Record<string, string> = {
  "question-drink": "favorite drink",
  "question-food": "favorite food",
  "question-music": "music",
  "question-movie": "movie or series",
  "question-happy": "what makes you happy",
  "question-travel": "travel dream",
  "question-thinking": "recent thought",
};

function factFor(question: DeeQuestion): string {
  const answer = question.answer;
  if (!answer) return "";
  const templates: Record<string, string> = {
    "question-drink": `Dee’s favorite drink is ${answer}. ${question.icon}`,
    "question-food": `Dee’s favorite food is ${answer}. ${question.icon}`,
    "question-music": `Dee likes listening to ${answer}. ${question.icon}`,
    "question-movie": `A movie or series Dee loves is ${answer}. ${question.icon}`,
    "question-happy": `${answer} always makes Dee happy. ${question.icon}`,
    "question-travel": `Dee would love to travel to ${answer}. ${question.icon}`,
    "question-thinking": `Lately, Dee has been thinking about ${answer}. ${question.icon}`,
  };
  return templates[question.id] ?? `${question.question} ${answer}`;
}

export function DeesWorld() {
  const { snapshot, updateQuestion, updateCurrently } = useAppData();
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(snapshot.questions.map((item) => [item.id, item.answer ?? ""])),
  );
  const [savingQuestion, setSavingQuestion] = useState<string | null>(null);
  const [factIndex, setFactIndex] = useState(0);
  const [current, setCurrent] = useState({
    listening_to: snapshot.currently.listening_to ?? "",
    craving: snapshot.currently.craving ?? "",
    watching: snapshot.currently.watching ?? "",
    thinking_about: snapshot.currently.thinking_about ?? "",
  });
  const [savedNow, setSavedNow] = useState(false);
  const facts = useMemo(
    () => snapshot.questions.filter((item) => item.answer?.trim()).map(factFor),
    [snapshot.questions],
  );

  useEffect(() => {
    if (factIndex >= facts.length) setFactIndex(0);
  }, [factIndex, facts.length]);

  const saveQuestion = async (question: DeeQuestion) => {
    setSavingQuestion(question.id);
    try {
      await updateQuestion(question.id, answers[question.id] ?? "");
      setFactIndex(0);
    } finally {
      setSavingQuestion(null);
    }
  };

  const saveCurrently = async (event: FormEvent) => {
    event.preventDefault();
    setSavedNow(false);
    await updateCurrently({
      listening_to: current.listening_to.trim() || null,
      craving: current.craving.trim() || null,
      watching: current.watching.trim() || null,
      thinking_about: current.thinking_about.trim() || null,
    });
    setSavedNow(true);
  };

  return (
    <section className="content-wrap world-page">
      <header className="page-heading world-heading">
        <div className="world-heart">💗</div>
        <div>
          <p className="eyebrow">a personal corner</p>
          <h1 aria-label="Dee's World">Dee’s World</h1>
          <p>A few things about Dee.</p>
        </div>
      </header>

      <div className="world-layout">
        <div>
          <h2 className="section-title">A few little questions</h2>
          <p className="section-note">Answer any you like. Nothing here is required.</p>
          <div className="question-list">
            {snapshot.questions.map((question) => (
              <article className="question-card" key={question.id}>
                <Label htmlFor={question.id}><span>{question.icon}</span>{question.question}</Label>
                <div className="question-control">
                  <Textarea
                    id={question.id}
                    value={answers[question.id] ?? ""}
                    onChange={(event) => setAnswers((currentAnswers) => ({ ...currentAnswers, [question.id]: event.target.value }))}
                    placeholder="Type a little something…"
                  />
                  <Button
                    aria-label={`Save ${shortLabels[question.id] ?? "answer"}`}
                    onClick={() => void saveQuestion(question)}
                    disabled={savingQuestion === question.id}
                  >
                    {savingQuestion === question.id ? "Saving…" : "Save"}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="world-side">
          <section className="fact-card" aria-live="polite">
            <div className="fact-title"><Sparkles /> Random Dee Fact</div>
            {facts.length ? <p><strong>Did you know?</strong><br />{facts[factIndex] ?? facts[0]}</p> : <p>Answer any little question and a Dee fact will appear here. ✨</p>}
            <button onClick={() => setFactIndex((currentIndex) => facts.length > 1 ? (currentIndex + 1) % facts.length : 0)} disabled={facts.length === 0}>
              <RefreshCw /> Another one →
            </button>
          </section>

          <form className="currently-card" onSubmit={saveCurrently}>
            <div><p className="eyebrow">currently…</p><h2>A tiny life update</h2></div>
            <div className="currently-field"><Label htmlFor="listening">🎧 Listening to</Label><Input id="listening" value={current.listening_to} onChange={(event) => setCurrent({ ...current, listening_to: event.target.value })} placeholder="a song on repeat" /></div>
            <div className="currently-field"><Label htmlFor="craving">🍜 Craving</Label><Input id="craving" value={current.craving} onChange={(event) => setCurrent({ ...current, craving: event.target.value })} placeholder="something delicious" /></div>
            <div className="currently-field"><Label htmlFor="watching">🎬 Watching</Label><Input id="watching" value={current.watching} onChange={(event) => setCurrent({ ...current, watching: event.target.value })} placeholder="your current series" /></div>
            <div className="currently-field"><Label htmlFor="thinking">💭 Thinking about</Label><Input id="thinking" value={current.thinking_about} onChange={(event) => setCurrent({ ...current, thinking_about: event.target.value })} placeholder="whatever’s on your mind" /></div>
            <div className="currently-actions"><Button type="submit">Save Currently</Button>{savedNow && <span role="status">✓ Saved just now</span>}</div>
          </form>
        </aside>
      </div>
    </section>
  );
}
