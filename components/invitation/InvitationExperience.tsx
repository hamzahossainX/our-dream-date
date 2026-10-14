"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, Heart, Mail, Moon, Sparkles, Sun, X } from "lucide-react";
import { DEFAULT_CONFIG } from "@/lib/defaults";
import type { Answer, InvitationConfig, InvitationPayload, SavedResponse, SubmissionInput } from "@/lib/contracts";
import "./invitation.css";
import { RunawayNoButton } from "./RunawayNoButton";
import { DEMO_RECEIPT_KEY, demoReplyText, readDemoReceipt, saveDemoReceipt } from "@/lib/browser-demo";

type Step = "welcome" | "date" | "preferences" | "note" | "review" | "saved";
const PREVIEW: InvitationPayload = { config: DEFAULT_CONFIG, configured: false, authorized: false, response: null };

function zonedToday(timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const part = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
function dateLabel(date: string | null) {
  if (!date) return "Choose a day";
  return new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date(`${date}T12:00:00`));
}
function dateKey(year: number, month: number, day: number) {
  const date = new Date(year, month, day, 12);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function LetterIllustration() {
  return <div className="invite-envelope" aria-hidden="true">
    <svg viewBox="0 0 420 340" className="invite-envelope-svg">
      <defs><filter id="letter-shadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="9" stdDeviation="10" floodColor="currentColor" floodOpacity=".1" /></filter></defs>
      <g className="invite-envelope-back"><path d="M60 166 210 53l150 113v131H60Z" fill="var(--invite-envelope-deep)"/><path d="m60 166 150 104 150-104" fill="none" stroke="var(--invite-line)"/></g>
      <g className="invite-letter" filter="url(#letter-shadow)"><rect x="94" y="67" width="232" height="206" rx="4" fill="var(--invite-paper)"/><path d="M114 86h192v166H114Z" fill="none" stroke="var(--invite-line)"/><text x="210" y="122" textAnchor="middle" className="invite-svg-small">A LITTLE NOTE</text><text x="210" y="163" textAnchor="middle" className="invite-svg-script">for my favourite person</text><path d="M155 187h110m-97 14h84" stroke="var(--invite-line)" strokeWidth="2"/><path d="M210 226c-23-15-20-31-9-31 5 0 9 4 9 7 1-3 5-7 10-7 11 0 14 16-10 31Z" fill="var(--invite-rose-soft)"/></g>
      <path d="M60 167 210 259 360 167v130a8 8 0 0 1-8 8H68a8 8 0 0 1-8-8Z" fill="var(--invite-envelope-light)"/>
      <path d="m60 297 150-98 150 98" fill="var(--invite-envelope-front)" stroke="var(--invite-line)" strokeWidth=".8"/>
      <circle cx="210" cy="249" r="23" fill="var(--invite-accent)"/><circle cx="210" cy="249" r="18" fill="none" stroke="var(--invite-seal-line)"/><path d="M210 258c-15-10-13-20-6-20 3 0 6 2 6 5 1-3 3-5 7-5 7 0 9 10-7 20Z" fill="var(--invite-paper)"/>
      <g className="invite-flower" fill="var(--invite-flower-petal)" stroke="var(--invite-rose-muted)" strokeWidth="1"><ellipse cx="52" cy="221" rx="11" ry="22" transform="rotate(-25 52 221)"/><ellipse cx="70" cy="235" rx="11" ry="22" transform="rotate(45 70 235)"/><ellipse cx="47" cy="248" rx="11" ry="22" transform="rotate(85 47 248)"/><ellipse cx="35" cy="232" rx="11" ry="22" transform="rotate(-70 35 232)"/><circle cx="51" cy="235" r="7" fill="var(--invite-paper)"/></g>
      <g stroke="var(--invite-leaf)" strokeWidth="2" fill="none"><path d="m52 259-8 56M46 285q-28-8-17-20 19-4 17 20Zm-2 19q26-9 16-24-18 4-16 24Z"/></g>
      <g transform="translate(351 102) rotate(25)" fill="var(--invite-flower-petal)" stroke="var(--invite-rose-muted)"><ellipse cy="-12" rx="7" ry="14"/><ellipse cy="12" rx="7" ry="14"/><ellipse cx="12" rx="14" ry="7"/><ellipse cx="-12" rx="14" ry="7"/><circle r="5" fill="var(--invite-paper)"/></g>
      <path d="m350 128 21 44m-12-25q21-8 21 5-12 9-21-5Z" stroke="var(--invite-leaf)" fill="none" strokeWidth="2"/>
    </svg>
    <span className="invite-floating-heart invite-heart-one">♡</span><span className="invite-floating-heart invite-heart-two">✧</span><span className="invite-envelope-caption">sealed with a little love</span>
  </div>;
}

function Calendar({ config, value, onChange }: { config: InvitationConfig; value: string; onChange: (value: string) => void }) {
  const today = zonedToday(config.timezone);
  const minimum = config.minDate && config.minDate > today ? config.minDate : today;
  const [month, setMonth] = useState(() => new Date(`${value || minimum}T12:00:00`));
  const year = month.getFullYear();
  const monthNumber = month.getMonth();
  const count = new Date(year, monthNumber + 1, 0).getDate();
  const offset = new Date(year, monthNumber, 1).getDay();
  const moveMonth = (amount: number) => setMonth(new Date(year, monthNumber + amount, 1, 12));
  return <div className="invite-calendar">
    <div className="invite-calendar-heading"><h3>{month.toLocaleDateString("en", { month: "long", year: "numeric" })}</h3><div><button type="button" aria-label="Previous month" disabled={new Date(year, monthNumber, 0, 12) < new Date(`${minimum}T12:00:00`)} onClick={() => moveMonth(-1)}><ChevronLeft size={18}/></button><button type="button" aria-label="Next month" disabled={Boolean(config.maxDate && dateKey(year, monthNumber + 1, 1) > config.maxDate)} onClick={() => moveMonth(1)}><ChevronRight size={18}/></button></div></div>
    <div className="invite-calendar-grid" role="group" aria-label="Choose your invitation date">
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day} className="invite-weekday">{day}</span>)}
      {Array.from({ length: offset }, (_, index) => <span key={`blank-${index}`} className="invite-day-blank" />)}
      {Array.from({ length: count }, (_, index) => {
        const day = index + 1; const key = dateKey(year, monthNumber, day); const disabled = key < minimum || Boolean(config.maxDate && key > config.maxDate);
        return <button key={key} type="button" aria-label={dateLabel(key)} aria-pressed={value === key} disabled={disabled} className={`${value === key ? "invite-day-selected" : ""} ${key === today ? "invite-day-today" : ""}`} onClick={() => onChange(key)}>{day}</button>;
      })}
    </div>
    <label className="invite-date-native">Or choose a date directly<input type="date" value={value} min={minimum} max={config.maxDate || undefined} onChange={(e) => { onChange(e.target.value); if (e.target.value) setMonth(new Date(`${e.target.value}T12:00:00`)); }}/></label>
  </div>;
}

