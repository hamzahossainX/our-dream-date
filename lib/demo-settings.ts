import { z } from "zod";
import type { InvitationConfig } from "./contracts";
import { DEFAULT_CONFIG } from "./defaults";
import { configSchema } from "./validation";
import { DEMO_RECEIPT_KEY } from "./browser-demo";

export const DEMO_CONFIG_KEY = "our-dream-date:demo-config:v1";
type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;
const giftSchema = z.object({ id: z.string().uuid(), config: configSchema }).strict();
const MAX_LINK_DATA = 32000;

export function readDemoConfig(store: Store): InvitationConfig {
  const raw = store.getItem(DEMO_CONFIG_KEY);
  if (raw) {
    try { const result = configSchema.safeParse(JSON.parse(raw)); if (result.success) return result.data; }
    catch { /* An invalid stored document falls back to the original design. */ }
  }
  return structuredClone(DEFAULT_CONFIG);
}

export function saveDemoConfig(store: Store, draft: InvitationConfig): InvitationConfig {
  const result = configSchema.safeParse(draft);
  if (!result.success) {
    const issue = result.error.issues[0];
    throw new Error(`Check ${issue.path.join(" ") || "invitation settings"}: ${issue.message}`);
  }
  const parsed = result.data;
  if (readDemoConfig(store).version !== parsed.version) throw new Error("Another tab saved newer settings. Reload this dashboard before saving again.");
  const saved = { ...parsed, version: parsed.version + 1 };
  store.setItem(DEMO_CONFIG_KEY, JSON.stringify(saved));
  return saved;
}

export function createDemoGiftLink(origin: string, config: InvitationConfig): string {
  const gift = { id: crypto.randomUUID(), config: configSchema.parse(config) };
  const bytes = new TextEncoder().encode(JSON.stringify(gift));
  if (bytes.length > MAX_LINK_DATA * .75) throw new Error("These settings are too long for a share link. Shorten the wording or reduce the choices.");
  const data = btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join("")).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
  const url = new URL("/demo", origin);
  url.hash = new URLSearchParams({ gift: data }).toString();
  return url.toString();
}

export function readDemoGift(hash: string): z.infer<typeof giftSchema> | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  if (!params.has("gift")) return null;
  const data = params.get("gift") || "";
  try {
    if (!data || data.length > MAX_LINK_DATA) throw new Error("Invalid link length");
    const bytes = Uint8Array.from(atob(data.replaceAll("-", "+").replaceAll("_", "/")), char => char.charCodeAt(0));
    return giftSchema.parse(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)));
  } catch { throw new Error("This personalized invitation link is incomplete or invalid. Ask the sender for a fresh link."); }
}

export function demoReceiptStore(store: Store, giftId: string | null): Store {
  if (!giftId) return store;
  const scoped = (key: string) => key === DEMO_RECEIPT_KEY ? `${key}:${giftId}` : key;
  return { getItem: key => store.getItem(scoped(key)), setItem: (key, value) => store.setItem(scoped(key), value), removeItem: key => store.removeItem(scoped(key)) };
}
