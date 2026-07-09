# MIT Badge Generation — Monorepo

Credential co-writer: paste course content, get Open Badge v3 suggestions
(name, description, criteria in 23 languages) plus a rendered badge image.

Formerly three standalone repositories, merged here with full git history:

| Directory    | Former repo                          | What it is                                              |
|--------------|--------------------------------------|---------------------------------------------------------|
| `frontend/`  | mit-badge-front-end                  | Next.js 15 UI (static export served by nginx)           |
| `slm/`       | mit-slm                              | FastAPI + Ollama (phi-4-mini) — badge metadata + SSE     |
| `image-gen/` | mit-badge-image-generation           | FastAPI + Pillow — layered badge image composition       |

```
frontend ──course text──> slm ──render request──> image-gen
   ^                        │
   └──SSE badge stream──────┘        (Ollama phi-4-mini sidecar for slm)
```

## Prerequisites

- Docker + Docker Compose
- The model weights (not committed — 2.4 GB). Download once:

```bash
curl -L -o slm/models/Phi-4-mini-instruct_Q4_K_M.gguf \
  "https://huggingface.co/unsloth/Phi-4-mini-instruct-GGUF/resolve/main/Phi-4-mini-instruct-Q4_K_M.gguf"
```

The `ollama` image bakes this file in at build time via `slm/models/Modelfile`.

## Run

```bash
cp env.example .env        # adjust origins/ports for your deployment
docker compose up --build -d
```

- Frontend: http://localhost:3000
- SLM API: http://localhost:8000 (docs at `/docs`)
- Image API: http://localhost:3001 (docs at `/docs`)

## Configuration

All cross-service URLs and CORS origins are env-driven — see `env.example`.
The only value baked at build time is `NEXT_PUBLIC_API_BASE_URL` (the
frontend is a static export; rebuild the frontend image to change it).

CORS note: both APIs use an explicit origin allowlist (`CORS_ORIGINS_STR`).
A wildcard origin is invalid with credentialed requests — set the real
frontend origin(s) for any non-local deployment.

## Per-service docs

Each directory keeps its original README with full API references:
[frontend/README.md](frontend/README.md) ·
[slm/README.md](slm/README.md) ·
[image-gen/README.md](image-gen/README.md)

Release audit (security/quality findings and their status): [AUDIT.md](AUDIT.md)
