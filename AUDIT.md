# Credit-Authoring App — Pre-Release Security & Quality Audit

**Date:** 2026-06-29
**Scope:** 3 repositories being prepared for public open-source release under the **MIT License** and transfer to the **MIT Digital Credentials Consortium (DCC)**.
**Reviewers:** 3 independent deep reviewers (one per repo) + orchestrator verification of every CRITICAL/HIGH finding against real `file:line`.
**Status of code:** **Unchanged at time of audit.** No commits, no pushes. This document is the review artifact.

---

## System overview

```
mit-badge-front-end  (Next.js 15 UI, "DCC Gen-AI UI" / Credential Co-writer)
        │  course text / PDF / DOCX  ->  SSE stream of badge suggestions
        v
mit-slm              (FastAPI + Ollama phi-4-mini GGUF; Open Badge v3 metadata;
        │            23-language output; proxies to renderer; LAiSER disabled here)
        v
mit-badge-image-gen  (FastAPI + Pillow; layered badge image composition -> base64 PNG)
```

External: an AWS-hosted **LAiSER API** (ESCO/OSN skill extraction) called directly from the front-end.

**Participants / issuers (legitimate — retained):** MIT, MIT DCC, WGU, eduNEXT, OneOrigin.
**Non-participants (flagged for removal — confirmed by owner):** ASU, SJSU.

**Overall verdict:** Architecture is sound; code is functional. **Not yet fit for a prestigious public release** — there are legal (font licensing), security (path traversal, SSRF, CORS, TLS-verify-disabled), and polish (dead code, disabled CI gates, example-domain URLs) issues to resolve first. None are architecturally fatal; all are fixable.

---

## Owner decisions (locked 2026-06-29)

| # | Decision | Choice |
|---|----------|--------|
| 1 | Proprietary Arial fonts | **Replace with Arimo** (SIL OFL-1.1, metric-identical -> zero visual change) |
| 2 | ASU & SJSU logos | **Remove** (not participants) |
| 3 | Exposed LAiSER key + AWS endpoint | **Document only** — owner handles key ownership/rotation with GWU/LAiSER separately |
| 4 | Execution | Implement all fixes on local feature branches + produce this AUDIT.md; **review per-repo diff before any commit/push** |

---

## Stop-ship blockers (verified)

