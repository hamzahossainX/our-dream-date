import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomBytes, randomUUID, createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import ExcelJS from "exceljs";
import type { InvitationConfig, SavedResponse, SubmissionInput } from "../lib/contracts";

// Never runs against hosted data. Secrets are consumed only in memory and never logged.
const enabled = process.env.RUN_INTEGRATION === "1";
const suite = enabled ? describe : describe.skip;
class BrowserSession {
  private cookies = new Map<string, string>();
  constructor(private base: string, private origin: string) {}
  async request(path: string, method = "GET", body?: unknown, origin = this.origin) {
    const headers: Record<string, string> = { Origin: origin };
    if (this.cookies.size) headers.Cookie = [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; ");
    if (body !== undefined) headers["Content-Type"] = "application/json";
    const response = await fetch(`${this.base}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), redirect: "manual" });
    for (const cookie of response.headers.getSetCookie()) {
      const pair = cookie.split(";")[0]; const split = pair.indexOf("=");
      const name = pair.slice(0, split), value = pair.slice(split + 1);
      if (value) this.cookies.set(name, value); else this.cookies.delete(name);
    }
    return response;
  }
}
function localUrl(value: string) {
  const url = new URL(value);
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) || url.protocol !== "http:") throw new Error("Integration tests require HTTP loopback URLs.");
  return url.origin;
}
function required(name: string) { const value = process.env[name]; if (!value) throw new Error(`Missing integration setting: ${name}`); return value; }
function loadLocalEnv() {
  if (!existsSync(".env.local")) return;
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^(["'])(.*)\1$/, "$2");
  }
}
function check(error: unknown, operation: string) { if (error) throw new Error(`Local fixture operation failed: ${operation}`); }

suite("real local invitation and admin boundaries", () => {
  let service: SupabaseClient, anon: SupabaseClient, outsiderDb: SupabaseClient;
  let invitationId: string, origin: string, base: string, config: InvitationConfig;
  let owner: BrowserSession, outsider: BrowserSession;
  const userIds: string[] = [], recipientIds: string[] = [];
  const marker = `qa-${randomUUID()}`;
  let yesReceipt: SavedResponse, noReceipt: SavedResponse;
  let noFixture: Awaited<ReturnType<typeof recipient>>;

  async function recipient() {
    const token = randomBytes(32).toString("base64url");
    const { data, error } = await service.from("recipient_invites").insert({ invitation_id: invitationId, token_hash: createHash("sha256").update(token).digest("hex") }).select("id").single();
    check(error, "recipient creation"); recipientIds.push(data!.id);
    const session = new BrowserSession(base, origin);
    expect((await session.request("/api/invitation/open", "POST", { token })).status).toBe(200);
    const response = await session.request("/api/invitation");
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.authorized).toBe(true); expect(payload.response).toBeNull();
    const key = response.headers.get("x-idempotency-key"); if (!key) throw new Error("Missing recipient idempotency key");
    return { session, key, id: data!.id, config: payload.config as InvitationConfig, token };
  }
  function submission(version: number, key: string, answer: "yes" | "no"): SubmissionInput {
    const date = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    const selections = Object.fromEntries(config.questions.filter(q => q.appliesTo === answer || q.appliesTo === "both").map(q => [q.id, q.options.slice(0, q.required ? Math.max(1, q.minSelections) : 0).map(o => o.id)]));
    return { answer, chosenDate: answer === "yes" ? date : null, timeSlotId: answer === "yes" ? config.timeSlots[0].id : null, selections, message: marker, configVersion: version, idempotencyKey: key };
  }
  beforeAll(async () => {
    loadLocalEnv();
    const supabaseUrl = localUrl(required("NEXT_PUBLIC_SUPABASE_URL"));
    origin = localUrl(required("APP_URL")); base = localUrl(process.env.INTEGRATION_APP_URL || "http://127.0.0.1:3000");
    invitationId = required("INVITATION_ID");
    service = createClient(supabaseUrl, required("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });
    anon = createClient(supabaseUrl, required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"), { auth: { persistSession: false } });
    const { data, error } = await service.from("invitations").select("config").eq("id", invitationId).single(); check(error, "seed lookup"); config = data!.config;
    for (const isOwner of [true, false]) {
      const email = `qa-${randomUUID()}@example.test`, password = randomBytes(32).toString("base64url");
      const created = await service.auth.admin.createUser({ email, password, email_confirm: true }); check(created.error, "auth fixture creation");
      const id = created.data.user!.id; userIds.push(id);
      if (isOwner) check((await service.from("admin_memberships").insert({ user_id: id, invitation_id: invitationId })).error, "membership creation");
      const session = new BrowserSession(base, origin);
      expect((await session.request("/api/admin/login", "POST", { email, password })).status).toBe(isOwner ? 200 : 403);
      if (isOwner) owner = session;
      else {
        outsider = session;
        outsiderDb = createClient(supabaseUrl, required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"), { auth: { persistSession: false } });
        check((await outsiderDb.auth.signInWithPassword({ email, password })).error, "outsider direct login");
      }
    }
  }, 180000);
  afterAll(async () => {
    if (!service) return;
    if (recipientIds.length) {
      check((await service.from("responses").delete().in("recipient_id", recipientIds)).error, "response cleanup");
      check((await service.from("recipient_invites").delete().in("id", recipientIds)).error, "recipient cleanup");
    }
    for (const id of userIds) check((await service.auth.admin.deleteUser(id)).error, "auth fixture cleanup");
  }, 60000);

  it("never stores incomplete drafts or invalid final responses", async () => {
    const fixture = await recipient();
    const invalid = { ...submission(config.version, fixture.key, "yes"), chosenDate: null };
    expect((await fixture.session.request("/api/responses", "POST", invalid)).status).toBe(422);
    expect((await fixture.session.request("/api/responses", "POST", { answer: "yes" })).status).toBe(422);
    const count = await service.from("responses").select("id", { count: "exact", head: true }).eq("recipient_id", fixture.id);
    check(count.error, "incomplete count"); expect(count.count).toBe(0);
    const row = await service.from("recipient_invites").select("completed_at").eq("id", fixture.id).single(); check(row.error, "completion lookup"); expect(row.data!.completed_at).toBeNull();
  }, 60000);
  it("commits valid Yes once under parallel retry, retains receipt on another device and rejects changed content", async () => {
    const fixture = await recipient(), payload = submission(config.version, fixture.key, "yes");
    const results = await Promise.all(Array.from({ length: 3 }, () => fixture.session.request("/api/responses", "POST", payload)));
    expect(results.map(r => r.status)).toEqual([200, 200, 200]);
    const receipts = await Promise.all(results.map(r => r.json())); yesReceipt = receipts[0].response;
    expect(new Set(receipts.map(r => r.response.id)).size).toBe(1); expect(yesReceipt.answer).toBe("yes"); expect(yesReceipt.message).toBe(marker);
    expect(Number.isFinite(Date.parse(yesReceipt.submittedAt))).toBe(true);
    const count = await service.from("responses").select("id", { count: "exact", head: true }).eq("recipient_id", fixture.id); check(count.error, "concurrent count"); expect(count.count).toBe(1);
    expect((await fixture.session.request("/api/responses", "POST", { ...payload, message: "changed" })).status).toBe(409);
    const another = new BrowserSession(base, origin);
    expect((await another.request("/api/invitation/open", "POST", { token: fixture.token })).status).toBe(200);
    const replay = await another.request("/api/invitation"); const receipt = await replay.json(); expect(receipt.response.id).toBe(yesReceipt.id);
    expect((await another.request("/api/responses", "POST", { ...payload, idempotencyKey: replay.headers.get("x-idempotency-key") })).status).toBe(200);
  }, 60000);
  it("saves a complete No with no schedule and formula-like plain text", async () => {
    const fixture = await recipient();
    noFixture = fixture;
    const response = await fixture.session.request("/api/responses", "POST", { ...submission(config.version, fixture.key, "no"), message: `=HYPERLINK("https://example.test") ${marker}` });
    expect(response.status).toBe(200); noReceipt = (await response.json()).response;
    expect(noReceipt.chosenDate).toBeNull(); expect(noReceipt.chosenTime).toBeNull(); expect(noReceipt.answer).toBe("no");
  }, 60000);
  it("rejects cross-origin writes, forged recipient sessions and expired/revoked links", async () => {
    const fixture = await recipient();
    expect((await fixture.session.request("/api/responses", "POST", submission(config.version, fixture.key, "no"), "https://evil.example")).status).toBe(403);
    const unauthorized = await fetch(`${base}/api/responses`, { method: "POST", headers: { Origin: origin, "Content-Type": "application/json", Cookie: "fahim_invitation=forged.forged" }, body: JSON.stringify(submission(config.version, fixture.key, "no")) });
    expect(unauthorized.status).toBe(401);
    check((await service.from("recipient_invites").update({ revoked_at: new Date().toISOString() }).eq("id", fixture.id)).error, "fixture revocation");
    expect((await fixture.session.request("/api/responses", "POST", submission(config.version, fixture.key, "no"))).status).toBe(401);
    expect((await fixture.session.request("/api/invitation/open", "POST", { token: fixture.token })).status).toBe(401);
    const expired = await recipient();
    check((await service.from("recipient_invites").update({ expires_at: new Date(Date.now() - 1000).toISOString() }).eq("id", expired.id)).error, "fixture expiration");
    expect((await expired.session.request("/api/invitation/open", "POST", { token: expired.token })).status).toBe(401);
  }, 60000);
  it("enforces the persistent submit rate limit while preserving one committed response", async () => {
    const fixture = await recipient(), payload = submission(config.version, fixture.key, "no");
    for (let attempt = 0; attempt < 20; attempt++) expect((await fixture.session.request("/api/responses", "POST", payload)).status).toBe(200);
    expect((await fixture.session.request("/api/responses", "POST", payload)).status).toBe(429);
    const count = await service.from("responses").select("id", { count: "exact", head: true }).eq("recipient_id", fixture.id);
    check(count.error, "rate-limited fixture count"); expect(count.count).toBe(1);
  }, 60000);
  it("denies anonymous and non-member read/export/config APIs and direct database access", async () => {
    const anonymous = new BrowserSession(base, origin);
    for (const session of [anonymous, outsider]) {
      for (const path of ["/api/admin/responses", "/api/admin/config", "/api/admin/export?format=csv"]) expect([401, 403]).toContain((await session.request(path)).status);
      expect([401, 403]).toContain((await session.request("/api/admin/config", "PUT", { config })).status);
      expect([401, 403]).toContain((await session.request(`/api/admin/responses/${yesReceipt.id}`, "DELETE")).status);
    }
    for (const client of [anon, outsiderDb]) {
      const rows = await client.from("responses").select("id").eq("invitation_id", invitationId);
      expect(rows.error !== null || rows.data?.length === 0).toBe(true);
      const escalation = await client.from("admin_memberships").insert({ user_id: userIds[1], invitation_id: invitationId }); expect(escalation.error).not.toBeNull();
      const publish = await client.rpc("publish_invitation_config", { p_invitation: invitationId, p_expected_version: config.version, p_config: config, p_actor: userIds[1] }); expect(publish.error).not.toBeNull();
      const directInsert = await client.from("responses").insert({ id: randomUUID(), invitation_id: invitationId }); expect(directInsert.error).not.toBeNull();
      const limiter = await client.rpc("consume_rate_limit", { p_key: "a".repeat(64), p_limit: 1, p_seconds: 900 }); expect(limiter.error).not.toBeNull();
    }
  }, 60000);
  it("serves authorized filters and metrics and exports formula text as inert CSV and Excel strings", async () => {
    const filtered = await owner.request(`/api/admin/responses?q=${marker}&answer=yes&activity=${yesReceipt.selections[0].options[0].id}`);
    expect(filtered.status).toBe(200); const payload = await filtered.json(); expect(payload.total).toBe(1); expect(payload.responses[0].id).toBe(yesReceipt.id); expect(payload.metrics.total).toBeGreaterThanOrEqual(2);
    const csvResponse = await owner.request(`/api/admin/export?format=csv&q=${noReceipt.id}`); expect(csvResponse.status).toBe(200); expect(await csvResponse.text()).toContain("'=" + 'HYPERLINK(""https://example.test"")');
    const excel = await owner.request(`/api/admin/export?format=xlsx&q=${noReceipt.id}`); expect(excel.status).toBe(200);
    const book = new ExcelJS.Workbook(); await book.xlsx.load(await excel.arrayBuffer());
    const cell = book.worksheets[0].getCell("G2"); expect(cell.type).toBe(ExcelJS.ValueType.String); expect(cell.value).toBe(`'${noReceipt.message}`); expect(book.worksheets[0].rowCount).toBe(2);
    expect((await owner.request("/api/admin/responses?page=0")).status).toBe(422);
  }, 60000);
  it("publishes versions, rejects stale forms and preserves historical labels, then restores configured copy", async () => {
    const stale = await recipient(); const original = structuredClone(config);
    const edited = structuredClone(config); edited.questions[0].options[0].label = "QA temporary updated label";
    const publication = await owner.request("/api/admin/config", "PUT", { config: edited }); expect(publication.status).toBe(200);
    config = (await publication.json()).config;
    try {
      expect(config.version).toBe(original.version + 1);
      expect((await stale.session.request("/api/responses", "POST", submission(original.version, stale.key, "yes"))).status).toBe(409);
      expect((await owner.request("/api/admin/config", "PUT", { config: edited })).status).toBe(409);
      const historic = await owner.request(`/api/admin/responses?q=${yesReceipt.id}`);
      expect((await historic.json()).responses[0].selections).toEqual(yesReceipt.selections);
      const rows = await service.from("invitation_versions").select("version").eq("invitation_id", invitationId).in("version", [original.version, config.version]); check(rows.error, "version lookup"); expect(rows.data).toHaveLength(2);
    } finally {
      const restored = await owner.request("/api/admin/config", "PUT", { config: { ...original, version: config.version } });
      expect(restored.status).toBe(200); config = (await restored.json()).config;
    }
  }, 60000);
  it("deletes only fixture responses, updates lists and keeps completed invitation closed", async () => {
    expect((await owner.request(`/api/admin/responses/${noReceipt.id}`, "DELETE")).status).toBe(200);
    const list = await owner.request(`/api/admin/responses?q=${noReceipt.id}`); expect((await list.json()).total).toBe(0);
    expect((await owner.request(`/api/admin/responses/${noReceipt.id}`, "DELETE")).status).toBe(404);
    const row = await service.from("recipient_invites").select("completed_at").eq("id", noFixture.id).single();
    check(row.error, "closed fixture lookup"); expect(row.data!.completed_at).not.toBeNull();
    expect((await noFixture.session.request("/api/invitation")).status).toBe(410);
    expect((await noFixture.session.request("/api/responses", "POST", submission(config.version, noFixture.key, "no"))).status).toBe(410);
    expect((await owner.request("/api/admin/logout", "POST", {})).status).toBe(200);
    expect((await owner.request("/api/admin/responses")).status).toBe(401);
  }, 60000);
});
