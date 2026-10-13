#!/usr/bin/env node
// detect-stack.mjs — the ADAPT engine's sensor. Zero-dependency, read-only project probe.
// Reads real manifests (never node_modules, build output, .env) and writes a BEST-GUESS
// .claude/stack.json — the machine contract the other scripts read. The /adapt skill then
// reviews the guess WITH the human and enriches docs/STACK.md (the agent-facing memory map).
//
// Contract: never throws on a weird project — it degrades to conservative defaults and marks
// low-confidence fields so /adapt knows to confirm them. Run: node .claude/scripts/detect-stack.mjs
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const has = (p) => existsSync(join(ROOT, p));
const read = (p) => { try { return readFileSync(join(ROOT, p), 'utf8'); } catch { return ''; } };
const readJSON = (p) => { try { return JSON.parse(read(p) || '{}'); } catch { return {}; } };
const dirs = (p) => { try { return readdirSync(join(ROOT, p), { withFileTypes: true }).filter(e => e.isDirectory() && !e.name.startsWith('.')).map(e => e.name); } catch { return []; } };

const pkg = readJSON('package.json');
const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
const dep = (n) => Object.prototype.hasOwnProperty.call(deps, n);
const confidence = {}; // field -> "high" | "guess"

// ---- language ----
const language = [];
if (has('tsconfig.json') || has('tsconfig.base.json')) language.push('typescript');
else if (Object.keys(pkg).length) language.push('javascript');
if (has('pyproject.toml') || has('requirements.txt') || has('setup.py')) language.push('python');
if (has('go.mod')) language.push('go');
if (has('Cargo.toml')) language.push('rust');
if (has('pom.xml') || has('build.gradle') || has('build.gradle.kts')) language.push('java');
if (has('Gemfile')) language.push('ruby');
if (!language.length) { language.push('unknown'); confidence.language = 'guess'; }

// ---- package manager ----
let packageManager = 'unknown';
if (has('pnpm-lock.yaml')) packageManager = 'pnpm';
else if (has('yarn.lock')) packageManager = 'yarn';
else if (has('bun.lockb') || has('bun.lock')) packageManager = 'bun';
else if (has('package-lock.json')) packageManager = 'npm';
else if (has('poetry.lock')) packageManager = 'poetry';
else if (has('uv.lock')) packageManager = 'uv';
else if (has('go.mod')) packageManager = 'go';
else if (has('Cargo.toml')) packageManager = 'cargo';
else if (Object.keys(pkg).length) { packageManager = 'npm'; confidence.packageManager = 'guess'; }

// ---- monorepo ----
let monorepo = 'single-package';
if (has('turbo.json')) monorepo = 'turborepo';
else if (has('nx.json')) monorepo = 'nx';
else if (has('pnpm-workspace.yaml')) monorepo = 'pnpm-workspaces';
else if (Array.isArray(pkg.workspaces) || (pkg.workspaces && pkg.workspaces.packages)) monorepo = 'npm/yarn-workspaces';

// ---- scan roots (the reuse surface) ----
const scanRoots = [];
for (const c of ['packages', 'apps', 'libs', 'services', 'src', 'app']) if (has(c)) scanRoots.push(c);
if (!scanRoots.length) { scanRoots.push('src'); confidence.scanRoots = 'guess'; }

// ---- frameworks ----
const frameworks = [];
if (dep('next')) frameworks.push('next');
if (dep('react') && !dep('next')) frameworks.push('react');
if (dep('vue') || dep('nuxt')) frameworks.push(dep('nuxt') ? 'nuxt' : 'vue');
if (dep('svelte') || dep('@sveltejs/kit')) frameworks.push('svelte');
if (dep('astro')) frameworks.push('astro');
if (dep('express') || dep('fastify') || dep('@nestjs/core')) frameworks.push(dep('@nestjs/core') ? 'nestjs' : dep('fastify') ? 'fastify' : 'express');
if (has('manage.py') || (read('pyproject.toml') + read('requirements.txt')).match(/django|flask|fastapi/i)) {
  const py = (read('pyproject.toml') + read('requirements.txt')).toLowerCase();
  if (py.includes('django')) frameworks.push('django');
  if (py.includes('fastapi')) frameworks.push('fastapi');
  if (py.includes('flask')) frameworks.push('flask');
}

// ---- gate commands (prefer real package.json scripts; else framework defaults) ----
const scripts = pkg.scripts || {};
const pmRun = { pnpm: 'pnpm', yarn: 'yarn', npm: 'npm run', bun: 'bun run' }[packageManager] || 'npm run';
const wsPrefix = monorepo === 'turborepo' ? `${packageManager} ${packageManager === 'pnpm' ? '-w ' : ''}turbo run`
  : monorepo === 'nx' ? 'npx nx run-many -t'
  : null;
