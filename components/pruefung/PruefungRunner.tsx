"use client";
import { useEffect, useState, useSyncExternalStore, type CSSProperties } from "react";
import Link from "next/link";
import type { Aufgabe } from "@/content/schema";
import { SafeSvg } from "@/components/SafeSvg";
import { Wiederholung } from "@/components/session/Wiederholung";
import { appStorage } from "@/lib/lernSpeicher";
import { parseCloze } from "@/lib/cloze";
import { leseDezimalzahl } from "@/lib/zahlen";
import { formatiereZeit, getPruefungsteile, type Pruefungsteil } from "@/lib/pruefung";
import {
  answerFields, answerText, createExamAttempt, emptyExamAnswer, examProtocol, examTopics,
  finishExam, isExamAnswered, loadExam, loadExamHistory, saveExam, scoreExam,
  scoreExamQuestion, solutionText, TRAINING_GOAL, updateExamAnswer,
  type ExamAnswer, type ExamAttempt, type ExamQuestion,
} from "@/lib/exam";

const subscribeClient = () => () => {};
const panel: CSSProperties = { background: "var(--surface)", borderColor: "var(--border)" };
const primary: CSSProperties = { background: "var(--accent)", color: "var(--accent-text)" };
const muted: CSSProperties = { color: "var(--text-muted)" };
const buttonClass = "rounded-xl border px-4 py-3 font-medium disabled:opacity-40";

/** The client gate prevents a saved attempt from disagreeing with the server HTML. */
export function PruefungRunner() {
  const client = useSyncExternalStore(subscribeClient, () => true, () => false);
  return client ? <Pruefungsraum /> : <p role="status">Prüfungsraum wird geöffnet …</p>;
}

