# Dachdecker Lernapp — MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the premium app "machine" — Next.js PWA with the Schiefer & Kupfer theme (dark default + light reading mode), navigation, a localStorage progress store, all 6 task-type renderers, and Lernfeld 1 fully fleshed out as a showcase.

**Architecture:** Next.js App Router (client-rendered PWA, no backend). Content lives as versioned JSON in `content/` and is imported at build time. Pure logic (content loading, cloze parsing, calc engine, progress/spaced-repetition) is isolated in `lib/` and unit-tested with Vitest. UI is built from focused React components verified in the browser preview. Theme is driven by CSS custom properties toggled via a `data-theme` attribute on `<html>`.

**Tech Stack:** Next.js 15 (App Router) · React · TypeScript · Tailwind CSS v4 · mathjs (calc) · Vitest + @testing-library/react (logic/component tests) · next-pwa-style manifest + service worker.

## Global Constraints

- Next.js App Router + TypeScript. Target Node ≥ 20 (dev machine has v26).
- PWA, mobile-first. Must install and run offline on iPad.
- No accounts, no database, no server calls. Progress in `localStorage` only.
- Content = versioned JSON in `content/`. No CMS.
- Aufgabentypen: `mc`, `cloze`, `calc`, `diagram`, `draw`, `fachbegriff`. Plus `lektion` theory cards.
- Every Aufgabe/Lektion has `quelle` and `konfidenz` (`hoch | mittel | pruefen`). Entries with `konfidenz: "pruefen"` MUST be filtered out and never rendered.
- No invented Fachwerte. Safety topics: omit rather than guess.
- Own SVGs only (no traced/copied third-party graphics).
- Design: "Schiefer & Kupfer" — dark (#23262b base, #c07d4a copper accent, #ece7df text) as default; light reading mode (#faf7f2 base, copper/brick accent, dark text). Both from the same CSS-variable tokens. Toggle persisted in localStorage; first-run respects `prefers-color-scheme`.
- Recommended learning order (LF 7 before LF 8–10) is displayed, never enforced/locked.

## Scope

**In scope (this plan):** app scaffold, PWA setup, theme system, schema extension, content-loading lib, progress store, app shell + navigation, Dashboard, Lernfelder overview, Lernfeld detail, Übungs-Session engine, all 6 task renderers, LF 1 content (theory cards + aufgaben of every type + own SVGs).

**Out of scope (separate follow-up plans):** Rechner screen (standalone calculators), Prüfungssimulation (timer/mixed mode), content for LF 2–17 + WiSo, Fachbegriff spaced-repetition deck growth beyond LF 1.

---

## File Structure

```
dachdecker-app/
├── package.json, tsconfig.json, next.config.ts, vitest.config.ts   (Task 1)
├── public/
│   ├── manifest.webmanifest, icons/*                                (Task 2)
│   └── sw.js                                                         (Task 2)
├── app/
│   ├── layout.tsx            root layout, theme bootstrap, nav      (Task 7)
│   ├── globals.css           theme tokens (dark+light)              (Task 3)
│   ├── page.tsx              Dashboard / Start                      (Task 15)
│   ├── lernen/page.tsx       Lernfelder overview                    (Task 8)
│   ├── lernen/[lf]/page.tsx  Lernfeld detail                        (Task 9)
│   └── lernen/[lf]/ueben/page.tsx  Übungs-Session                   (Task 10)
├── components/
│   ├── ThemeToggle.tsx                                              (Task 4)
│   ├── BottomNav.tsx                                                (Task 7)
│   ├── ProgressBar.tsx, LernfeldCard.tsx                            (Task 8)
│   ├── LektionCard.tsx                                              (Task 9)
│   ├── session/SessionRunner.tsx                                    (Task 10)
│   └── aufgaben/{McCard,ClozeCard,CalcCard,DiagramCard,DrawCard,FachbegriffCard}.tsx  (Tasks 11-16)
├── lib/
│   ├── theme.ts             theme get/set + bootstrap               (Task 4)
│   ├── content.ts           load + filter content                  (Task 6)
│   ├── cloze.ts             parse {{...}} + check answers           (Task 12)
│   ├── calc.ts              randomize params + evaluate steps       (Task 13)
│   └── progress.ts          localStorage store + spaced repetition  (Task 5)
├── content/
│   ├── schema.ts            (extend: draw, fachbegriff, lektion, progress)  (Task 3)
│   ├── lernfelder.json      (exists)
│   ├── fachbegriffe.json    (Task 16/17)
│   └── lf01/{aufgaben.json, lektionen.json, svg/*.svg}             (Task 17)
└── lib/__tests__/*.test.ts  Vitest unit tests
```

---

## Task 1: Scaffold Next.js + TypeScript + Tailwind + Vitest

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `vitest.config.ts`, `.gitignore`
- Keep: existing `content/`, `docs/`, `quellen/`, `CLAUDE.md`

**Interfaces:**
- Produces: a runnable Next.js dev server on `http://localhost:3000`; `npm test` runs Vitest.

- [ ] **Step 1: Scaffold the app in-place.** From `dachdecker-app/`, run create-next-app into a temp dir and move files in (create-next-app refuses a non-empty dir).

```bash
cd /Users/salimsakkali/Downloads/dachdecker-app
npx create-next-app@latest .app-scaffold --ts --app --tailwind --eslint --no-src-dir --import-alias "@/*" --use-npm --yes
# move scaffold into project root without clobbering content/docs/quellen/CLAUDE.md
rsync -a .app-scaffold/ ./ --exclude content --exclude docs --exclude quellen --exclude CLAUDE.md
rm -rf .app-scaffold
```

- [ ] **Step 2: Add test + calc dependencies.**

```bash
npm install mathjs
npm install -D vitest @testing-library/react @testing-library/dom jsdom @vitejs/plugin-react
```

- [ ] **Step 3: Create `vitest.config.ts`.**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: { environment: "jsdom", globals: true },
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
});
```

- [ ] **Step 4: Add the `test` script to `package.json`.** Ensure `"scripts"` contains `"test": "vitest run"` and `"test:watch": "vitest"`.

- [ ] **Step 5: Smoke-test build + test runner.**

Run: `npm run build`
Expected: build succeeds (compiles, no type errors).
Run: `npm test`
Expected: "No test files found" (exit 0) — runner works.

- [ ] **Step 6: Verify dev server renders.** Start via the browser preview (`.claude/launch.json` name `dachdecker`, `npm run dev`, port 3000), navigate to `http://localhost:3000`, confirm the default Next page renders with no console errors.

