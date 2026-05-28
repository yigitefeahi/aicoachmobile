# Operations (production-oriented)

## Secrets

- Store `JWT_SECRET`, `OPENAI_API_KEY`, and database credentials in your host’s **secret manager** (e.g. cloud provider vault, Doppler, 1Password) — not in git.
- Rotate `JWT_SECRET` only with a **logout-all-users** plan (invalidates existing tokens).

## Database

- **SQLite** is fine for demos; use **PostgreSQL** (or similar) for concurrent writes and backups.
- **Backups**: nightly logical dumps (`pg_dump`) or managed automated backups; test restore quarterly.
- **Migrations**: prefer Alembic (or equivalent) once you evolve schema beyond `create_all`.

## Redis (optional)

- Set `REDIS_URL=redis://...` so rate limits are **shared across app instances**.
- Without Redis, `RATE_LIMIT_PERSIST` uses the app database; still single-DB friendly.

## Uptime / SLA

- Define internal targets (e.g. 99.5% API monthly) and alert on **5xx rate**, **latency p95**, and **OpenAI error rate**.
- Structured logs: use `X-Request-ID` (set by middleware) to correlate client ↔ server.

## Reverse proxy

- Terminate TLS at nginx/Traefik; set `AUTH_COOKIE_SECURE=true` and forward `X-Forwarded-*` headers to Uvicorn.

## Frontend

- Deploy Next.js behind HTTPS; keep `NEXT_PUBLIC_API_BASE` aligned with the public API URL.
- Tighten **Content-Security-Policy** gradually (dev often needs relaxed `script-src`).

## SLA template (fill in)

| Service | Target availability | Owner | Escalation |
|---------|---------------------|-------|------------|
| API | e.g. 99.5% | TBD | TBD |
| OpenAI | vendor SLA | N/A | fallback messaging |
