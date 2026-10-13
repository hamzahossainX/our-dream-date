import { z } from "zod";
import type { InvitationConfig, SavedResponse, SubmissionInput } from "./contracts";
import { validateSubmission } from "./validation";

export const DEMO_RECEIPT_KEY = "our-dream-date:demo-receipt:v1";
type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;
const receiptSchema = z.object({
  id: z.string().uuid(), invitationId: z.string().uuid(), answer: z.enum(["yes", "no"]),
  chosenDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => Number.isFinite(Date.parse(value))).nullable(),
  chosenTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable(),
  timezone: z.string().refine(value => { try { new Intl.DateTimeFormat("en", { timeZone: value }); return true; } catch { return false; } }),
  message: z.string().max(5000), submittedAt: z.string().datetime(), configVersion: z.number().int().positive(),
  selections: z.array(z.object({ questionId: z.string(), questionLabel: z.string(), options: z.array(z.object({ id: z.string(), label: z.string() })) })),
});

export function readDemoReceipt(store: Store): SavedResponse | null {
  const raw = store.getItem(DEMO_RECEIPT_KEY);
  if (!raw) return null;
  try { const parsed = receiptSchema.safeParse(JSON.parse(raw)); return parsed.success ? parsed.data : null; }
  catch { return null; }
}
export function saveDemoReceipt(store: Store, input: SubmissionInput, config: InvitationConfig, now = new Date()): SavedResponse {
  // Only the explicit final submission writes storage. Browser storage is a
  // testing convenience; it cannot enforce authorization or cross-device uniqueness.
  const validated = validateSubmission(input, config, now);
  const existing = readDemoReceipt(store);
  if (existing) return existing;
  const receipt: SavedResponse = {
    id: crypto.randomUUID(), invitationId: "00000000-0000-4000-8000-000000000000",
    answer: validated.input.answer, chosenDate: validated.input.chosenDate, chosenTime: validated.chosenTime,
    timezone: config.timezone, selections: validated.selections, message: validated.input.message,
    submittedAt: now.toISOString(), configVersion: config.version,
  };
  store.setItem(DEMO_RECEIPT_KEY, JSON.stringify(receipt));
  return receipt;
}
export function demoReplyText(receipt: SavedResponse) {
  return ["Our dream date — browser demo reply", `Answer: ${receipt.answer === "yes" ? "Yes" : "No"}`,
    ...(receipt.chosenDate ? [`Date: ${receipt.chosenDate}`, `Time: ${receipt.chosenTime} (${receipt.timezone})`] : []),
    ...receipt.selections.map(selection => `${selection.questionLabel}: ${selection.options.map(option => option.label).join(", ")}`),
    `Note: ${receipt.message || "No note"}`, `Reply ID: ${receipt.id}`, "This reply was saved in the recipient's browser. Share this file with your partner yourself.",
  ].join("\n");
}
