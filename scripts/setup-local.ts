import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

// Disposable local development only. Never provisions or modifies a hosted account.
if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
  const host = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "https://invalid.example").hostname;
  if (!["localhost", "127.0.0.1", "::1"].includes(host)) throw new Error("Refusing to change a hosted configuration.");
  if (existsSync(".local-access.txt")) {
    console.log("Local configuration already exists. Your private access details are in .local-access.txt.");
    process.exit(0);
  }
  throw new Error("Existing local settings found. Use the manual setup guide to preserve them.");
}
const result = spawnSync("npx", ["supabase", "status", "-o", "json"], { encoding: "utf8" });
if (result.status !== 0) throw new Error("Start the local Supabase stack with npx supabase start first.");
const status = JSON.parse(result.stdout) as Record<string, string>;
const host = new URL(status.API_URL).hostname;
if (!["localhost", "127.0.0.1", "::1"].includes(host)) throw new Error("Expected a loopback Supabase stack.");
const client = createClient(status.API_URL, status.SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const email = `fahim-local-${randomBytes(3).toString("hex")}@example.test`;
const password = randomBytes(24).toString("base64url");
const { data, error } = await client.auth.admin.createUser({ email, password, email_confirm: true });
if (error || !data.user) throw new Error("The local admin could not be provisioned.");
const settings: Record<string, string> = {
  NEXT_PUBLIC_SUPABASE_URL: status.API_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: status.PUBLISHABLE_KEY || status.ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: status.SERVICE_ROLE_KEY,
  INVITATION_SESSION_SECRET: randomBytes(32).toString("hex"),
  INVITATION_ID: randomUUID(), APP_URL: "http://127.0.0.1:3000", ADMIN_USER_ID: data.user.id,
};
writeFileSync(".env.local", Object.entries(settings).map(([k, v]) => `${k}=${v}`).join("\n") + "\n", { mode: 0o600 });
const bootstrap = spawnSync("npm", ["run", "bootstrap"], { encoding: "utf8", env: { ...process.env, ...settings } });
if (bootstrap.status !== 0) throw new Error("Local settings were saved but bootstrap failed. Review the migration and setup guide.");
const link = bootstrap.stdout.split("\n").find(line => line.startsWith(settings.APP_URL + "/#invite="));
if (!link) throw new Error("No private link was returned by bootstrap.");
writeFileSync(".local-access.txt", [
  "LOCAL DEVELOPMENT ONLY — KEEP OUT OF GIT",
  "This account belongs to the disposable local Supabase stack, not a hosted project.",
  `Admin page: ${settings.APP_URL}/admin/login`, `Email: ${email}`, `Password: ${password}`,
  `Private invitation: ${link}`, `Local database studio: ${status.STUDIO_URL}`, "",
].join("\n"), { mode: 0o600 });
if (!readFileSync(".gitignore", "utf8").includes(".local-access.txt")) throw new Error("Private access details must be ignored by Git.");
console.log("Local Supabase admin and invitation are ready. Access details are saved privately in .local-access.txt.");
