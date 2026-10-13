import { describe, expect, it } from "vitest";
import { DEMO_RECEIPT_KEY, demoReplyText, readDemoReceipt, saveDemoReceipt } from "../lib/browser-demo";
import { DEMO_LOGIN, demoResponses, isDemoLogin } from "../lib/admin-demo";
import { DEFAULT_CONFIG } from "../lib/defaults";
import type { SubmissionInput } from "../lib/contracts";

function storage() {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
}
const input: SubmissionInput = { answer: "no", chosenDate: null, timeSlotId: null, selections: {}, message: "Another day, with love.", configVersion: DEFAULT_CONFIG.version, idempotencyKey: "00000000-0000-4000-8000-000000000001" };
describe("isolated browser demo", () => {
  it("stores only a validated final response and reloads its receipt", () => {
    const store = storage();
    expect(readDemoReceipt(store)).toBeNull();
    expect(() => saveDemoReceipt(store, { ...input, answer: "yes" }, DEFAULT_CONFIG)).toThrow();
    expect(store.getItem(DEMO_RECEIPT_KEY)).toBeNull();
    const saved = saveDemoReceipt(store, input, DEFAULT_CONFIG);
    expect(readDemoReceipt(store)).toEqual(saved);
    expect(saved.chosenDate).toBeNull();
    expect(demoReplyText(saved)).toContain("Share this file with your partner yourself.");
  });
  it("preserves the first complete browser reply until explicitly cleared", () => {
    const store = storage(); const first = saveDemoReceipt(store, input, DEFAULT_CONFIG);
    expect(saveDemoReceipt(store, { ...input, message: "New note" }, DEFAULT_CONFIG)).toEqual(first);
    store.removeItem(DEMO_RECEIPT_KEY);
    expect(readDemoReceipt(store)).toBeNull();
  });
  it("rejects corrupt stored receipts and surfaces blocked storage without claiming success", () => {
    const store = storage(); store.setItem(DEMO_RECEIPT_KEY, "broken json");
    expect(readDemoReceipt(store)).toBeNull();
    store.setItem(DEMO_RECEIPT_KEY, JSON.stringify({ id: "fake", chosenDate: "not a date" }));
    expect(readDemoReceipt(store)).toBeNull();
    expect(() => saveDemoReceipt({ ...storage(), setItem() { throw new Error("Storage blocked"); } }, input, DEFAULT_CONFIG)).toThrow("Storage blocked");
  });
  it("uses public sample login values and fresh fictional records", () => {
    expect(isDemoLogin(DEMO_LOGIN.email, DEMO_LOGIN.password)).toBe(true);
    expect(isDemoLogin(DEMO_LOGIN.email, "wrong")).toBe(false);
    expect(demoResponses().every(response => response.message.startsWith("DEMO"))).toBe(true);
    const samples = demoResponses(); samples.pop();
    expect(demoResponses()).toHaveLength(4);
  });
});