function gate(name, fallbacks) {
  if (wsPrefix && (scripts[name] || ['lint', 'typecheck', 'test', 'build'].includes(name))) return `${wsPrefix} ${name}`;
  if (scripts[name]) return `${pmRun} ${name}`;
  for (const f of fallbacks) if (f) return f;
  return null;
}
const isPy = language.includes('python');
const isGo = language.includes('go');
const gates = {
  lint: gate('lint', [isPy ? 'ruff check .' : isGo ? 'go vet ./...' : null]),
  typecheck: gate('typecheck', [scripts['type-check'] ? `${pmRun} type-check` : null, language.includes('typescript') ? 'npx tsc --noEmit' : isPy ? 'mypy .' : null]),
  test: gate('test', [isPy ? 'pytest' : isGo ? 'go test ./...' : null]),
  build: gate('build', [isGo ? 'go build ./...' : language.includes('rust') ? 'cargo build' : null]),
  e2e: scripts.e2e ? `${pmRun} e2e` : (dep('@playwright/test') || dep('playwright')) ? 'npx playwright test' : dep('cypress') ? 'npx cypress run' : null
};

// ---- database + authorization model ----
let db = { kind: 'none', schemaChangeCmd: null, typegenCmd: null, authzModel: 'app-layer' };
if (dep('@supabase/supabase-js') || dep('@supabase/ssr') || has('supabase')) {
  db = { kind: 'supabase-postgres', schemaChangeCmd: 'supabase db diff -f <name>', typegenCmd: 'supabase gen types typescript --local', authzModel: 'rls' };
} else if (dep('@prisma/client') || dep('prisma') || has('prisma/schema.prisma')) {
  db = { kind: 'prisma', schemaChangeCmd: 'npx prisma migrate dev --name <name>', typegenCmd: 'npx prisma generate', authzModel: 'app-layer' };
} else if (dep('drizzle-orm')) {
  db = { kind: 'drizzle', schemaChangeCmd: 'npx drizzle-kit generate', typegenCmd: 'npx drizzle-kit generate', authzModel: 'app-layer' };
} else if (frameworks.includes('django')) {
  db = { kind: 'django-orm', schemaChangeCmd: 'python manage.py makemigrations', typegenCmd: null, authzModel: 'app-layer' };
} else if (dep('typeorm') || dep('mongoose') || dep('sequelize')) {
  db = { kind: dep('mongoose') ? 'mongoose' : dep('typeorm') ? 'typeorm' : 'sequelize', schemaChangeCmd: null, typegenCmd: null, authzModel: 'app-layer' };
  confidence.db = 'guess';
}

// ---- deploy target ----
let deployTarget = 'unknown';
if (has('vercel.json') || dep('next')) deployTarget = 'vercel';
else if (has('netlify.toml')) deployTarget = 'netlify';
else if (has('Dockerfile') || has('docker-compose.yml')) deployTarget = 'docker';
else if (has('fly.toml')) deployTarget = 'fly';
else if (has('.github/workflows')) deployTarget = 'github-actions';
if (deployTarget === 'unknown') confidence.deployTarget = 'guess';

// ---- design system / UI ----
let designSystem = null;
if (dep('tailwindcss')) designSystem = 'tailwind';
if (has('components.json')) designSystem = designSystem ? designSystem + '+shadcn' : 'shadcn';
if (dep('@mui/material')) designSystem = 'mui';
if (dep('@chakra-ui/react')) designSystem = 'chakra';

// ---- formatter (for the post-edit hook) ----
let formatter = 'auto';
if (has('biome.json') || has('biome.jsonc')) formatter = 'biome';
else if (has('.prettierrc') || has('prettier.config.js') || has('.prettierrc.json') || deps.prettier) formatter = 'prettier';
else if (isPy) formatter = 'ruff';

const stack = {
  $comment: 'Auto-detected by detect-stack.mjs. Review with /adapt; low-confidence fields are listed under _confidence.',
  adapted: false,
  adaptedAt: null,
  _confidence: confidence,
  language, packageManager, monorepo, scanRoots, frameworks,
  gates,
  gateFilterFlag: monorepo === 'turborepo' ? '--filter' : monorepo === 'nx' ? '-p' : null,
  db,
  deployTarget,
  designSystem,
  secretPatterns: ['SERVICE_ROLE', 'service_role', 'SECRET_KEY', 'PRIVATE_KEY', 'sk_live', 'AKIA[0-9A-Z]{16}', '-----BEGIN [A-Z ]*PRIVATE KEY-----'],
  clientReachableGlobs: ['/app/', '/pages/', '/components/', '/src/client/'],
  formatter
};

const outDir = join(ROOT, '.claude');
if (!existsSync(outDir)) { console.error('detect-stack: no .claude/ dir — run from the A-Team-installed project root'); process.exit(1); }
writeFileSync(join(outDir, 'stack.json'), JSON.stringify(stack, null, 2) + '\n');
const lowConf = Object.keys(confidence);
console.log(`detect-stack: wrote .claude/stack.json`);
console.log(`  language=${language.join(',')} pm=${packageManager} mono=${monorepo} frameworks=${frameworks.join(',') || '—'}`);
console.log(`  db=${db.kind} authz=${db.authzModel} deploy=${deployTarget} design=${designSystem || '—'}`);
console.log(`  gates: ${Object.entries(gates).filter(([, v]) => v).map(([k, v]) => `${k}[${v}]`).join(' ') || '(none found — set in /adapt)'}`);
if (lowConf.length) console.log(`  ⚠ low-confidence (confirm in /adapt): ${lowConf.join(', ')}`);
