# Agent & contributor rules — WB Media Downloader

This document is the source of truth for humans and coding agents working in this repo.
Treat the result as **production-bound** code: readable, typed, cancelable, and honest about limitations.

## Project purpose

Client-side React app that, given a Wildberries article (`nm`):

1. loads product card metadata
2. resolves CDN hosts via route maps
3. previews photos, downloads selected photos as ZIP
4. downloads product video (HLS) and remuxes TS → MP4 in the browser

No backend remux, no stored secrets, no scraper that depends on browser session cookies.

## Quality bar

Every change should improve (or at least not regress):

| Criterion | Expectation |
|-----------|-------------|
| **Correctness** | Happy path + edge cases (no video, empty selection, abort, HTTP errors) |
| **Type safety** | Strict TypeScript; no `any`; no non-null assertions; prefer `type` over `interface` |
| **Boundaries** | Runtime guards at external API edges; pure builders for URL math |
| **Abortability** | Multi-step network work accepts `AbortSignal` and stops promptly |
| **Reliability** | Transient fetch failures retry (limited); user sees clear Russian messages |
| **Architecture** | FSD layers respected; no cyclic imports |
| **Dead surface** | No unused public exports/fields “for later” without a real consumer |
| **Tests** | Pure `shared/lib` and parsers covered by unit tests |
| **Style** | Match existing: no semicolons, single quotes, type-only imports, kebab-case files |

“It works” is not enough. Prefer small, reviewable diffs that raise the bar above.

## Feature-Sliced Design

```
app → pages → widgets → features → entities → shared
```

Rules:

1. **Import only downward** (or same slice). Never `shared` → `entities`/`features`, never `features` → `widgets`/`pages`.
2. **Public API only via** slice `index.ts`. Deep imports across slices are discouraged.
3. **UI is thin**: JSX in `ui/`; composition and side effects in `model/` hooks; pure logic in `lib/`.
4. **Server/async state** goes through **TanStack Query**:
   - `queryOptions` / `mutationOptions` factories as single source of truth
   - hierarchical query keys
   - `ensureQueryData` for dependent queries (card + upstreams → media)
5. **Entities** own domain assembly (`buildProductMedia`, types). **Features** own user actions (download photos/video, selection). **Widgets** compose features for screens.

## Media conventions (do not invent alternatives)

### Card

- Prefer public/proxied detail: `card.wb.ru` via Vite proxy `/api/wb/card` (CORS).
- Do not depend on `wildberries.ru/__internal/...` session endpoints unless the task explicitly requires it.

### CDN hosts

- Resolve hosts from `cdn.wbbasket.ru/api/v3/upstreams` route maps (`origin.*`, fallback `recommend.*`).
- Do not hardcode `basket-01`…`N` host lists.

### Photos

```
vol  = floor(nm / 1e5)
part = floor(nm / 1e3)
https://{host}/vol{vol}/part{part}/{nm}/images/{size}/{index}.webp
```

- UI preview size: `c246x328`
- Download size: `big`

### Video

```
vol  = nm % 144          // NOT floor(nm / 1e5)
part = floor(nm / 1e4)
https://{host}/vol{vol}/part{part}/{nm}/hls/{quality}/index.m3u8
```

- Probe qualities high → low: `1440p` → `1080p` → `720p`.
- Prefer HEAD; if HEAD is unreliable, fall back to GET of the **playlist only** (never probe by downloading all segments).
- Pipeline: m3u8 → concurrent TS segments → concat → **mux.js** remux → `.mp4` download.
- No server-side ffmpeg/remux in this project.

## Errors & async

1. Use `HttpError` for non-OK HTTP; map to user text via `toUserMessage` / `AppError` at feature or UI boundary.
2. User-facing strings: **Russian**, short, actionable. Technical detail may stay in `cause`.
3. Propagate `AbortSignal` through download ZIP/video and concurrency pool.
4. Abort on unmount / modal close while a download is pending.
5. Do not swallow errors silently. Do not use `console.log` in `src` (lint: only `warn`/`error`).
6. Mutations: `retry: 0` by default; retries live inside fetch helpers for individual resources.

## Code style

- TypeScript strict as configured in `tsconfig.app.json` (`noUncheckedIndexedAccess`, etc.).
- `import type` for type-only imports (verbatimModuleSyntax).
- Named exports preferred; default export only for app entry / Vite config if required.
- Filenames: `kebab-case.ts` / `PascalCase.tsx` for components.
- Prefer pure functions over classes for domain helpers.
- Comments explain **why**, not **what**. Link to gist/API notes when encoding non-obvious WB math.

## Testing

- Unit-test pure modules under `shared/lib` and parsers without network.
- Do not require full Ant Design mount for lib tests.
- Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` before considering work done.

## README honesty

When behavior or limitations change, update README sections:

1. approach to obtaining media and why
2. what we would finish for production (especially video)
3. limitations we hit

Do not claim production readiness for BFF, resume, or codec coverage that is not implemented.

## Out of scope (unless explicitly requested)

- Backend BFF, rate-limit proxy, PoW/anti-bot solving
- Storing credentials or scraping authenticated private data
- Large refactors that abandon FSD or TanStack Query
- Adding dependencies without a clear production need

## Useful commands

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm test
node scripts/probe-media.mjs
```

Example article with photos + video: `604174866`.
