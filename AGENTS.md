# fsp-quality-of-life

Userscript for fsp.fpt.edu.vn / edunext. Svelte 5 + TypeScript + Vite + vite-plugin-monkey. pnpm, Node 22.

## Commands

No test suite exists. Verify changes in CI's order: `pnpm lint` → `pnpm check` → `pnpm build`.

- `pnpm check` — svelte-check plus a separate `tsc` pass over `vite.config.ts`; both must pass.
- `pnpm build` — emits the userscript to `dist/`.
- Formatting runs inside ESLint (prettier plugin), so use `pnpm lint:fix` — there is no standalone format script.
- CI is `workflow_dispatch` only (private repo, bills Actions minutes); it never runs on push.

## Architecture

One userscript targeting two host sites. `src/site.ts` derives `"fsp" | "edunext" | "unknown"` from the hostname.

- Entry `src/index.ts` auto-discovers every `src/scripts/*.ts` via `import.meta.glob`. Each script exports a default (optionally async) function and optionally `export const site` to restrict itself to one site. Nothing needs registering — drop in a file and it loads.
- Scripts initialize concurrently (`Promise.all`); the `NN-` filename prefixes do not sequence execution.
- `src/api.ts` is the typed client for `https://api.fpt.edu.vn/fsp/api`; the auth token is scraped at call time from localStorage / `<meta name="Authorization">` / cookie. DTOs live in `src/types/fsp.ts`.
- UI is Svelte 5 `mount()`ed into the host page; FSP styles ship as a `?inline` CSS import.
- Runtime secrets go through GM storage via `src/secrets.ts` (keys prefixed `fsp:`), not `.env`.

## Userscript quirks

- `vite.config.ts` owns match patterns, `run-at: document-start`, and the `grant` list — using a new `GM_*` API means adding it to `grant` or it's undefined at runtime.
- HMR is off (`hmr: false`). Dev flow: `pnpm dev`, install the served userscript once in Violentmonkey/Tampermonkey, then reload the portal page after each change.
- Both portals actively fight devtools; `00-devtools.ts` and `10-keybinds.ts` neutralize that at document-start.

## Workflow

- Conventional Commits (`feat:`, `fix:`, scoped e.g. `feat(events):`).
- Issues live in GitHub Issues (`thetommylong/fsp-improved`), managed via `gh` — see `docs/agents/issue-tracker.md`.
- Domain docs (`CONTEXT.md`, `docs/adr/`) are created lazily; proceed silently when absent — see `docs/agents/domain.md`.