export function InvitationExperience({ initialPayload, token, demo = false }: { initialPayload?: InvitationPayload; token?: string; demo?: boolean }) {
  const [payload, setPayload] = useState(initialPayload || PREVIEW);
  const [loading, setLoading] = useState(!initialPayload);
  const [openingFailed, setOpeningFailed] = useState(false);
  const [step, setStep] = useState<Step>(initialPayload?.response ? "saved" : "welcome");
  const [answer, setAnswer] = useState<Answer>("yes");
  const [chosenDate, setChosenDate] = useState("");
  const [timeSlotId, setTimeSlotId] = useState("");
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [receipt, setReceipt] = useState<SavedResponse | null>(initialPayload?.response || null);
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
  const initialRequest = useRef<Promise<InvitationPayload> | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const config = payload.config;
  const messageMaxLength = config.messageMaxLength;
  const questions = config.questions.filter((question) => question.appliesTo === "both" || question.appliesTo === answer);
  const canSave = (demo || (payload.configured && payload.authorized)) && Boolean(idempotencyKey);

  async function getInvitation() {
    const response = await fetch("/api/invitation", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Your invitation couldn't be opened. Please try again.");
    setIdempotencyKey(response.headers.get("X-Idempotency-Key"));
    return result as InvitationPayload;
  }

  useEffect(() => {
    let active = true;
    if (!initialRequest.current) initialRequest.current = (async () => {
      if (demo) {
        setIdempotencyKey(crypto.randomUUID());
        let response: SavedResponse | null = null;
        try { response = readDemoReceipt(window.localStorage); }
        catch { setError("Browser storage is unavailable. Enable it to save a demo reply."); }
        return { ...PREVIEW, response };
      }
      const privateToken = new URLSearchParams(window.location.hash.slice(1)).get("invite") || token;
      if (privateToken) {
        window.history.replaceState({}, "", "/");
        const response = await fetch("/api/invitation/open", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: privateToken }) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "This invitation link is no longer available. Ask Fahim for a new one.");
      }
      return getInvitation();
    })();
    initialRequest.current.then((result) => { if (active) { setPayload(result); setReceipt(result.response); if (result.response) setStep("saved"); } }).catch((err: unknown) => { if (active) { setOpeningFailed(true); setError(err instanceof Error ? err.message : "Your invitation couldn't be opened."); } }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token, demo]);

  useEffect(() => { if (step !== "welcome") headingRef.current?.focus({ preventScroll: true }); }, [step]);

  function go(next: Step) { setError(""); setStep(next); }
  function chooseAnswer(value: Answer) { setAnswer(value); go(value === "yes" ? "date" : config.questions.some((question) => question.appliesTo === "no" || question.appliesTo === "both") ? "preferences" : "note"); }
  function validateDate() {
    const today = zonedToday(config.timezone);
    if (!chosenDate || chosenDate < today || (config.minDate && chosenDate < config.minDate) || (config.maxDate && chosenDate > config.maxDate)) return "Choose an available day for our date.";
    const slot = config.timeSlots.find((slot) => slot.id === timeSlotId);
    if (!slot) return "Pick a time that feels right for you.";
    if (chosenDate === today && slot.time <= new Intl.DateTimeFormat("en-GB", { timeZone: config.timezone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date())) return "That time has passed today. Choose a later time or another lovely day.";
    return "";
  }
  function validatePreferences() {
    for (const question of questions) {
      const selected = selections[question.id] || [];
      const minimum = question.required ? Math.max(1, question.minSelections) : selected.length ? question.minSelections : 0;
      if (selected.length < minimum) return `Please choose ${minimum === 1 ? "an option" : `at least ${minimum} options`} for “${question.label}”.`;
      if (selected.length > question.maxSelections) return `Choose up to ${question.maxSelections} options for “${question.label}”.`;
      if (selected.some((id) => !question.options.some((option) => option.id === id))) return "Our choices have changed. Please pick your favourites again.";
    }
    return "";
  }
  function nextFromDate() { const problem = validateDate(); if (problem) setError(problem); else go(questions.length ? "preferences" : "note"); }
  function nextFromPreferences() { const problem = validatePreferences(); if (problem) setError(problem); else go("note"); }
  function selectOption(questionId: string, optionId: string, mode: "single" | "multiple", maximum: number) {
    const current = selections[questionId] || [];
    let next: string[];
    if (mode === "single") next = [optionId];
    else if (current.includes(optionId)) next = current.filter((id) => id !== optionId);
    else if (current.length >= maximum) { setError(`You can choose up to ${maximum} favourites here.`); return; }
    else next = [...current, optionId];
    setError(""); setSelections((previous) => ({ ...previous, [questionId]: next }));
  }
  async function submit() {
    if (!canSave || saving) return;
    const problem = (answer === "yes" ? validateDate() : "") || validatePreferences() || (message.length > messageMaxLength ? `Keep your note within ${messageMaxLength} characters.` : "");
    if (problem) { setError(problem); return; }
    setSaving(true); setError("");
    const input: SubmissionInput = { answer, chosenDate: answer === "yes" ? chosenDate : null, timeSlotId: answer === "yes" ? timeSlotId : null, selections: Object.fromEntries(questions.map((question) => [question.id, selections[question.id] || []])), message, configVersion: config.version, idempotencyKey: idempotencyKey! };
    try {
      if (demo) {
        const saved = saveDemoReceipt(window.localStorage, input, config);
        setReceipt(saved); setStep("saved"); return;
      }
      const response = await fetch("/api/responses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
      const result = await response.json();
      if (!response.ok) {
        if (result.code === "ALREADY_SUBMITTED") {
          const updated = await getInvitation();
          if (updated.response) { setPayload(updated); setReceipt(updated.response); setStep("saved"); window.history.replaceState({}, "", "/confirmation"); return; }
        }
        if (result.code === "CONFIG_CHANGED" || result.code === "STALE_CONFIG" || result.code === "stale_config") {
          const updated = await getInvitation(); setPayload(updated);
          setSelections((previous) => Object.fromEntries(updated.config.questions.map((question) => [question.id, (previous[question.id] || []).filter((id) => question.options.some((option) => option.id === id)).slice(0, question.maxSelections)])));
          if (!updated.config.timeSlots.some((slot) => slot.id === timeSlotId)) setTimeSlotId("");
          setError("Fahim updated a few details. Your choices are still here — please review them before sending."); setStep("review");
          return;
        }
        throw new Error(result.error || "Your reply couldn't be saved. Your choices are still here; please try again.");
      }
      if (!result.response?.id) throw new Error("We couldn't verify that your reply was saved. Please try again.");
      setReceipt(result.response); setStep("saved"); window.history.replaceState({}, "", "/confirmation");
    } catch (err) { setError(err instanceof Error ? err.message : "Your reply couldn't be sent. Please try again."); }
    finally { setSaving(false); }
  }

  function downloadReply() {
    if (!receipt) return;
    const url = URL.createObjectURL(new Blob([demoReplyText(receipt)], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "our-dream-date-reply.txt";
    anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function resetDemo() {
    try { window.localStorage.removeItem(DEMO_RECEIPT_KEY); setReceipt(null); setChosenDate(""); setTimeSlotId(""); setSelections({}); setMessage(""); setIdempotencyKey(crypto.randomUUID()); go("welcome"); }
    catch { setError("Your browser couldn't clear this demo reply. Check its storage settings."); }
  }
  const chosenTime = config.timeSlots.find((slot) => slot.id === timeSlotId);
  const isFlow = step !== "welcome" && step !== "saved";
  const steps = answer === "yes" ? ["The day", ...(questions.length ? ["The little things"] : []), "Your note", "All set"] : [...(questions.length ? ["The little things"] : []), "Your note", "All set"];
  const currentStepIndex = step === "date" ? 0 : step === "preferences" ? answer === "yes" ? 1 : 0 : step === "note" ? steps.length - 2 : steps.length - 1;
  const back = () => { if (step === "date") go("welcome"); else if (step === "preferences") go(answer === "yes" ? "date" : "welcome"); else if (step === "note") go(questions.length ? "preferences" : answer === "yes" ? "date" : "welcome"); else go("note"); };

  return <main className={`invite-root invite-accent-${config.accent}`}>
    <div className="invite-background-flower invite-background-flower-left" aria-hidden="true">✳</div><div className="invite-background-flower invite-background-flower-right" aria-hidden="true">✳</div>
    <header className="invite-header"><Link className="invite-wordmark" href={demo ? "/demo" : "/"} aria-label="Our little date, home"><span className="invite-brand-icon"><Heart size={17}/></span>our little date<span className="invite-brand-dot">.</span></Link><span className="invite-header-note">a little something, just for you <Heart size={12}/></span></header>
    <div className="invite-content">
      {!openingFailed && !loading && !payload.configured && !demo && <div className="invite-preview-notice"><span className="invite-status-dot"/>Design preview · responses aren’t saved</div>}
      {loading && <p className="invite-loading" role="status"><Mail size={16}/> Opening your little invitation…</p>}
      {!openingFailed && !loading && payload.configured && !payload.authorized && !receipt && <div className="invite-access-notice"><Mail size={17}/><span>Open your personal invitation link from Fahim to send your reply.</span></div>}
      {openingFailed && <section className="invite-confirmation invite-opening-failure"><span className="invite-section-icon"><Mail size={22}/></span><span className="invite-eyebrow">YOUR PERSONAL INVITATION</span><h1>We couldn’t open this invitation.</h1><p className="invite-confirmation-copy" role="alert">{error}</p><p className="invite-no-pressure">Please try again, or ask Fahim for a fresh personal invitation link.</p></section>}
      {!openingFailed && step === "welcome" && <section className="invite-welcome invite-animate-in">
        <div className="invite-hero-copy"><span className="invite-eyebrow"><span/> A DATE WITH YOUR FAVOURITE PERSON</span><h1 ref={headingRef} tabIndex={-1}>{config.title.split("\n").map((line, index) => <span key={index}>{line}</span>)}</h1><p className="invite-subtitle">{config.subtitle}</p><div className="invite-tiny-rule"><span/><Heart size={13}/><span/></div><div className="invite-personal-note"><span className="invite-handwriting">Dear {config.recipientName},</span><p>{config.openingNote}</p><span className="invite-signature">Always yours, <span>{config.senderName}</span><Heart size={13}/></span></div><h2 className="invite-question">Will you go on a date with me?</h2><div className="invite-answer-buttons"><button className="invite-button invite-primary" onClick={() => chooseAnswer("yes")}>Yes, a thousand times <Heart size={16}/></button><RunawayNoButton onChoose={() => chooseAnswer("no")} /></div><p className="invite-no-pressure">No pressure. Just a little invitation, from my heart to yours.</p></div>
        <div className="invite-hero-art"><span className="invite-art-note">Something lovely<br/>starts with a yes.</span><LetterIllustration/><div className="invite-art-footer"><span className="invite-art-sparkle">✧</span><span>one date. a million little memories.</span><span className="invite-art-sparkle">✧</span></div></div>
      </section>}
      {!openingFailed && isFlow && <section className="invite-flow invite-animate-in" aria-label="Your invitation reply">
        <button className="invite-back" onClick={back} disabled={saving}><ArrowLeft size={16}/> Back</button>
        <div className="invite-stepper" aria-label="Invitation progress">{steps.map((label, index) => { const currentIndex = currentStepIndex; return <div key={label} className={`invite-step-item ${index === currentIndex ? "invite-step-current" : ""} ${index < currentIndex ? "invite-step-complete" : ""}`} aria-current={index === currentIndex ? "step" : undefined}><span>{index < currentIndex ? <Check size={12}/> : index + 1}</span><small>{label}</small></div>; })}</div>
        <div className="invite-flow-card">
          {step === "date" && <><div className="invite-step-heading"><span className="invite-section-icon"><CalendarDays size={21}/></span><span className="invite-eyebrow">LET’S MAKE A LITTLE TIME FOR US</span><h1 ref={headingRef} tabIndex={-1}>First, pick our day.</h1><p>A moment to look forward to. A little space for just us.</p></div><div className="invite-date-layout"><Calendar config={config} value={chosenDate} onChange={(value) => { setChosenDate(value); setError(""); }}/><div className="invite-time-options"><h3>And the perfect time?</h3><p>All times in {config.timezone.replaceAll("_", " ")}.</p>{config.timeSlots.map((slot, index) => { const Icon = index === 0 ? Sun : index === 1 ? Sparkles : Moon; const passed = chosenDate === zonedToday(config.timezone) && slot.time <= new Intl.DateTimeFormat("en-GB", { timeZone: config.timezone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date()); return <button key={slot.id} type="button" disabled={passed} aria-label={passed ? `${slot.label}, already passed today` : undefined} className={`invite-time-option ${timeSlotId === slot.id ? "invite-selected" : ""}`} aria-pressed={timeSlotId === slot.id} onClick={() => { setTimeSlotId(slot.id); setError(""); }}><span className="invite-option-icon"><Icon size={20}/></span><span><strong>{slot.label}</strong><small>{slot.time}{passed ? " · passed today" : ""}</small></span><span className="invite-select-circle">{timeSlotId === slot.id && <Check size={12}/>}</span></button>; })}<div className="invite-date-note"><Heart size={15}/><span>{chosenDate ? dateLabel(chosenDate) : "A day with you is always a good day."}</span></div></div></div><div className="invite-action-row"><span>Something to circle on our calendar ♡</span><button className="invite-button invite-primary" onClick={nextFromDate}>The little things <ArrowRight size={17}/></button></div></>}
          {step === "preferences" && <><div className="invite-step-heading"><span className="invite-section-icon"><Sparkles size={21}/></span><span className="invite-eyebrow">THE PLAN IS BETTER WITH YOU IN IT</span><h1 ref={headingRef} tabIndex={-1}>Your kind of lovely.</h1><p>Big plans or little moments. Let’s make this feel like us.</p></div>{questions.map((question) => <fieldset key={question.id} className="invite-question-group"><legend>{question.label}<span>{question.required ? "Required" : "Optional"}</span></legend>{question.description && <p>{question.description}</p>}<div className="invite-choice-grid" role={question.selectionMode === "single" ? "radiogroup" : "group"} aria-label={question.label}>{question.options.map((option) => { const selected = (selections[question.id] || []).includes(option.id); return <button key={option.id} type="button" role={question.selectionMode === "single" ? "radio" : "checkbox"} aria-checked={selected} className={`invite-choice ${selected ? "invite-selected" : ""}`} onKeyDown={(event) => { if (question.selectionMode === "single" && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) { event.preventDefault(); const options = Array.from(event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("[role=radio]") || []); const index = options.indexOf(event.currentTarget); const next = options[(index + (event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1) + options.length) % options.length]; next?.focus(); next?.click(); } }} onClick={() => selectOption(question.id, option.id, question.selectionMode, question.maxSelections)}><span className="invite-choice-emoji" aria-hidden="true">{option.emoji}</span><span className="invite-select-circle">{selected && <Check size={12}/>}</span><strong>{option.label}</strong>{option.description && <small>{option.description}</small>}</button>; })}</div>{!question.required && (selections[question.id] || []).length > 0 && <button type="button" className="invite-clear-selection" onClick={() => { setSelections((previous) => ({ ...previous, [question.id]: [] })); setError(""); }}>Clear my choice</button>}<p className="invite-selection-guidance">{question.selectionMode === "single" ? "Choose one favourite." : `Choose ${question.minSelections || (question.required ? 1 : 0)}–${question.maxSelections} favourites.`}</p></fieldset>)}<div className="invite-action-row"><span>The company is already my favourite part.</span><button className="invite-button invite-primary" onClick={nextFromPreferences}>Add a little note <ArrowRight size={17}/></button></div></>}
          {step === "note" && <><div className="invite-step-heading"><span className="invite-section-icon"><Mail size={21}/></span><span className="invite-eyebrow">A FEW WORDS, IF YOU LIKE</span><h1 ref={headingRef} tabIndex={-1}>{answer === "yes" ? "A little note for me?" : "Another day is lovely, too."}</h1><p>{answer === "yes" ? "A wish, a hint, or simply a hello. I’ll love reading it." : "Take your time, my love. You can leave a note, or simply send your answer."}</p></div><div className="invite-message-paper"><label htmlFor="invite-message">Dear {config.senderName}, <span>(optional)</span></label><textarea id="invite-message" disabled={messageMaxLength === 0} value={message} maxLength={messageMaxLength} onChange={(event) => setMessage(event.target.value)} placeholder={answer === "yes" ? "I’m looking forward to…" : "Maybe we could…"} rows={6}/><div className="invite-message-footer"><span>With love, {config.recipientName}</span><small>{message.length} / {messageMaxLength}</small></div></div><div className="invite-action-row"><span>You can leave this page blank.</span><button className="invite-button invite-primary" onClick={() => go("review")}>Review my reply <ArrowRight size={17}/></button></div></>}
          {step === "review" && <><div className="invite-step-heading"><span className="invite-section-icon"><Heart size={21}/></span><span className="invite-eyebrow">ONE LAST LITTLE LOOK</span><h1 ref={headingRef} tabIndex={-1}>{answer === "yes" ? "Our date, our way." : "A little rain check."}</h1><p>{answer === "yes" ? "Here’s what we have to look forward to." : "Your answer is yours to choose. Let’s send it with love."}</p></div><div className="invite-review"><div className="invite-review-line"><span><Heart size={17}/>Your answer</span><strong>{answer === "yes" ? "Yes, let’s make a memory." : "No, maybe another time."}</strong><button onClick={() => go("welcome")} aria-label="Edit your answer">Edit</button></div>{answer === "yes" && <><div className="invite-review-line"><span><CalendarDays size={17}/>Our day</span><strong>{dateLabel(chosenDate)}</strong><button onClick={() => go("date")} aria-label="Edit invitation date">Edit</button></div><div className="invite-review-line"><span><Clock3 size={17}/>Our time</span><strong>{chosenTime ? `${chosenTime.time} · ${chosenTime.label}` : "Choose a time"}<small>{config.timezone}</small></strong><button onClick={() => go("date")} aria-label="Edit invitation time">Edit</button></div></>}{questions.map((question) => <div className="invite-review-line" key={question.id}><span><Sparkles size={17}/>{question.label}</span><strong>{question.options.filter((option) => (selections[question.id] || []).includes(option.id)).map((option) => option.label).join(", ") || "No preference"}</strong><button onClick={() => go("preferences")} aria-label={`Edit ${question.label}`}>Edit</button></div>)}<div className="invite-review-line invite-review-note"><span><Mail size={17}/>Your little note</span><strong>{message || "Just love. No extra words."}</strong><button onClick={() => go("note")} aria-label="Edit optional note">Edit</button></div></div>{!canSave && <div className="invite-unsaved-note"><Mail size={18}/><p>{payload.configured ? "Open the personal link Fahim shared with you to send this reply." : "You’re exploring the design. Connect Supabase and open a personal invitation link to save a real reply."}</p></div>}<div className="invite-submit-row"><button className="invite-button invite-primary" disabled={!canSave || saving} onClick={submit}>{saving ? "Sending your little reply…" : answer === "yes" ? "Send my yes, with love" : "Send my answer"}<Heart size={17}/></button><p>{demo ? "Saved only in this browser. It won’t be sent automatically." : canSave ? "Your reply is private, just between the two of you." : "Preview only · this reply has not been saved."}</p></div></>}
          {error && <div className="invite-error" role="alert"><span>{error}</span></div>}
        </div>
      </section>}
      {step === "saved" && receipt && <section className="invite-confirmation invite-animate-in"><div className="invite-saved-heart" aria-hidden="true"><Heart size={36}/><span><Check size={14}/></span></div><span className="invite-eyebrow">{demo ? "SAVED IN THIS BROWSER" : "YOUR REPLY HAS BEEN SAVED"}</span><h1 ref={headingRef} tabIndex={-1}>{receipt.answer === "yes" ? "It’s a date, my love." : "Love has no deadline."}</h1><p className="invite-confirmation-copy">{receipt.answer === "yes" ? config.closingMessage : "Another day, another little adventure. I’m happy to wait for a moment that feels right for you."}</p>{(receipt.answer === "yes" || receipt.selections.some((selection) => selection.options.length > 0)) && <div className="invite-saved-summary">{receipt.answer === "yes" && <><span><CalendarDays size={19}/>{dateLabel(receipt.chosenDate)}</span><span><Clock3 size={19}/>{receipt.chosenTime} · {receipt.timezone}</span></>}{receipt.selections.filter((selection) => selection.options.length > 0).map((selection) => <span key={selection.questionId}><Sparkles size={19}/>{selection.options.map((option) => option.label).join(" · ")}</span>)}</div>}{receipt.message && <blockquote className="invite-saved-message">“{receipt.message}”</blockquote>}<span className="invite-confirmation-signoff">Forever your date,<br/><strong>{config.senderName}</strong><Heart size={16}/></span><div className="invite-receipt"><Check size={13}/><span>Saved {new Date(receipt.submittedAt).toLocaleString("en", { timeZone: receipt.timezone, dateStyle: "medium", timeStyle: "short" })}<br/><small>Reply ID: {receipt.id}</small></span></div>{demo && <div className="invite-demo-actions"><p>This is a demo receipt on this device. Download your reply and share it with your partner.</p><button className="invite-button invite-primary" onClick={downloadReply}>Download my reply <Mail size={16}/></button><button className="invite-button invite-secondary" onClick={resetDemo}>Try again</button></div>}</section>}
      {!openingFailed && !isFlow && error && <div className="invite-error invite-global-error" role="alert"><X size={16}/><span>{error}</span></div>}
    </div>
    <footer className="invite-footer"><span>Made with love, for {config.recipientName}.</span><Heart size={12}/><span>A little time. A lot of us.</span><Link href="/about">About</Link></footer>
  </main>;
}