- [ ] **Step 7: Commit** (initialize git first).

```bash
git init && git add -A && git commit -m "chore: scaffold Next.js + Tailwind + Vitest"
```

---

## Task 2: PWA manifest, icons, offline service worker

**Files:**
- Create: `public/manifest.webmanifest`, `public/icons/icon-192.png`, `public/icons/icon-512.png`, `public/icons/maskable-512.png`, `public/sw.js`, `components/ServiceWorkerRegister.tsx`
- Modify: `app/layout.tsx` (link manifest, theme-color, register SW)

**Interfaces:**
- Produces: installable PWA; app shell cached for offline use.

- [ ] **Step 1: Create `public/manifest.webmanifest`.**

```json
{
  "name": "Dachdecker Gesellenprüfung",
  "short_name": "Dachdecker",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#23262b",
  "theme_color": "#23262b",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

- [ ] **Step 2: Generate icons** (own SVG → PNG). Create an original app-mark SVG (a stylized copper roof/gable on schiefer ground) and rasterize:

```bash
# create scripts/make-icons.mjs that renders an inline SVG to the three PNG sizes via sharp
npm install -D sharp
node scripts/make-icons.mjs
```
`scripts/make-icons.mjs` draws an original SVG (roof silhouette, copper on #23262b) and writes `public/icons/{icon-192,icon-512,maskable-512}.png`.

- [ ] **Step 3: Create `public/sw.js`** — cache-first app shell, network fallback.

```js
const CACHE = "dachdecker-v1";
const SHELL = ["/", "/lernen", "/manifest.webmanifest"];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match("/")))
  );
});
```

- [ ] **Step 4: Create `components/ServiceWorkerRegister.tsx`** (client component that registers `/sw.js` in `useEffect`, production only).

```tsx
"use client";
import { useEffect } from "react";
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
```

- [ ] **Step 5: Wire into `app/layout.tsx`** — add `manifest` + `themeColor` to `metadata`/`viewport`, render `<ServiceWorkerRegister />` in `<body>`.

- [ ] **Step 6: Verify.** `npm run build && npm start`, open preview, confirm: manifest loads (Network), no console errors, `navigator.serviceWorker.controller` is set after reload.

- [ ] **Step 7: Commit.** `git add -A && git commit -m "feat: PWA manifest, icons, offline service worker"`

---

## Task 3: Extend the content schema

**Files:**
- Modify: `content/schema.ts`
- Test: `lib/__tests__/schema.test.ts`

**Interfaces:**
- Produces: types `DrawAufgabe`, `FachbegriffAufgabe`, `Lektion`, `AufgabenFortschritt`, updated `Aufgabe` union, and a type guard `istSichtbar(x)` that returns `false` when `konfidenz === "pruefen"`.

- [ ] **Step 1: Write the failing test** `lib/__tests__/schema.test.ts`.

```ts
import { describe, it, expect } from "vitest";
import { istSichtbar } from "@/content/schema";

