# iScheduler

A local-first iMessage scheduler. Schedule outbound iMessages from a browser UI — a backend stores your messages, a BullMQ worker processes them as a FIFO queue with a configurable send rate, and a local gateway delivers them from your macOS iMessage account.

## Architecture

```
React UI → API → Postgres (source of truth)
                      ↓
               BullMQ (Redis) schedules delayed job
                      ↓
               Worker processes jobs FIFO
                      ↓
               Gateway sends via adapter
                      ↓
               API receives status callback → Dashboard updates
```

### Apps & Packages

| Path | Description |
|---|---|
| `apps/web` | React + Vite scheduling UI and dashboard |
| `apps/api` | REST API (Fastify + Prisma) |
| `apps/worker` | BullMQ delivery worker |
| `apps/gateway` | Local iMessage gateway (`mock` or `applescript`) |
| `packages/database` | Prisma schema, migrations, and generated client |
| `packages/shared` | Shared types, Zod schemas, status enum |

## Getting Started

### Prerequisites

- Node.js ≥ 18
- pnpm 10+
- Docker & Docker Compose

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` if needed. The defaults work out of the box for local development.

### 3. Start infrastructure

Starts Postgres and Redis containers in the background.

```bash
docker compose up -d
```

### 4. Run database migrations

```bash
pnpm db:migrate
```

### 5. Start all services

```bash
pnpm dev
```

| Service | URL |
|---|---|
| Web UI | http://localhost:5173 |
| API | http://localhost:3333 |
| Gateway | http://localhost:4000 |

## Gateway Adapters

| Adapter | Description |
|---|---|
| `mock` (default) | Simulates send/failure deterministically. Works on any machine. |
| `applescript` | Sends real iMessages via macOS `Messages.app` automation. Requires macOS with iMessage signed in and Automation permissions granted to Terminal/Node. |

Set the adapter in `.env`:

```env
GATEWAY_ADAPTER=mock        # or applescript
MOCK_FAILURE_RATE=0         # float 0–1 (mock only)
```

## Demo Configuration

For faster testing, set a shorter send interval:

```env
SEND_INTERVAL_MS=60000      # 1 minute (default for demo)
# SEND_INTERVAL_MS=3600000  # 1 hour (production)
```

## Message Lifecycle

```
SCHEDULED → QUEUED → ACCEPTED → SENT → DELIVERED → RECEIVED
         ↘                   ↘
          CANCELLED           FAILED
```

Messages can only be cancelled while in `SCHEDULED` status.

## Useful Scripts

```bash
pnpm db:studio      # Open Prisma Studio
pnpm db:reset       # Reset and re-seed the database
pnpm lint           # Run Biome linter
pnpm check-types    # TypeScript type check across all packages
```