function Pruefungsraum() {
  const [initial] = useState(() => {
    try {
      const loaded = loadExam(appStorage, Date.now());
      return { ...loaded, history: loadExamHistory(appStorage) };
    } catch {
      return { attempt: null, history: [], warning: "Der Prüfungsstand konnte nicht geladen werden. Bitte den Lernspeicher prüfen." };
    }
  });
  const [attempt, setAttempt] = useState<ExamAttempt | null>(initial.attempt);
  const [history, setHistory] = useState<ExamAttempt[]>(initial.history);
  const [historyView, setHistoryView] = useState<ExamAttempt | null>(null);
  const [menu, setMenu] = useState(false);
  const [timed, setTimed] = useState(false);
  const [warning, setWarning] = useState(initial.warning);
  const [now, setNow] = useState(() => Date.now());
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [practice, setPractice] = useState<Aufgabe[] | null>(null);

  function commit(next: ExamAttempt) {
    setAttempt(next);
    try {
      saveExam(appStorage, next);
      if (next.submittedAt !== null) setHistory(loadExamHistory(appStorage));
      setWarning(null);
    } catch {
      setWarning("Die letzte Änderung konnte nicht gespeichert werden. Lass dieses Fenster geöffnet und sichere den Lernstand.");
    }
  }

  useEffect(() => {
    if (!attempt || attempt.submittedAt !== null) return;
    const timer = setInterval(() => {
      const time = Date.now();
      setNow(time);
      if (attempt.deadline !== null && time >= attempt.deadline) {
        const finished = finishExam(attempt, time);
        setAttempt(finished);
        try {
          saveExam(appStorage, finished);
          setHistory(loadExamHistory(appStorage));
        } catch {
          setWarning("Die Abgabe konnte nicht dauerhaft gespeichert werden. Bitte das Fenster geöffnet lassen und eine Sicherung erstellen.");
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [attempt]);

  function start(preset: Pruefungsteil, time: number) {
    try {
      commit(createExamAttempt(preset, timed, time));
      setNow(time);
      setMenu(false);
      setConfirmSubmit(false);
      setHistoryView(null);
    } catch (error) {
      setWarning(error instanceof Error ? error.message : "Das Training konnte nicht gestartet werden.");
    }
  }

  if (practice) return <Wiederholung aufgaben={practice} titel="Gezielte Nacharbeit" onFertig={() => setPractice(null)} />;

  const viewed = historyView ?? (!menu ? attempt : null);
  const alert = warning ? <p role="alert" className="mb-5 rounded-xl border p-4" style={{ borderColor: "var(--bad)", color: "var(--bad)" }}>{warning}</p> : null;

  if (viewed?.submittedAt !== null && viewed) {
    return <div>{alert}<ExamResult
      attempt={viewed}
      onMenu={() => { setHistoryView(null); setMenu(true); }}
      onPractice={(questions) => setPractice(questions.map((q) => q.task))}
      onReflection={historyView ? undefined : (reflection) => commit({ ...viewed, reflection })}
    /></div>;
  }

  if (!viewed) {
    const active = attempt && attempt.submittedAt === null;
    const presets = getPruefungsteile();
    return <div>
      <h1 className="text-3xl font-semibold tracking-tight">Prüfungsraum</h1>
      <p className="mt-3 max-w-prose" style={muted}>Übe in deinem Tempo oder mit Zeitlimit. Du kannst zurückgehen, Fragen überspringen und markieren. Lösungen und Punkte siehst du nach der Abgabe.</p>
      {alert}
      {active && <section className="my-5 rounded-2xl border p-5" style={panel} aria-label="Laufendes Training">
        <h2 className="text-lg font-semibold">Dein Training ist gespeichert</h2>
        <p className="mt-2" style={muted}>{attempt.preset.titel} · {attempt.questions.filter((q) => isExamAnswered(q, attempt.answers[q.task.id])).length} von {attempt.questions.length} beantwortet. {attempt.deadline !== null ? "Das Zeitlimit läuft weiter." : "Ohne Zeitdruck weiterlernen."}</p>
        <button className={`${buttonClass} mt-4`} style={primary} onClick={() => setMenu(false)}>Training fortsetzen</button>
      </section>}
      <label className="my-6 flex w-fit cursor-pointer items-center gap-3 rounded-xl border p-4" style={panel}>
        <input type="checkbox" className="h-5 w-5 accent-[var(--accent)]" checked={timed} onChange={(e) => setTimed(e.target.checked)} />
        Mit Zeitlimit trainieren <span style={muted}>(freiwillig)</span>
      </label>
      <h2 className="mt-8 text-xl font-semibold">LF7 · Dachentwässerung</h2>
      <p className="mt-2" style={muted}>Drei redaktionell zugeordnete Stufen. Trainingsziel: {TRAINING_GOAL} % der Punkte. Keine offizielle Bestehensregel.</p>
      <div className="mt-5 grid gap-4 lg:grid-cols-3">{presets.filter((p) => p.stufe).map((p) => <PresetCard key={p.id} preset={p} timed={timed} disabled={Boolean(active)} onStart={start} />)}</div>
      <h2 className="mt-9 text-xl font-semibold">Gemischtes Training</h2>
      <p className="mt-2" style={muted}>Der übrige Aufgabenbestand bleibt als lernfeldübergreifender Mix verfügbar.</p>
      <div className="mt-5 grid gap-4 lg:grid-cols-3">{presets.filter((p) => !p.stufe).map((p) => <PresetCard key={p.id} preset={p} timed={timed} disabled={Boolean(active)} onStart={start} />)}</div>
      {active && <p className="mt-3" style={muted}>Schließe zuerst dein laufendes Training ab, bevor du ein neues startest.</p>}
      <section className="mt-9" aria-labelledby="exam-history-title">
        <h2 id="exam-history-title" className="text-xl font-semibold">Deine bisherigen Trainings</h2>
        {history.length === 0 ? <p className="mt-3" style={muted}>Nach deiner ersten Abgabe findest du hier den vollständigen Verlauf.</p> : <ul className="mt-4 flex flex-col gap-3">{history.map((item) => {
          const score = scoreExam(item)!;
          return <li key={item.id}><button onClick={() => setHistoryView(item)} className="flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border p-4 text-left" style={panel}>
            <span><strong>{item.preset.titel}</strong><span className="mt-1 block" style={muted}>{new Date(item.submittedAt!).toLocaleString("de-DE")}</span></span>
            <span className="font-semibold">{score.percent.toFixed(0)} % · {score.earned}/{score.possible} Punkte <span aria-hidden="true">→</span></span>
          </button></li>;
        })}</ul>}
      </section>
    </div>;
  }

  const current = viewed.questions[viewed.index];
  const answer = viewed.answers[current.task.id] ?? emptyExamAnswer();
  const completed = viewed.questions.filter((q) => isExamAnswered(q, viewed.answers[q.task.id])).length;
  const remaining = viewed.questions.length - completed;
  const bookmarked = viewed.bookmarks.includes(current.task.id);
  const changeAnswer = (next: ExamAnswer) => commit(updateExamAnswer(viewed, current.task.id, { ...next, skipped: false }, Date.now()));
  const navigate = (index: number) => {
    if (viewed.deadline !== null && Date.now() >= viewed.deadline) commit(finishExam(viewed, Date.now()));
    else commit({ ...viewed, index });
    setConfirmSubmit(false);
  };

  return <div>
    {alert}
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="font-medium" style={muted}>{viewed.preset.titel}</p><h1 className="mt-1 text-2xl font-semibold">Aufgabe {viewed.index + 1} von {viewed.questions.length}</h1></div>
      {viewed.deadline !== null ? <span className="rounded-xl border px-4 py-2 font-semibold tabular-nums" style={{ ...panel, color: viewed.deadline - now < 300_000 ? "var(--bad)" : "var(--text)" }} aria-label="Verbleibende Zeit">{formatiereZeit((viewed.deadline - now) / 1000)}</span> : <span className="rounded-full px-3 py-2" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>Ohne Zeitlimit</span>}
    </div>
    <p className="mt-3" style={muted}>{completed} beantwortet · {remaining} offen · Antworten bleiben bis zur Abgabe veränderbar.</p>
    <div role="progressbar" aria-label="Beantwortete Aufgaben" aria-valuenow={completed} aria-valuemin={0} aria-valuemax={viewed.questions.length} className="my-4 h-2 overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}><div className="h-full" style={{ background: "var(--accent)", width: `${completed / viewed.questions.length * 100}%` }} /></div>
    <section className="mt-6 rounded-2xl border p-5 sm:p-7" style={panel} aria-label={`Aufgabe ${viewed.index + 1}`}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><span style={muted}>{current.task.thema} · {current.maxPoints} Punkte</span><button className="rounded-lg border px-3 py-2" aria-pressed={bookmarked} onClick={() => commit({ ...viewed, bookmarks: bookmarked ? viewed.bookmarks.filter((id) => id !== current.task.id) : [...viewed.bookmarks, current.task.id] })}>{bookmarked ? "★ Markiert" : "☆ Zum Wiedersehen markieren"}</button></div>
      <ExamAnswerEditor question={current} answer={answer} onChange={changeAnswer} />
    </section>
    <div className="mt-5 flex flex-wrap gap-3">
      <button className={buttonClass} style={panel} disabled={viewed.index === 0} onClick={() => navigate(viewed.index - 1)}>Zurück</button>
      <button className={buttonClass} style={primary} disabled={viewed.index === viewed.questions.length - 1} onClick={() => navigate(viewed.index + 1)}>Weiter</button>
      <button className={buttonClass} style={panel} onClick={() => {
        const next = updateExamAnswer(viewed, current.task.id, { ...answer, skipped: true }, Date.now());
        commit({ ...next, index: Math.min(viewed.index + 1, viewed.questions.length - 1) });
      }}>Überspringen</button>
    </div>
    <section className="mt-8" aria-labelledby="exam-overview-title">
      <h2 className="text-lg font-semibold" id="exam-overview-title">Fragenübersicht</h2>
      <p className="mt-2" style={muted}>✓ beantwortet · ↷ übersprungen · ★ markiert. Jede Nummer lässt sich direkt öffnen.</p>
      <div className="mt-4 flex flex-wrap gap-2">{viewed.questions.map((q, index) => {
        const answered = isExamAnswered(q, viewed.answers[q.task.id]);
        const skipped = viewed.answers[q.task.id]?.skipped;
        const marked = viewed.bookmarks.includes(q.task.id);
        return <button key={q.task.id} className="min-h-12 min-w-14 rounded-lg border px-3 py-2 font-medium" style={index === viewed.index ? primary : panel} aria-current={index === viewed.index ? "step" : undefined} aria-label={`Frage ${index + 1}, ${answered ? "beantwortet" : skipped ? "übersprungen" : "offen"}${marked ? ", markiert" : ""}`} onClick={() => navigate(index)}>{index + 1}{answered ? " ✓" : skipped ? " ↷" : ""}{marked ? " ★" : ""}</button>;
      })}</div>
    </section>
    <div className="mt-8 flex flex-wrap gap-3">
      <button className={buttonClass} style={primary} onClick={() => remaining ? setConfirmSubmit(true) : commit(finishExam(viewed, Date.now()))}>Training abgeben</button>
      <button className={buttonClass} style={panel} onClick={() => setMenu(true)}>Speichern und zur Auswahl</button>
    </div>
    {confirmSubmit && <div role="alert" className="mt-4 rounded-xl border p-5" style={panel}><p>{remaining} Aufgabe{remaining === 1 ? " ist" : "n sind"} noch offen. Offene Antworten ergeben null Punkte. Möchtest du jetzt abgeben?</p><div className="mt-4 flex flex-wrap gap-3"><button className={buttonClass} style={primary} onClick={() => { commit(finishExam(viewed, Date.now())); setConfirmSubmit(false); }}>Trotzdem abgeben</button><button className={buttonClass} style={panel} onClick={() => setConfirmSubmit(false)}>Weiter bearbeiten</button></div></div>}
  </div>;
}

function PresetCard({ preset, timed, disabled, onStart }: { preset: Pruefungsteil; timed: boolean; disabled: boolean; onStart: (preset: Pruefungsteil, time: number) => void }) {
  return <article className="flex flex-col rounded-2xl border p-5" style={panel}><h3 className="text-xl font-semibold">{preset.titel}</h3><p className="mt-2 font-medium" style={{ color: "var(--accent)" }}>{preset.anzahl} Aufgaben · {timed ? `${preset.minuten} Minuten` : "ohne Zeitlimit"}</p><p className="mb-5 mt-3 flex-1" style={muted}>{preset.beschreibung}</p><button className={buttonClass} style={primary} disabled={disabled} onClick={() => onStart(preset, Date.now())}>{preset.titel} starten</button></article>;
}

/** Controlled inputs: navigating never remounts or randomizes the answers. No explanations are rendered here. */
export function ExamAnswerEditor({ question, answer, onChange }: { question: ExamQuestion; answer: ExamAnswer; onChange: (answer: ExamAnswer) => void }) {
  const task = question.task;
  const field = (key: string, label: string, unit?: string) => {
    const value = answer.fields[key] ?? "";
    const invalid = task.typ === "calc" && Boolean(value.trim()) && leseDezimalzahl(value) === null;
    return <label key={key} className="flex flex-col gap-2"><span className="font-medium">{label}{unit ? ` (${unit})` : ""}</span><input aria-label={label} autoComplete="off" inputMode={task.typ === "calc" ? "decimal" : "text"} type="text" value={value} onChange={(e) => onChange({ ...answer, fields: { ...answer.fields, [key]: e.target.value } })} aria-invalid={invalid || undefined} className="min-h-12 rounded-xl border px-3 py-2" style={panel} />{invalid && <span role="alert" style={{ color: "var(--bad)" }}>Gib eine Zahl ein, zum Beispiel 12,5. Einheiten stehen am Eingabefeld.</span>}</label>;
  };
  if (task.typ === "mc") return <fieldset><legend className="text-lg font-medium leading-relaxed">{question.prompt}</legend><p className="mb-4 mt-2" style={muted}>Eine oder mehrere Antworten sind richtig. Richtige Kreuze geben Teilpunkte; falsche Kreuze ziehen Teilpunkte dieser Aufgabe ab. Weniger als null Punkte sind ausgeschlossen.</p><div className="flex flex-col gap-3">{task.optionen.map((option, index) => <label key={index} className="flex cursor-pointer items-start gap-3 rounded-xl border p-4" style={panel}><input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-[var(--accent)]" checked={answer.choices.includes(index)} onChange={(e) => onChange({ ...answer, choices: e.target.checked ? [...answer.choices, index] : answer.choices.filter((n) => n !== index) })} /><span>{option}</span></label>)}</div></fieldset>;
  if (task.typ === "cloze") return <div><p className="text-lg leading-loose">{parseCloze(task.text).map((part, i) => part.type === "text" ? <span key={i}>{part.value}</span> : <span key={i} className="mx-1 inline-block rounded px-2 font-semibold" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>[Lücke {part.index + 1}]</span>)}</p><p className="my-4" style={muted}>Jede richtige Lücke zählt anteilig.</p><div className="grid gap-4 sm:grid-cols-2">{answerFields(question).map((f) => field(f.key, f.label))}</div></div>;
  if (task.typ === "diagram") return <div><p className="text-lg font-medium">{question.prompt}</p><SafeSvg markup={task.svg.replace(/aria-label=(['"])[\s\S]*?\1/g, 'aria-label="Skizze mit nummerierten Bauteilen"')} className="my-5 flex justify-center rounded-xl border p-4" /><p className="my-4" style={muted}>Trage die Bezeichnungen zu den nummerierten Punkten ein. Jede richtige Zuordnung zählt anteilig.</p><div className="grid gap-4 sm:grid-cols-2">{answerFields(question).map((f) => field(f.key, f.label))}</div></div>;
  return <div><p className="text-lg font-medium leading-relaxed">{question.prompt}</p><p className="my-4" style={muted}>Gib das Endergebnis als Zahl ein. Erlaubte Abweichung: {task.toleranzProzent} %. Der Rechenweg erscheint nach der Abgabe.</p>{answerFields(question).map((f) => field(f.key, f.label, f.unit))}</div>;
}

function ExamResult({ attempt, onMenu, onPractice, onReflection }: { attempt: ExamAttempt; onMenu: () => void; onPractice: (questions: ExamQuestion[]) => void; onReflection?: (text: string) => void }) {
  const score = scoreExam(attempt)!;
  const topics = examTopics(attempt);
  const missed = attempt.questions.filter((q) => scoreExamQuestion(q, attempt.answers[q.task.id]) < q.maxPoints);
  return <div>
    <p className="font-medium" style={muted}>{attempt.preset.titel} · {new Date(attempt.submittedAt!).toLocaleString("de-DE")}</p>
    <h1 className="mt-2 text-3xl font-semibold">Deine Auswertung</h1>
    <section className="mt-5 rounded-2xl border p-6" style={panel}>
      <p className="text-4xl font-semibold" style={{ color: score.goalReached ? "var(--ok)" : "var(--accent)" }}>{score.percent.toFixed(0)} %</p>
      <p className="mt-3 text-lg font-medium">{score.earned} von {score.possible} Punkten · {score.lost} Fehlerpunkte</p>
      <p className="mt-2">{score.goalReached ? "Trainingsziel erreicht." : "Dein nächstes Ziel: gezielt nacharbeiten und erneut üben."}</p>
      <p className="mt-2" style={muted}>Trainingsziel {TRAINING_GOAL} %. Fehlerpunkte = mögliche Punkte − erreichte Punkte. Das ist keine offizielle Bestehensregel.</p>
    </section>
    <section className="mt-7" aria-labelledby="exam-next-title"><h2 id="exam-next-title" className="text-xl font-semibold">Deine nächsten Übungen</h2>{missed.length === 0 ? <p className="mt-3" style={muted}>Alle Aufgaben vollständig gelöst. Wiederhole die Inhalte in einigen Tagen oder wähle eine andere Stufe.</p> : <div className="mt-4 grid gap-3 sm:grid-cols-2">{topics.filter((t) => t.taskIds.length).map((topic) => <div key={`${topic.lernfeld}/${topic.thema}`} className="rounded-xl border p-4" style={panel}><h3 className="font-semibold">{topic.thema}</h3><p className="my-2" style={muted}>{topic.earned}/{topic.possible} Punkte · {topic.taskIds.length} Aufgabe{topic.taskIds.length === 1 ? "" : "n"} nacharbeiten</p><button className="font-semibold underline underline-offset-4" style={{ color: "var(--accent)" }} onClick={() => onPractice(attempt.questions.filter((q) => topic.taskIds.includes(q.task.id)))}>Dieses Thema üben →</button></div>)}</div>}</section>
    <section className="mt-8" aria-labelledby="exam-review-title"><h2 id="exam-review-title" className="text-xl font-semibold">Antworten und Lösungen</h2><div className="mt-4 flex flex-col gap-3">{attempt.questions.map((q, index) => <details key={q.task.id} className="rounded-xl border p-4" style={panel}><summary className="cursor-pointer font-medium">{index + 1}. {q.task.thema} · {scoreExamQuestion(q, attempt.answers[q.task.id])}/{q.maxPoints} Punkte</summary><div className="mt-4 space-y-3 leading-relaxed"><p className="font-medium">{q.prompt}</p><p><strong>Deine Antwort:</strong> {answerText(q, attempt.answers[q.task.id])}</p><p className="whitespace-pre-line"><strong>Lösung:</strong> {solutionText(q)}</p><p>{q.task.erklaerung}</p><p style={muted}>Quelle: {q.task.quelle} · Inhaltsversion {q.taskVersion}</p></div></details>)}</div></section>
    <section className="mt-8 rounded-2xl border p-5" style={panel}><h2 className="text-xl font-semibold">Eigene Begründung und Zeichnung</h2><p className="my-3" style={muted}>Was konntest du sicher erklären? Wo fehlt dir noch ein Rechenweg oder eine Skizze? Diese Selbsteinschätzung wird getrennt gespeichert und verändert deine automatisch bewerteten Punkte nicht.</p><label className="flex flex-col gap-2"><span className="font-medium">Meine Selbsteinschätzung (ohne Punkte)</span><textarea className="min-h-32 rounded-xl border p-3" style={panel} value={attempt.reflection} readOnly={!onReflection} onChange={(e) => onReflection?.(e.target.value)} /></label><Link className="mt-4 inline-block font-semibold underline underline-offset-4" style={{ color: "var(--accent)" }} href="/zeichnen">Zeichnung mit Vergleichskriterien üben →</Link></section>
    <div className="mt-7 flex flex-wrap gap-3">{missed.length > 0 && <button className={buttonClass} style={primary} onClick={() => onPractice(missed)}>Alle {missed.length} offenen Aufgaben üben</button>}<button className={buttonClass} style={panel} onClick={() => {
      const url = URL.createObjectURL(new Blob([examProtocol(attempt)], { type: "text/plain;charset=utf-8" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `training-${attempt.preset.id}-${new Date(attempt.submittedAt!).toISOString().slice(0, 10)}.txt`;
      anchor.click();
      URL.revokeObjectURL(url);
    }}>Protokoll sichern</button><button className={buttonClass} style={panel} onClick={onMenu}>Zur Trainingsauswahl</button></div>
  </div>;
}
