#!/usr/bin/env node
// path-guard.mjs — PreToolUse hook (Edit|Write): mechanical write-boundary enforcement.
// Turns "this agent should only touch tests/" from an instruction into a wall.
//
// Config: .claude/guard.json — { "enabled": true, "allow": ["tests/", "supabase/migrations/"],
//   "note": "scenario-tester wave" }. The ORCHESTRATOR arms it before a scoped wave and
//   disarms (enabled:false) after; agents themselves never edit guard.json (it is guarded below).
// Behavior: no guard.json or enabled:false → allow everything (exit 0).
//   enabled:true → block (exit 2) any Edit/Write whose path is outside every allow prefix.
//   Corrupt guard.json while present → fail CLOSED (block all edits, say why) — a broken
//   wall that silently opens is worse than one that visibly blocks.

import { readFileSync } from "node:fs";
import { resolve, sep } from "node:path";

let raw = "";
process.stdin.on("data", (d) => (raw += d));
process.stdin.on("end", () => {
  const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const guardPath = resolve(root, ".claude", "guard.json");

  let guard;
  try {
    guard = JSON.parse(readFileSync(guardPath, "utf8"));
  } catch (e) {
    if (e.code === "ENOENT") process.exit(0); // no guard configured → allow
    console.error(`path-guard: .claude/guard.json exists but is unreadable/invalid (${e.message}). Failing CLOSED — fix or remove guard.json.`);
    process.exit(2);
  }
  if (!guard || guard.enabled !== true) process.exit(0);

  let input = {};
  try { input = JSON.parse(raw); } catch { process.exit(0); }
  const filePath = input?.tool_input?.file_path || input?.tool_input?.notebook_path;
  if (!filePath) process.exit(0);

  const abs = resolve(root, filePath);
  const rel = abs.startsWith(root + sep) ? abs.slice(root.length + 1) : abs;

  // guard.json itself is always protected while the guard is armed.
  if (rel === ".claude/guard.json" || rel === `.claude${sep}guard.json`) {
    console.error("path-guard: guard.json is locked while the guard is armed. Only the orchestrator disarms it (set enabled:false) after the scoped wave completes.");
    process.exit(2);
  }

  const allow = Array.isArray(guard.allow) ? guard.allow : [];
  const ok = allow.some((p) => {
    const prefix = String(p).replace(/^\.\//, "").replace(/\/+$/, "");
    return rel === prefix || rel.startsWith(prefix + "/");
  });
  if (ok) process.exit(0);

  console.error(
    `path-guard BLOCKED: this wave is scoped to [${allow.join(", ")}]` +
      (guard.note ? ` (${guard.note})` : "") +
      `. "${rel}" is outside the boundary. If this edit is genuinely needed, report it to the orchestrator/owner instead of working around the guard.`
  );
  process.exit(2);
});
