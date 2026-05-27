# IScheduler — iMessage Scheduler

A local-first fullstack iMessage scheduler. Schedule outbound iMessages from a browser UI. A backend stores messages, a worker processes them as a FIFO queue with a configurable send rate, and a local gateway sends messages via the signed-in macOS iMessage account.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS |
| Backend API | Fastify + Zod + TypeScript |
| Database | Postgres (via Prisma) |
| Queue | Redis + BullMQ |
| Gateway | Node.js local service (mock or AppleScript adapter) |
| Monorepo | pnpm workspaces + Turborepo |

## Monorepo Structure

```
apps/
  web/       React scheduling UI + dashboard
  api/       Fastify REST API + Prisma
  worker/    BullMQ delivery worker
  gateway/   Local iMessage gateway
packages/
  shared/    Shared types, Zod schemas, status enum + transitions
  database/  Prisma schema + generated client
docker-compose.yml
pnpm-workspace.yaml
```

## Getting Started

### 1. Prerequisites

- Node.js >= 18
- pnpm >= 10
- Docker + Docker Compose

### 2. Setup

```bash
cp .env.example .env
docker compose up -d
pnpm install
pnpm db:migrate
pnpm dev
```

This starts all four services concurrently:

| Service | Port |
|---|---|
| Web UI | http://localhost:5173 |
| API | http://localhost:3333 |
| Gateway | http://localhost:4000 |
| Worker | (background process) |

API docs (Swagger UI) are available at http://localhost:3333/docs.

## Environment Variables

Copy `.env.example` to `.env` and adjust as needed.

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | postgresql://postgres:postgres@localhost:5432/app | Postgres connection string |
| `REDIS_URL` | redis://localhost:6379 | Redis connection string |
| `GATEWAY_ADAPTER` | `mock` | Gateway adapter: `mock` or `applescript` |
| `GATEWAY_PORT` | `4000` | Gateway service port |
| `GATEWAY_URL` | http://localhost:4000 | Worker → Gateway URL |
| `API_STATUS_CALLBACK_URL` | http://localhost:3333/api/gateway/status | Gateway → API callback |
| `SEND_INTERVAL_MS` | `60000` | Rate limit: ms between sends (demo=60s, prod=3600000) |
| `WORKER_CONCURRENCY` | `1` | BullMQ worker concurrency |
| `WORKER_ATTEMPTS` | `3` | Max retry attempts on failure |
| `WORKER_BACKOFF_MS` | `30000` | Initial exponential backoff delay (ms) |
| `MOCK_FAILURE_RATE` | `0` | Float 0–1; probability mock adapter simulates failure |
| `VITE_API_URL` | http://localhost:3333 | Web → API base URL |

### Demo Mode (fast sends)

The default `.env.example` is already configured for demo mode:

```env
SEND_INTERVAL_MS=60000   # 1 message per minute
GATEWAY_ADAPTER=mock
```

For production-like rate limiting use `SEND_INTERVAL_MS=3600000` (1 message/hour).

## AppleScript Gateway

To send real iMessages from your Mac:

1. Set `GATEWAY_ADAPTER=applescript` in `.env`.
2. Ensure **Messages.app** is open and signed into iMessage.
3. Grant **Terminal** (or whichever shell runs Node) Automation permissions:
   - System Settings → Privacy & Security → Automation → enable Terminal → Messages.
4. Run `pnpm dev` as normal.

> **Note:** The AppleScript adapter confirms the local send automation completed, but cannot verify final `DELIVERED`/`RECEIVED` status from Apple's servers. Those statuses are adapter-dependent (see Limitations).

## Message Status Flow

```
SCHEDULED → QUEUED → ACCEPTED → SENT → DELIVERED → RECEIVED
                  ↘            ↘      ↘
SCHEDULED → CANCELLED       FAILED ←─ QUEUED
```

Terminal states: `CANCELLED`, `FAILED`, `RECEIVED`.  
Only `SCHEDULED` messages can be cancelled by the user.

## Running Tests

```bash
# API tests (zod schemas, status transitions, service logic)
cd apps/api && pnpm test

# Worker tests (processor skip logic, gateway errors)
cd apps/worker && pnpm test
```

## Limitations

1. **DELIVERED / RECEIVED statuses** are adapter-dependent. The AppleScript adapter cannot read delivery receipts from Messages.app — these statuses will only appear if a future adapter (e.g. BlueBubbles) provides webhooks.

2. **No authentication.** This is a single-user local tool; there is no login or multi-user support.

3. **Local execution only.** Requires a macOS machine running Messages.app for real iMessage sends. The mock adapter works on any platform.

4. **BlueBubbles adapter** is not implemented. It is deferred as an optional stretch goal per the PRD. The adapter interface (`IMessageGateway`) is ready for it.

5. **Rate limit is global.** The `SEND_INTERVAL_MS` applies across all recipients. The PRD left open whether the limit should be per-sender or per-recipient.
