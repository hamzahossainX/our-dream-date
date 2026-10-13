import type { SavedResponse } from "./contracts";
import { DEFAULT_CONFIG } from "./defaults";

// Public sample values, never a Supabase account or an authorization credential.
export const DEMO_LOGIN = { email: "demo@little-invitation.example", password: "ExploreTheDemo!" };
export function isDemoLogin(email: string, password: string) {
  return email.trim().toLowerCase() === DEMO_LOGIN.email && password === DEMO_LOGIN.password;
}
export function demoResponses(): SavedResponse[] {
  const question = DEFAULT_CONFIG.questions[0];
  return [
    { answer: "yes", date: "2026-10-20", time: "17:30", message: "DEMO · Dinner and a sunset walk sound lovely. ♡", options: question.options.slice(0, 1) },
    { answer: "yes", date: "2026-10-21", time: "15:00", message: "DEMO · A quiet afternoon, just the two of us.", options: question.options.slice(1, 2) },
    { answer: "no", date: null, time: null, message: "DEMO · Let's pick another day together.", options: [] },
    { answer: "yes", date: "2026-10-22", time: "19:00", message: "DEMO · I'm already looking forward to it!", options: question.options.slice(2, 3) },
  ].map((sample, index) => ({
    id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
    invitationId: "00000000-0000-4000-8000-000000000000", answer: sample.answer as "yes" | "no",
    chosenDate: sample.date, chosenTime: sample.time, timezone: DEFAULT_CONFIG.timezone,
    selections: sample.options.length ? [{ questionId: question.id, questionLabel: question.label, options: sample.options.map(({ id, label }) => ({ id, label })) }] : [],
    message: sample.message, submittedAt: `2026-10-${13 - index}T10:00:00.000Z`, configVersion: 1,
  }));
}
