import { describe, expect, it } from "vitest";
import { createDemoGiftLink, DEMO_CONFIG_KEY, demoReceiptStore, readDemoConfig, readDemoGift, saveDemoConfig } from "../lib/demo-settings";
import { readDemoReceipt, saveDemoReceipt } from "../lib/browser-demo";
import { DEFAULT_CONFIG } from "../lib/defaults";
import type { SubmissionInput } from "../lib/contracts";

function storage() {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
}

describe("editable browser invitation", () => {
  it("saves validated edits for the invitation and reloads while keeping defaults intact", () => {
    const store = storage(); const draft = readDemoConfig(store);
    draft.recipientName = "Amina"; draft.title = "Our next little adventure"; draft.accent = "lavender";
    draft.questions[0].options[0].label = "A picnic for two";
    const saved = saveDemoConfig(store, draft);
    expect(readDemoConfig(store)).toEqual(saved);
    expect(saved.version).toBe(2);
    expect(saved.recipientName).toBe("Amina");
    expect(saved.questions[0].options[0].label).toBe("A picnic for two");
    expect(DEFAULT_CONFIG.recipientName).toBe("my love");
    expect(DEFAULT_CONFIG.questions[0].options[0].label).toBe("Dinner for two");
  });
  it("rejects stale-tab saves without overwriting newer edits", () => {
    const store = storage(); const old = readDemoConfig(store);
    const saved = saveDemoConfig(store, { ...old, recipientName: "New name" });
    expect(() => saveDemoConfig(store, { ...old, recipientName: "Old tab" })).toThrow("Another tab");
    expect(readDemoConfig(store)).toEqual(saved);
  });
  it("does not save invalid settings or claim success when storage is blocked", () => {
    const store = storage();
    expect(() => saveDemoConfig(store, { ...DEFAULT_CONFIG, timezone: "Not/A_Timezone" })).toThrow("Check timezone");
    expect(store.getItem(DEMO_CONFIG_KEY)).toBeNull();
    expect(() => saveDemoConfig({ ...store, setItem() { throw new Error("Storage full"); } }, DEFAULT_CONFIG)).toThrow("Storage full");
  });
  it("recovers corrupt cached documents with an independent default configuration", () => {
    const store = storage(); store.setItem(DEMO_CONFIG_KEY, "broken json");
    const config = readDemoConfig(store); config.questions[0].options.pop();
    expect(readDemoConfig(store)).toEqual(DEFAULT_CONFIG);
  });
  it("shares Unicode edits as a validated snapshot that works without the sender's storage", () => {
    const store = storage(); const first = saveDemoConfig(store, { ...DEFAULT_CONFIG, recipientName: "প্রিয় মানুষ 🌷", subtitle: "Just us, wherever we go." });
    const link = createDemoGiftLink("https://our-dream-date.vercel.app", first);
    expect(new URL(link).pathname).toBe("/demo");
    const gift = readDemoGift(new URL(link).hash)!;
    expect(gift.config).toEqual(first);
    saveDemoConfig(store, { ...first, subtitle: "Changed later" });
    expect(readDemoGift(new URL(link).hash)!.config.subtitle).toBe("Just us, wherever we go.");
    expect(readDemoConfig(storage())).toEqual(DEFAULT_CONFIG);
  });
  it("rejects broken and oversized share links", () => {
    expect(readDemoGift("#invitation")).toBeNull();
    for (const hash of ["#gift=", "#gift=invalid", `#gift=${"a".repeat(32001)}`]) expect(() => readDemoGift(hash)).toThrow("incomplete or invalid");
    const config = structuredClone(DEFAULT_CONFIG);
    config.questions = Array.from({ length: 10 }, (_, index) => ({ ...config.questions[0], id: `q${index}`, maxSelections: 20,
      options: Array.from({ length: 20 }, (_, choice) => ({ id: `o${choice}`, label: "L".repeat(100), description: "D".repeat(200), emoji: "♡" })) }));
    expect(() => createDemoGiftLink("https://our-dream-date.vercel.app", config)).toThrow("too long");
  });
  it("keeps replies for different personalized links and the original demo separate", () => {
    const store = storage();
    const input: SubmissionInput = { answer: "no", chosenDate: null, timeSlotId: null, selections: {}, message: "A note", configVersion: 1, idempotencyKey: crypto.randomUUID() };
    const original = saveDemoReceipt(store, input, DEFAULT_CONFIG);
    const giftA = readDemoGift(new URL(createDemoGiftLink("https://our-dream-date.vercel.app", DEFAULT_CONFIG)).hash)!;
    const giftB = readDemoGift(new URL(createDemoGiftLink("https://our-dream-date.vercel.app", DEFAULT_CONFIG)).hash)!;
    const savedA = saveDemoReceipt(demoReceiptStore(store, giftA.id), input, giftA.config);
    expect(readDemoReceipt(demoReceiptStore(store, giftB.id))).toBeNull();
    expect(readDemoReceipt(store)).toEqual(original);
    expect(readDemoReceipt(demoReceiptStore(store, giftA.id))).toEqual(savedA);
  });
});