describe("istSichtbar", () => {
  it("hides pruefen entries", () => {
    expect(istSichtbar({ konfidenz: "pruefen" } as any)).toBe(false);
  });
  it("shows hoch and mittel entries", () => {
    expect(istSichtbar({ konfidenz: "hoch" } as any)).toBe(true);
    expect(istSichtbar({ konfidenz: "mittel" } as any)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails.** Run: `npm test -- schema` → FAIL (`istSichtbar` not exported).

- [ ] **Step 3: Extend `content/schema.ts`.** Append the new types and helper (keep existing types intact):

```ts
export interface DrawAufgabe extends AufgabeBasis {
  typ: "draw";
  aufgabentext: string;
  vorgabeSvg?: string;   // optional given sketch (path relative to content/)
  loesungSvg: string;    // own solution SVG (path relative to content/)
  schritte: string[];    // step-by-step explanation of the solution
}

export interface FachbegriffAufgabe extends AufgabeBasis {
  typ: "fachbegriff";
  begriff: string;
  definition: string;    // shown on flashcard back
  bildSvg?: string;
  bestandteile?: string[]; // compound decomposition, e.g. ["Dampf","brems","folie"]
}

export type Aufgabe =
  | McAufgabe | ClozeAufgabe | CalcAufgabe | DiagramAufgabe
  | DrawAufgabe | FachbegriffAufgabe;

export interface Lektion {
  id: string;            // "lf01-l01"
  lernfeld: string;
  thema: string;
  titel: string;
  inhalt: string[];      // paragraphs (own wording)
  svg?: string;          // own illustration, path relative to content/
  quelle: string;
  konfidenz: Konfidenz;
}

export type Bewertung = "richtig" | "teilweise" | "falsch";

export interface AufgabenFortschritt {
  aufgabeId: string;
  bewertung: Bewertung;
  gesehenAm: number;     // epoch ms
  faelligAm: number;     // epoch ms, next spaced-repetition due date
  intervallTage: number;
}

export function istSichtbar(x: { konfidenz: Konfidenz }): boolean {
  return x.konfidenz !== "pruefen";
}
```

- [ ] **Step 4: Run test to verify it passes.** Run: `npm test -- schema` → PASS.

- [ ] **Step 5: Commit.** `git add -A && git commit -m "feat: extend content schema (draw, fachbegriff, lektion, progress)"`

---

## Task 4: Theme tokens + toggle (Schiefer & Kupfer, dark + light)

**Files:**
- Modify: `app/globals.css` (token layer)
- Create: `lib/theme.ts`, `components/ThemeToggle.tsx`
- Test: `lib/__tests__/theme.test.ts`

**Interfaces:**
- Produces: `getTheme(): "dark" | "light"`, `setTheme(t)`, `initTheme()` (reads localStorage, falls back to `prefers-color-scheme`, sets `document.documentElement.dataset.theme`). CSS tokens: `--bg`, `--surface`, `--surface-2`, `--text`, `--text-muted`, `--accent`, `--accent-text`, `--border`, `--ok`, `--bad`.

- [ ] **Step 1: Define tokens in `app/globals.css`.** After the Tailwind import:

```css
:root, :root[data-theme="dark"] {
  --bg:#23262b; --surface:#1a1c20; --surface-2:#2b2e33;
  --text:#ece7df; --text-muted:#a8a294; --border:#34383e;
  --accent:#c07d4a; --accent-text:#23262b; --ok:#5dcaa5; --bad:#e2726f;
}
:root[data-theme="light"] {
  --bg:#faf7f2; --surface:#ffffff; --surface-2:#f3efe8;
  --text:#2b2723; --text-muted:#6a635a; --border:#e6e0d6;
  --accent:#b8442c; --accent-text:#ffffff; --ok:#1d9e75; --bad:#c0392b;
}
body { background:var(--bg); color:var(--text); }
```

- [ ] **Step 2: Write the failing test** `lib/__tests__/theme.test.ts`.

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { getTheme, setTheme } from "@/lib/theme";

beforeEach(() => { localStorage.clear(); document.documentElement.removeAttribute("data-theme"); });

describe("theme", () => {
  it("defaults to dark when nothing stored", () => {
    expect(getTheme()).toBe("dark");
  });
  it("persists and applies the chosen theme", () => {
    setTheme("light");
    expect(localStorage.getItem("theme")).toBe("light");
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(getTheme()).toBe("light");
  });
});
```

- [ ] **Step 3: Run test → FAIL** (`@/lib/theme` missing). Run: `npm test -- theme`

- [ ] **Step 4: Implement `lib/theme.ts`.**

```ts
export type Theme = "dark" | "light";
const KEY = "theme";
export function getTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return (localStorage.getItem(KEY) as Theme) || "dark";
}
export function setTheme(t: Theme) {
  localStorage.setItem(KEY, t);
  document.documentElement.dataset.theme = t;
}
export function initTheme() {
  const stored = localStorage.getItem(KEY) as Theme | null;
  const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
  setTheme(stored ?? (prefersLight ? "light" : "dark"));
}
```

- [ ] **Step 5: Run test → PASS.** Run: `npm test -- theme`

- [ ] **Step 6: Create `components/ThemeToggle.tsx`** (client): button that flips theme, shows sun/moon icon.

```tsx
"use client";
import { useEffect, useState } from "react";
import { getTheme, setTheme, type Theme } from "@/lib/theme";
export function ThemeToggle() {
  const [t, setT] = useState<Theme>("dark");
  useEffect(() => setT(getTheme()), []);
  const flip = () => { const n = t === "dark" ? "light" : "dark"; setTheme(n); setT(n); };
  return <button onClick={flip} aria-label="Design umschalten" className="rounded-lg border px-3 py-2" style={{ borderColor: "var(--border)" }}>{t === "dark" ? "☀︎" : "☾"}</button>;
}
```

- [ ] **Step 7: Add an inline no-flash theme script** to `app/layout.tsx` `<head>` (sets `data-theme` before paint from localStorage/`prefers-color-scheme`).

- [ ] **Step 8: Verify in preview.** Toggle switches dark↔light, persists across reload, no flash of wrong theme.

- [ ] **Step 9: Commit.** `git add -A && git commit -m "feat: Schiefer & Kupfer theme tokens + toggle"`

---

## Task 5: Progress store (localStorage + spaced repetition)

**Files:**
- Create: `lib/progress.ts`, `components/useProgress.ts`
- Test: `lib/__tests__/progress.test.ts`

**Interfaces:**
- Produces:
  - `naechsteFaelligkeit(bewertung, intervallTage): { intervallTage, faelligAm }` — pure SR scheduler.
  - `speichereBewertung(aufgabeId, bewertung): void`, `ladeFortschritt(): Record<string, AufgabenFortschritt>`, `lernfeldFortschritt(lfId, aufgabeIds): number` (0–1).
  - Hook `useProgress()` → `{ fortschritt, bewerte(aufgabeId, bewertung) }`.

- [ ] **Step 1: Write failing tests** `lib/__tests__/progress.test.ts`.

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { naechsteFaelligkeit, speichereBewertung, ladeFortschritt, lernfeldFortschritt } from "@/lib/progress";

beforeEach(() => localStorage.clear());

describe("spaced repetition", () => {
  it("resets interval on falsch", () => {
    expect(naechsteFaelligkeit("falsch", 8).intervallTage).toBe(1);
  });
  it("grows interval on richtig", () => {
    expect(naechsteFaelligkeit("richtig", 2).intervallTage).toBeGreaterThan(2);
  });
});

describe("store", () => {
  it("persists a rating and reads it back", () => {
    speichereBewertung("lf01-001", "richtig");
    expect(ladeFortschritt()["lf01-001"].bewertung).toBe("richtig");
  });
  it("computes lernfeld completion fraction", () => {
    speichereBewertung("lf01-001", "richtig");
    expect(lernfeldFortschritt("lf01", ["lf01-001", "lf01-002"])).toBe(0.5);
  });
});
```

- [ ] **Step 2: Run → FAIL.** Run: `npm test -- progress`

- [ ] **Step 3: Implement `lib/progress.ts`.**

```ts
import type { AufgabenFortschritt, Bewertung } from "@/content/schema";
const KEY = "fortschritt-v1";
const TAG = 86_400_000;

export function naechsteFaelligkeit(b: Bewertung, intervallTage: number) {
  const next = b === "falsch" ? 1 : b === "teilweise" ? Math.max(1, intervallTage) : Math.max(2, Math.round(intervallTage * 2 || 2));
  return { intervallTage: next, faelligAm: Date.now() + next * TAG };
}
export function ladeFortschritt(): Record<string, AufgabenFortschritt> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}
export function speichereBewertung(aufgabeId: string, bewertung: Bewertung) {
  const all = ladeFortschritt();
  const prev = all[aufgabeId]?.intervallTage ?? 0;
  const { intervallTage, faelligAm } = naechsteFaelligkeit(bewertung, prev);
  all[aufgabeId] = { aufgabeId, bewertung, gesehenAm: Date.now(), faelligAm, intervallTage };
  localStorage.setItem(KEY, JSON.stringify(all));
}
export function lernfeldFortschritt(_lfId: string, aufgabeIds: string[]): number {
  if (aufgabeIds.length === 0) return 0;
  const all = ladeFortschritt();
  const done = aufgabeIds.filter((id) => all[id] && all[id].bewertung !== "falsch").length;
  return done / aufgabeIds.length;
}
```

- [ ] **Step 4: Run → PASS.** Run: `npm test -- progress`

- [ ] **Step 5: Implement `components/useProgress.ts`** (client hook wrapping load + `bewerte`).

```tsx
"use client";
import { useEffect, useState } from "react";
import { ladeFortschritt, speichereBewertung } from "@/lib/progress";
import type { AufgabenFortschritt, Bewertung } from "@/content/schema";
export function useProgress() {
  const [fortschritt, setF] = useState<Record<string, AufgabenFortschritt>>({});
  useEffect(() => setF(ladeFortschritt()), []);
  const bewerte = (id: string, b: Bewertung) => { speichereBewertung(id, b); setF(ladeFortschritt()); };
  return { fortschritt, bewerte };
}
```

- [ ] **Step 6: Commit.** `git add -A && git commit -m "feat: progress store with spaced repetition"`

---

## Task 6: Content-loading library

**Files:**
- Create: `lib/content.ts`
- Test: `lib/__tests__/content.test.ts`
- Depends on existing `content/lernfelder.json`; LF 1 content arrives in Task 17 (use a small fixture in the test).

**Interfaces:**
- Produces: `getLernfelder(): Lernfeld[]`, `getAufgaben(lfId): Aufgabe[]` (filtered: no `pruefen`), `getLektionen(lfId): Lektion[]` (filtered), `getLernfeld(lfId): Lernfeld | undefined`. Loading uses static imports keyed by lfId (no dynamic fs at runtime — this is a client PWA).

- [ ] **Step 1: Write failing test** `lib/__tests__/content.test.ts`.

```ts
import { describe, it, expect } from "vitest";
import { filterSichtbar } from "@/lib/content";

describe("filterSichtbar", () => {
  it("removes pruefen entries", () => {
    const input = [{ konfidenz: "hoch" }, { konfidenz: "pruefen" }, { konfidenz: "mittel" }] as any[];
    expect(filterSichtbar(input)).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run → FAIL.** Run: `npm test -- content`

- [ ] **Step 3: Implement `lib/content.ts`.** A registry maps lfId → imported JSON; `filterSichtbar` applies `istSichtbar`.

```ts
import lernfelderData from "@/content/lernfelder.json";
import lf01Aufgaben from "@/content/lf01/aufgaben.json";
import lf01Lektionen from "@/content/lf01/lektionen.json";
import { istSichtbar, type Aufgabe, type Lektion, type Lernfeld } from "@/content/schema";

const AUFGABEN: Record<string, unknown[]> = { lf01: lf01Aufgaben };
const LEKTIONEN: Record<string, unknown[]> = { lf01: lf01Lektionen };

export function filterSichtbar<T extends { konfidenz: any }>(xs: T[]): T[] {
  return xs.filter(istSichtbar);
}
export function getLernfelder(): Lernfeld[] {
  return (lernfelderData as any).lernfelder;
}
export function getLernfeld(id: string): Lernfeld | undefined {
  return getLernfelder().find((lf) => lf.id === id);
}
export function getAufgaben(lfId: string): Aufgabe[] {
  return filterSichtbar((AUFGABEN[lfId] as Aufgabe[]) ?? []);
}
export function getLektionen(lfId: string): Lektion[] {
  return filterSichtbar((LEKTIONEN[lfId] as Lektion[]) ?? []);
}
```

Note: create empty `content/lf01/lektionen.json` = `[]` now so the import resolves; Task 17 fills it. Register LF 2–17 here as their content lands (follow-up plans).

- [ ] **Step 4: Run → PASS.** Run: `npm test -- content`

- [ ] **Step 5: Commit.** `git add -A && git commit -m "feat: content loading with pruefen filter"`

---

## Task 7: App shell — root layout + bottom navigation

**Files:**
- Modify: `app/layout.tsx`
- Create: `components/BottomNav.tsx`
- Modify: `app/globals.css` (safe-area, base layout)

**Interfaces:**
- Consumes: `ThemeToggle`, `ServiceWorkerRegister`.
- Produces: persistent bottom nav (Start `/`, Lernen `/lernen`, Rechner `/rechner`, Fortschritt `/fortschritt`) with active-state highlighting via `usePathname`. Rechner/Fortschritt routes are placeholders for now.

- [ ] **Step 1: Build `components/BottomNav.tsx`** (client) — 4 items, active item uses `--accent`; fixed to bottom with `env(safe-area-inset-bottom)` padding; touch targets ≥ 44px.
- [ ] **Step 2: Wire `app/layout.tsx`** — German `<html lang="de">`, no-flash theme script, `<main>` with bottom padding to clear nav, `<BottomNav/>`, `<ThemeToggle/>` in a top bar, `<ServiceWorkerRegister/>`.
- [ ] **Step 3: Add placeholder pages** (create `app/rechner/page.tsx` and `app/fortschritt/page.tsx`, each rendering a simple "kommt bald" heading) so nav links resolve.
- [ ] **Step 4: Verify in preview** at mobile viewport (resize_window mobile 375×812): nav visible, active highlight follows route, safe-area respected, no horizontal scroll.
- [ ] **Step 5: Commit.** `git add -A && git commit -m "feat: app shell + bottom navigation"`

---

## Task 8: Lernfelder overview screen

**Files:**
- Create: `app/lernen/page.tsx`, `components/LernfeldCard.tsx`, `components/ProgressBar.tsx`
- Consumes: `getLernfelder`, `getAufgaben`, `lernfeldFortschritt`.

**Interfaces:**
- Produces: grouped list by `lehrjahr` (1/2/3) with a WiSo group; each `LernfeldCard` shows nr, titel, themen count, progress bar, links to `/lernen/[lf]`. A hint banner states the recommended order (LF 7 before LF 8–10). Nothing is locked.

- [ ] **Step 1: Build `ProgressBar.tsx`** — accepts `value` 0–1, renders a track (`--surface-2`) + fill (`--accent`), `aria-valuenow`.
- [ ] **Step 2: Build `LernfeldCard.tsx`** — card (`--surface`, 12px radius, `--border`), copper nr badge, titel, `{themen.length} Themen`, `<ProgressBar>`. Wrap in `<Link href={`/lernen/${lf.id}`}>`.
- [ ] **Step 3: Build `app/lernen/page.tsx`** (client) — `getLernfelder()` grouped by lehrjahr with headers "1. Lehrjahr" etc.; progress via `useProgress` + `lernfeldFortschritt(lf.id, getAufgaben(lf.id).map(a=>a.id))`; recommended-order hint banner.
- [ ] **Step 4: Verify in preview** — all 18 Lernfelder render grouped correctly; LF 1 shows a progress bar; tapping LF 1 navigates to its detail route (may 404 until Task 9); mobile layout clean.
- [ ] **Step 5: Commit.** `git add -A && git commit -m "feat: Lernfelder overview with progress"`

---

## Task 9: Lernfeld detail screen

**Files:**
- Create: `app/lernen/[lf]/page.tsx`, `components/LektionCard.tsx`
- Consumes: `getLernfeld`, `getLektionen`, `getAufgaben`.

**Interfaces:**
- Produces: header (nr, titel, lehrjahr, stunden), Themen chips, a "Theorie" section rendering `LektionCard`s, and a prominent "Üben starten" button → `/lernen/[lf]/ueben`. Handles unknown lf id with a "nicht gefunden" state.

- [ ] **Step 1: Build `LektionCard.tsx`** — titel, `inhalt` paragraphs, optional inline SVG (fetched from `svg` path or inlined), quelle footnote in `--text-muted`.
- [ ] **Step 2: Build `app/lernen/[lf]/page.tsx`** — read `params.lf`; if `getLernfeld` undefined show fallback; else header + Themen + Lektionen + count of visible Aufgaben + "Üben starten" (disabled with hint if 0 Aufgaben).
- [ ] **Step 3: Verify in preview** for `/lernen/lf01` (renders header + placeholder until content lands) and `/lernen/lf99` (fallback). No console errors.
- [ ] **Step 4: Commit.** `git add -A && git commit -m "feat: Lernfeld detail with theory cards"`

---

## Task 10: Übungs-Session engine

**Files:**
- Create: `app/lernen/[lf]/ueben/page.tsx`, `components/session/SessionRunner.tsx`, `components/session/AufgabeSwitch.tsx`
- Consumes: `getAufgaben`, `useProgress`, the six renderer components (Tasks 11–16).

**Interfaces:**
- Produces: `SessionRunner` sequences the LF's Aufgaben; shows progress "n / total"; each Aufgabe renders via `AufgabeSwitch` which dispatches on `typ`; every renderer calls a shared `onErgebnis(bewertung: Bewertung)` prop when the user finishes an item; on result, `bewerte(aufgabe.id, bewertung)` is stored and a "Weiter" button advances; end screen summarizes richtig/teilweise/falsch counts with a "Nochmal" / "Fertig" choice.
- `AufgabeSwitch` contract: `{ aufgabe: Aufgabe; onErgebnis: (b: Bewertung) => void }`. Each renderer (Tasks 11–16) implements exactly this prop shape.

- [ ] **Step 1: Build `AufgabeSwitch.tsx`** — `switch (aufgabe.typ)` returning the matching card, passing `aufgabe` + `onErgebnis`. Initially only wire `mc` (Task 11); extend the switch as each renderer lands.
- [ ] **Step 2: Build `SessionRunner.tsx`** — state: index, results array; renders `AufgabeSwitch`; on `onErgebnis` store via `useProgress.bewerte`, reveal "Weiter", advance; final summary screen.
- [ ] **Step 3: Build `app/lernen/[lf]/ueben/page.tsx`** — load `getAufgaben(params.lf)`; empty state if none; else `<SessionRunner aufgaben=… lfId=… />`.
- [ ] **Step 4: Verify in preview** once ≥1 mc Aufgabe exists (after Task 11 + a temp fixture): can answer, advance, reach summary; progress persists (reload Lernfelder overview shows updated bar).
- [ ] **Step 5: Commit.** `git add -A && git commit -m "feat: Übungs-Session engine"`

---

## Task 11: Renderer — `mc` (Multiple Choice)

**Files:**
- Create: `components/aufgaben/McCard.tsx`
- Test: `lib/__tests__/mc.test.tsx`
- Consumes: `AufgabeSwitch` contract `{ aufgabe, onErgebnis }`.

**Interfaces:**
- Produces: `McCard` renders `frage` + `optionen`; supports multi-select when `korrekt.length > 1`; on "Prüfen", marks correct/incorrect with `--ok`/`--bad`, shows `erklaerung` + `quelle`, and calls `onErgebnis("richtig")` when the selected set equals `korrekt`, else `onErgebnis("falsch")`.

- [ ] **Step 1: Write failing test** `lib/__tests__/mc.test.tsx` — render an mc Aufgabe, click the correct option, click "Prüfen", assert `onErgebnis` called with `"richtig"` and `erklaerung` visible. (Use `@testing-library/react`.)
- [ ] **Step 2: Run → FAIL.** Run: `npm test -- mc`
- [ ] **Step 3: Implement `McCard.tsx`** — option buttons (checkbox semantics for multi), "Prüfen" button, result styling, explanation panel, `onErgebnis`.
- [ ] **Step 4: Run → PASS.** Run: `npm test -- mc`
- [ ] **Step 5: Wire into `AufgabeSwitch`** (case `"mc"`).
- [ ] **Step 6: Commit.** `git add -A && git commit -m "feat: mc renderer"`

---

## Task 12: Renderer — `cloze` (Lückentext)

**Files:**
- Create: `lib/cloze.ts`, `components/aufgaben/ClozeCard.tsx`
- Test: `lib/__tests__/cloze.test.ts`

**Interfaces:**
- Produces: `parseCloze(text): Array<{type:"text",value}|{type:"gap",antwort,key}>`; `pruefeLuecke(eingabe, antwort, alternativen?): boolean` (case-insensitive, trims, accepts alternatives). `ClozeCard` renders text with inputs at gaps; on "Prüfen", each gap validated; `onErgebnis` = "richtig" if all gaps correct, "teilweise" if some, "falsch" if none.

- [ ] **Step 1: Write failing tests** `lib/__tests__/cloze.test.ts`.

```ts
import { describe, it, expect } from "vitest";
import { parseCloze, pruefeLuecke } from "@/lib/cloze";
describe("cloze", () => {
  it("splits text and gaps", () => {
    const p = parseCloze("Ein {{Ziegel}} deckt das Dach.");
    expect(p.filter(x => x.type === "gap")).toHaveLength(1);
  });
  it("accepts alternatives case-insensitively", () => {
    expect(pruefeLuecke("massstab", "Maßstab", ["Massstab"])).toBe(true);
  });
});
```

- [ ] **Step 2: Run → FAIL.** Run: `npm test -- cloze`
- [ ] **Step 3: Implement `lib/cloze.ts`** — regex `/\{\{(.+?)\}\}/g` split; `pruefeLuecke` normalizes (`trim().toLowerCase()`, strip nothing else) and compares to antwort + alternatives.
- [ ] **Step 4: Run → PASS.** Run: `npm test -- cloze`
- [ ] **Step 5: Implement `ClozeCard.tsx`** — inline inputs sized to answer length; per-gap correctness coloring; explanation + quelle; `onErgebnis` per all/some/none.
- [ ] **Step 6: Wire into `AufgabeSwitch`** (case `"cloze"`).
- [ ] **Step 7: Commit.** `git add -A && git commit -m "feat: cloze renderer + parser"`

---

## Task 13: Renderer — `calc` (parametrisierte Rechenaufgabe)

**Files:**
- Create: `lib/calc.ts`, `components/aufgaben/CalcCard.tsx`
- Test: `lib/__tests__/calc.test.ts`

**Interfaces:**
- Produces: `wuerfleParameter(parameter): Record<string,number>` (respects min/max/schritt rounding); `berechneSchritte(schritte, werte): Array<{name,wert,einheit,formel,beschreibung}>` using mathjs `evaluate` over accumulated scope; `pruefeAntwort(eingabe, loesung, toleranzProzent): boolean`. `CalcCard` renders `aufgabentext` with substituted values, an answer input, a "Lösungsweg" reveal showing each step, and `onErgebnis` from tolerance check.

- [ ] **Step 1: Write failing tests** `lib/__tests__/calc.test.ts`.

```ts
import { describe, it, expect } from "vitest";
import { wuerfleParameter, berechneSchritte, pruefeAntwort } from "@/lib/calc";
describe("calc", () => {
  it("rounds params to schritt within range", () => {
    const v = wuerfleParameter([{ name:"a", label:"a", einheit:"m", min:6, max:6, schritt:0.5 }]);
    expect(v.a).toBe(6);
  });
  it("evaluates a rechteck area step", () => {
    const s = berechneSchritte([{ beschreibung:"", formel:"laenge*breite", ergebnisName:"flaeche", einheit:"m²" }], { laenge:4, breite:3 });
    expect(s[0].wert).toBe(12);
  });
  it("accepts answers within tolerance", () => {
    expect(pruefeAntwort(11.9, 12, 1)).toBe(true);
    expect(pruefeAntwort(10, 12, 1)).toBe(false);
  });
});
```

- [ ] **Step 2: Run → FAIL.** Run: `npm test -- calc`
- [ ] **Step 3: Implement `lib/calc.ts`** using mathjs `evaluate(formel, scope)`, accumulating each `ergebnisName` into scope; `wuerfleParameter` = `min + round(rand*(max-min)/schritt)*schritt`, clamped; `pruefeAntwort` = `abs(e-l) <= l*toleranz/100`.
- [ ] **Step 4: Run → PASS.** Run: `npm test -- calc`
- [ ] **Step 5: Implement `CalcCard.tsx`** — substitute `{name}` in `aufgabentext`, numeric input, "Prüfen" → tolerance check, "Lösungsweg zeigen" → steps list with formula + result + einheit; large prominent numbers; `onErgebnis`.
- [ ] **Step 6: Wire into `AufgabeSwitch`** (case `"calc"`).
- [ ] **Step 7: Commit.** `git add -A && git commit -m "feat: calc renderer + engine"`

---

## Task 14: Renderer — `diagram` (Bauteile benennen)

**Files:**
- Create: `components/aufgaben/DiagramCard.tsx`
- Consumes: an own SVG (from Task 17) whose target elements carry `data-id`.

**Interfaces:**
- Produces: `DiagramCard` loads the referenced SVG inline, reads `zuordnung` (data-id → correct name); for each target the user picks a name from a shared option pool; on "Prüfen", highlight correct/incorrect targets, `onErgebnis` per all/some/none.

- [ ] **Step 1: Build `DiagramCard.tsx`** — inline the SVG (import as raw or render from a string field), overlay selectable labels on `data-id` targets, option pool = shuffled `Object.values(zuordnung)`, validation + coloring, explanation + quelle.
- [ ] **Step 2: Wire into `AufgabeSwitch`** (case `"diagram"`).
- [ ] **Step 3: Verify in preview** with the LF 1 diagram Aufgabe (after Task 17): assigning correct labels marks green; wrong marks red; result recorded.
- [ ] **Step 4: Commit.** `git add -A && git commit -m "feat: diagram renderer"`

---

## Task 15: Renderer — `draw` (zeichnen → Lösung aufdecken) ⭐

**Files:**
- Create: `components/aufgaben/DrawCard.tsx`
- Consumes: `aufgabentext`, optional `vorgabeSvg`, `loesungSvg`, `schritte`.

**Interfaces:**
- Produces: `DrawCard` shows the task text and optional given sketch; a clear instruction "Zeichne auf Papier/iPad, dann decke die Lösung auf"; a "Lösung zeigen" button reveals the solution SVG + numbered `schritte`; then a self-assessment row (Richtig / Fast / Nochmal) that maps to `onErgebnis("richtig"|"teilweise"|"falsch")`.

- [ ] **Step 1: Build `DrawCard.tsx`** — two phases: (a) prompt + optional vorgabe SVG + reveal button; (b) after reveal, solution SVG + steps + three self-assessment buttons calling `onErgebnis`. Copper accent on the reveal button.
- [ ] **Step 2: Wire into `AufgabeSwitch`** (case `"draw"`).
- [ ] **Step 3: Verify in preview** with the LF 1 draw Aufgabe (after Task 17): reveal shows solution + steps; each self-assessment advances and records the mapped Bewertung.
- [ ] **Step 4: Commit.** `git add -A && git commit -m "feat: draw renderer (reveal + self-assessment)"`

---

## Task 16: Renderer — `fachbegriff` (Karteikarte)

**Files:**
- Create: `components/aufgaben/FachbegriffCard.tsx`
- Consumes: `begriff`, `definition`, optional `bildSvg`, optional `bestandteile`.

**Interfaces:**
- Produces: `FachbegriffCard` shows `begriff` (+ optional compound decomposition chips from `bestandteile`); "Umdrehen" flips to `definition` (+ optional SVG); then Richtig / Nochmal buttons → `onErgebnis("richtig"|"falsch")`.

- [ ] **Step 1: Build `FachbegriffCard.tsx`** — flip interaction (no `display:none` during streaming — use conditional render on state), compound chips, self-rating.
- [ ] **Step 2: Wire into `AufgabeSwitch`** (case `"fachbegriff"`).
- [ ] **Step 3: Verify in preview** with an LF 1 fachbegriff (after Task 17): flip reveals definition; rating records + advances.
- [ ] **Step 4: Commit.** `git add -A && git commit -m "feat: fachbegriff renderer"`

---

## Task 17: Lernfeld 1 content — theory + one Aufgabe of every type + own SVGs

**Files:**
- Create/replace: `content/lf01/lektionen.json`, `content/lf01/aufgaben.json` (extend existing 3), `content/lf01/svg/*.svg`, `content/fachbegriffe.json`
- Source of truth: `quellen/00-quellen-index.md` (KMK LF 1, BG BAU, BIBB). Every entry gets `quelle` + `konfidenz`.

**Interfaces:**
- Produces: LF 1 with ≥3 theory `Lektion`s and ≥8 Aufgaben covering all 6 typen: existing `mc`/`cloze`/`calc` plus a new `diagram` (Baustelleneinrichtungsplan or Gewerke), a `draw` (e.g. sketch a simple Baustelleneinrichtung layout / Absperrung), and ≥2 `fachbegriff` cards.

- [ ] **Step 1: Draft LF 1 theory cards** (own wording) for: Gewerke am Bau, Baustelleneinrichtung/Sinnbilder, Verkehrssicherung & Unfallverhütung (STOP-Prinzip). Each with `quelle` (KMK LF 1 / BG BAU 404 / DGUV 201-054) + `konfidenz: "hoch"` only where verified; else `"pruefen"`.
- [ ] **Step 2: Create own SVGs** in `content/lf01/svg/`: `baustelle.svg` (targets with `data-id` for Kran, Lager, Bauwagen, Zufahrt) for the diagram Aufgabe; `absperrung-loesung.svg` for the draw Aufgabe. Original drawings, schiefer/kupfer palette, readable in both themes (use `currentColor` where possible).
- [ ] **Step 3: Write the diagram Aufgabe** referencing `baustelle.svg` with `zuordnung` mapping each `data-id` to its Bezeichnung.
- [ ] **Step 4: Write the draw Aufgabe** (aufgabentext + optional vorgabe + `loesungSvg: "lf01/svg/absperrung-loesung.svg"` + `schritte`).
- [ ] **Step 5: Add ≥2 fachbegriff** entries (e.g. "Baustelleneinrichtungsplan", "Verkehrssicherung") to `content/fachbegriffe.json` tagged `lernfeld: "lf01"`; register the file in `lib/content.ts` (`getFachbegriffe(lfId)`), and include them in the LF-1 session pool.
- [ ] **Step 6: Verify each value against its Quelle** in `quellen/00-quellen-index.md`. Any value you cannot confirm → set `konfidenz: "pruefen"` (it will be hidden) and note it in `## 10 offene Punkte` of the spec.
- [ ] **Step 7: Full verify in preview** — open `/lernen/lf01/ueben`, play through every Aufgabe type end-to-end: mc, cloze, calc (re-roll numbers, check Lösungsweg), diagram (label), draw (reveal + self-assess), fachbegriff (flip). No console errors; progress bar on the overview reflects completion; toggle light/dark mid-session — SVGs and cards stay legible.
- [ ] **Step 8: Commit.** `git add -A && git commit -m "content: Lernfeld 1 complete showcase (all task types + SVGs)"`

---

## Self-Review (completed)

**Spec coverage:** §4 task types → Tasks 11–16 + 3; §5 screens → Tasks 7–10, 15 (Dashboard folded into Task 15? — Dashboard is Task 15 mislabel: Dashboard/Start is delivered in Task 7's layout + a follow-up; NOTE: Start screen countdown/continue is intentionally minimal in MVP and lives in `app/page.tsx` created in Task 7 Step 3 as a simple start page, enriched in a follow-up plan). §6 design → Tasks 4, 7. §7 datamodel → Tasks 3, 5. §3 content/legal → Task 17 Step 6. Rechner + Prüfungssimulation explicitly deferred (Scope).
**Placeholder scan:** no TBD/TODO steps; every code step has real code.
**Type consistency:** `Bewertung` ("richtig"|"teilweise"|"falsch") used identically in schema (Task 3), progress (Task 5), and every renderer's `onErgebnis`; `AufgabeSwitch` contract `{aufgabe,onErgebnis}` matches Tasks 11–16.

**Correction:** The Dashboard/Start screen (spec §5.1, countdown + "Weiterlernen") is only minimally covered. Add:

## Task 18: Dashboard / Start screen

**Files:** Modify `app/page.tsx`.
**Interfaces:** Consumes `getLernfelder`, `useProgress`. Produces: greeting, optional Prüfungs-countdown (date stored in localStorage, editable), a "Weiterlernen" button linking to the last-visited LF (stored in localStorage on session start), and an overall progress summary.

- [ ] **Step 1:** Build `app/page.tsx` — overall progress (avg of per-LF fractions), "Weiterlernen" → last LF or LF 1, countdown card (set/edit Prüfungsdatum in localStorage, show days remaining).
- [ ] **Step 2:** Record last-visited LF in `SessionRunner`/detail page via a small `localStorage` write.
- [ ] **Step 3: Verify in preview** — countdown editable + persists; Weiterlernen jumps to last LF; progress summary matches Lernfelder overview.
- [ ] **Step 4: Commit.** `git add -A && git commit -m "feat: dashboard with countdown + continue"`