### B1 — Proprietary fonts committed (LEGAL) · `mit-badge-image-gen`
`assets/fonts/Arial.ttf`, `assets/fonts/ArialBold.ttf`. Embedded metadata: *"This typeface is the property of Monotype Typography and its use by you is covered under the terms of a license agreement."* Arial **cannot** ship under MIT. Present in working tree and git history.
**Fix:** Replace with **Arimo** (SIL OFL-1.1 per the binaries' embedded name table — bundling-compatible with an MIT-licensed project; fonts stay under OFL, code under MIT). Repoint all references in `app/config.py`, `app/services/config_generator.py`, and docs. Old blobs leave history via the clean DCC migration (fresh initial commit).

### B2 — LAiSER key + AWS endpoint exposed (SECURITY) · `mit-badge-front-end` · **OWNER ACTION**
- `src/utils/laiser.ts:37` — `NEXT_PUBLIC_LAISER_API_KEY`; Next.js inlines `NEXT_PUBLIC_*` into client JS, so the key is readable in the deployed bundle and DevTools.
- `src/utils/laiser.ts:36`, `next.config.ts:34,38` — hardcoded fallback `https://uhao2r8hue.execute-api.us-east-1.amazonaws.com/dev` (commit `d22739b`, comment "the actual API endpoint").
Net: endpoint + key are publicly readable on the deployed site and in git history.
**Per owner decision #3 — DOCUMENT ONLY.** Code left unchanged this pass. **Recommended owner actions before public launch:** (a) rotate the LAiSER key with its owner; (b) treat the endpoint as known-public; (c) eventually move the call server-side so no key reaches the browser. The clean DCC migration removes it from *new* history, but a key that was ever public should be rotated regardless.

### B3 — Vulnerabilities reachable from public APIs (SECURITY)
| Vuln | Location | Note |
|------|----------|------|
| Path traversal / arbitrary file read | `image-gen core/layers/image.py:28` (absolute user path used directly), `core/utils/text.py:4` (user `font.path` -> `ImageFont.truetype`) | `POST /badge/generate` can reference `/etc/passwd` or `../../..` |
| SSRF | `image-gen app/services/web_color_scraper.py:400` (`session.get(institution_url)`, no scheme/IP allowlist); `mit-slm` proxy forwards unvalidated bodies | Can reach `169.254.169.254` AWS metadata |
| CORS `*` + `allow_credentials=True` | `mit-slm app/main.py:215-216`; manual `Access-Control-Allow-Origin:*` `badges.py:483`; image-gen wildcard default | Invalid+unsafe combination |
| Global TLS verification disabled | `mit-slm app/services/skill_extractor.py:12` (`ssl._create_default_https_context = ssl._create_unverified_context`) | Process-wide, even though LAiSER is disabled |

---

## mit-slm — findings

| Sev | Location | Issue | Fix | Status |
|-----|----------|-------|-----|--------|
| CRITICAL | `app/main.py:215-216` | CORS `allow_origins=["*"]` + `allow_credentials=True` | Explicit allowlist via env; or `allow_credentials=False` | planned |
| CRITICAL | `app/routers/badges.py:483` | SSE manually sets `Access-Control-Allow-Origin:*` per chunk | Remove; rely on middleware | planned |
| CRITICAL | `app/services/skill_extractor.py:12` | Global SSL verification disabled process-wide | Remove the override | planned |
| HIGH | `app/main.py:93-110` | Request headers (Authorization/Cookie/X-Api-Key) logged verbatim | Redact sensitive headers before logging | planned |
| HIGH | `app/main.py:77` | `while True: await asyncio.sleep(3600)` in cached `receive()` leaks a coroutine per request | Return `{"type":"http.disconnect"}` | planned |
| HIGH | `app/routers/badges.py` proxy + `app/models/requests.py:195` | `course_input` unbounded -> prompt/DoS; logo proxy unvalidated | `max_length` on input; size/type checks on logo proxy | planned |
| HIGH | `app/models/requests.py:198` | `context_length` unbounded -> Ollama OOM | `ge=256, le=32768` | planned |
| HIGH | `app/routers/badges.py:329,811,885` | OBv3 `image.id` hardcoded to an example domain (`https://example.com/...`) | `BADGE_ISSUER_URL` env | planned |
| MEDIUM | `app/routers/badges.py:37` | In-memory `badge_history` breaks under multi-worker | Document single-worker, or shared store | planned (doc) |
| MEDIUM | `.gitignore` | `*.env` misses `.env.local/.production` | Add `.env*`, `logs/` | planned |
| MEDIUM | `requirements.txt:24` | `lxml==4.9.3` (CVEs), only used by disabled scraper | Remove or bump `>=5` | planned |
| MEDIUM | `app/services/ollama_client.py:60` | `hash()` request IDs collide / non-deterministic | `uuid.uuid4()` | planned |
| LOW | `image_client_old.py`, `web_color_scraper_old.py`, `requirements_old.txt`, root `__init__.py` | Dead/duplicate files | Delete | planned |
| LOW | `app/routers/badges.py` (~120 lines), `main.py` | Large commented-out blocks | Delete | planned |
| LOW | `app/__init__.py:5` | `__author__ = "Badge Generator Team"` generic string | Real attribution | planned |

**Already good:** no real secrets in tree/history; CI uses `secrets.*`; base64 stripped from body logs; `RotatingFileHandler`; robust multilingual JSON extraction; no `eval/exec/pickle/yaml.load/subprocess`; `*.gguf` gitignored.

---

## mit-badge-image-gen — findings

| Sev | Location | Issue | Fix | Status |
|-----|----------|-------|-----|--------|
| CRITICAL | `assets/fonts/Arial*.ttf` | Proprietary Monotype font under MIT (B1) | Swap -> Arimo | planned |
| CRITICAL | `app/core/layers/image.py:25-34` | Path traversal (absolute + `../` user paths to `Image.open`) | `realpath` + assets-root prefix assertion | planned |
| CRITICAL | `app/core/utils/text.py:4-6` | User `font.path` -> `ImageFont.truetype` unguarded | Same assets-root guard | planned |
| CRITICAL | `app/services/web_color_scraper.py:400` | SSRF — fetches any `institution_url` | Block non-http(s), loopback, RFC-1918, link-local | planned |
| HIGH | `app/main.py` startup | No `Image.MAX_IMAGE_PIXELS` -> decompression-bomb DoS | Set `MAX_IMAGE_PIXELS=20_000_000` | planned |
| HIGH | `app/services/file_storage.py` | SVG accepted but unsanitized (XXE/XSS/SSRF if rendered) | PNG-only + magic-byte check | planned |
| HIGH | `app/settings.py:18` + `app/main.py:268` | CORS `*` default + `allow_credentials=True` | Restrictive default; drop credentials | planned |
| HIGH | `app/services/image_client.py:13` | Broken import `app.core.config` (no such module); deprecated dead file | Delete file | planned |
| HIGH | `app/services/web_color_scraper.py:293` | Bare `except:` swallows everything | `except Exception:` | planned |
| MEDIUM | `web_color_scraper.py` (11x) | `print()` in request path | `logger.*` | planned |
| MEDIUM | `app/core/layers/image.py:238` | Bare `except:` | `except Exception:` | planned |
| MEDIUM | `app/services/config_generator.py` / `app/models/requests.py:165` | `icon_name`/`shape` unvalidated | basename allowlist + `Literal` shape | planned |
| MEDIUM | `app/core/logging_config.py:176` | `log_badge_generation` may log base64 logo | Sanitize before `json.dumps` | planned |
| LOW | `gradio_main.py`, `app/json_editor.py` | Imports uninstalled gradio; not wired | Move to `tools/` dev-only or remove | planned |
| LOW | `app/controllers/badge_image.py` | Dead `tempfile` import + unused `temp_logo_path` | Remove | planned |
| LOW | `assets/logos/asu_logo.png`, `sjsu_logo.png`, `docs/assets/logos-guide.md:12-13` | Non-participant trademarks (decision #2) | Remove | planned |
| LOW | `requirements.txt` | `>=` lower-bounds only | Pin / lockfile | planned |

**Already good:** non-root Docker user; sensitive headers redacted; base64 stripped from logs; UUID logo filenames; `cleanup_temp_logo` prefix-guarded; `scale_factor` clamped; no `eval/pickle/yaml.load`; OpenSans/Roboto are open-licensed.

---

## mit-badge-front-end — findings

| Sev | Location | Issue | Fix | Status |
|-----|----------|-------|-----|--------|
| CRITICAL | `src/utils/laiser.ts:37` | `NEXT_PUBLIC_LAISER_API_KEY` shipped in bundle (B2) | **Document only** (decision #3) | doc-only |
| CRITICAL | `next.config.ts:8` | `typescript.ignoreBuildErrors:true` — type errors never block build | Remove; fix resulting errors | planned |
| CRITICAL | `next.config.ts:11` | `eslint.ignoreDuringBuilds:true` — lint never blocks | Remove; fix lint | planned |
| HIGH | `src/utils/laiser.ts:36`, `next.config.ts:34,38` | Hardcoded AWS API Gateway URL (B2) | **Document only** (decision #3) | doc-only |
| HIGH | `src/app/about/page.tsx:87` | `dangerouslySetInnerHTML` (fragile XSS pattern) | Typed JSX | planned |
| HIGH | `src/lib/api.ts:143` | `Access-Control-Allow-Origin:*` set as a *request* header (no-op/harmful) | Remove | planned |
| HIGH | `src/app/results/page.tsx:103`, `src/app/editor/page.tsx:457` | `.json()` called without `response.ok` check | Guard non-2xx | planned |
| HIGH | `src/app/editor/page.tsx` | 2,128 lines (>800 limit) | Extract sub-components | planned |
| MEDIUM | `src/utils/laiser.ts:98` | Unreachable `return 'Skill'` | Remove | planned |
| MEDIUM | `src/lib/api.ts`, `src/lib/types/index.ts` | `any` defeats type safety | `unknown` + discriminated unions | planned |
| MEDIUM | `src/hooks/use-api.ts` | Entire file dead (never imported) | Delete | planned |
| MEDIUM | `src/app/genai/page.tsx` | Dead redirect | Delete | planned |
| MEDIUM | `suggestion-card.tsx:39`, `src/app/page.tsx:105` | Lottie fetched from 3rd-party Webflow CDN | Vendor JSON to `/public` | planned |
| MEDIUM | `README.md:141,177,188` | Claims Prettier (none); links missing LICENSE; private org URL | Correct README | planned |
| LOW | `src/lib/api.ts:9` | Hardcoded `localhost:8001` fallback | Throw if env missing / document | planned |
| LOW | `src/app/results/page.tsx` | Legacy dead-end route | Remove or mark deprecated | planned |
| LOW | `package.json` | Unused Radix/util deps | `depcheck`/`knip` prune | planned |

**Already good:** no `.env*` ever committed; no real secret *values* in history; `rel="noopener noreferrer"` everywhere; `chart.tsx` `dangerouslySetInnerHTML` is CSS-only (safe); `.gitignore` covers `.env*`/`out`/`.next`/`node_modules`/`.vscode`; redux-persist excludes the `File` object; CI reads all vars from `secrets.*`; PDF worker self-hosted.

---

## Cross-cutting / release hygiene (all 3 repos)

1. **Add `LICENSE`** (MIT text, copyright holder per owner) to each repo.
2. **Add `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`** — standard for a DCC open-source handoff.
3. **Polished READMEs** with architecture diagram + screenshots/badge samples (the "git explanation with images" deliverable).
4. **Clean DCC migration:** create the new DCC repos with a **single clean initial commit** (no inherited history) -> automatically drops Arial blobs and the exposed LAiSER endpoint/key from the *new* public history. (Owner still rotates the key per B2.)

---

## Fix plan (this pass)

Per-repo feature branch `chore/dcc-open-source-prep`. Source edits only; build/lint verified; **no commit/push** until owner reviews each diff. LAiSER key/endpoint left **unchanged** (document-only). Then: LICENSE + README/images, final review, migration to DCC repos provided by owner.
