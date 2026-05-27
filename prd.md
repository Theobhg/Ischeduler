# PRD — iMessage Scheduler

## Purpose

Build a local-first fullstack iMessage scheduler for a technical assessment.

The app lets a user schedule outbound iMessages from a browser UI. A backend stores messages, a worker processes them as a FIFO queue with a configurable send rate, and a local gateway sends messages from the currently signed-in macOS iMessage account.

Optimize for: speed of implementation, correctness, clear architecture, local reproducibility, and polished demo flow.

---

## Required Stack

* Monorepo
* Frontend: React + TypeScript + Vite + Tailwind
* Backend API: Node.js + TypeScript + Express or Fastify
* Database: Postgres
* ORM: Prisma
* Queue: Redis + BullMQ
* Gateway: Node.js local service
* Package manager: pnpm workspaces
* Local infra: Docker Compose

---

## Monorepo Structure

```txt
monorepo/
  apps/
    web/       React scheduling UI + dashboard
    api/       REST API + Prisma
    worker/    BullMQ delivery worker
    gateway/   local iMessage gateway
  packages/
    shared/    shared types, zod schemas, status enum
  docker-compose.yml
  pnpm-workspace.yaml
  README.md
```

---

## Core Architecture

```txt
React UI
  -> API
  -> Postgres stores message + status events
  -> BullMQ schedules delayed delivery job
  -> Worker processes eligible jobs FIFO
  -> Worker calls local Gateway
  -> Gateway sends via adapter
  -> API stores status updates
  -> Dashboard displays current state + timeline
```

Postgres is the source of truth. Redis/BullMQ is used for queueing, delay, rate limiting, retry, and worker locking.

---

## Gateway Strategy

### Required adapters

1. `mock`

   * Used for deterministic local development.
   * Can simulate success/failure.
   * Must work on any machine.

2. `applescript`

   * Uses macOS Messages.app automation via `osascript`.
   * Sends real iMessages from the currently signed-in Mac account.
   * Reports `SENT` when the local send automation succeeds.

### Stretch adapter

3. `bluebubbles`

   * Optional only if the core system is complete.
   * Use as richer local iMessage bridge for better API/webhook behavior.
   * Do not make this required for the main demo.

### Gateway limitation

AppleScript mode can confirm that the local send automation executed successfully, but cannot reliably prove final `DELIVERED` or `RECEIVED` status. Those statuses are adapter-dependent and should be documented clearly.

---

## Message Statuses

```ts
type MessageStatus =
  | "SCHEDULED"
  | "QUEUED"
  | "ACCEPTED"
  | "SENT"
  | "DELIVERED"
  | "RECEIVED"
  | "FAILED"
  | "CANCELLED";
```

Definitions:

* `SCHEDULED`: created and waiting for scheduled time.
* `QUEUED`: eligible and picked by worker.
* `ACCEPTED`: gateway accepted request.
* `SENT`: gateway successfully triggered send.
* `DELIVERED`: provider/gateway confirmed delivery, if supported.
* `RECEIVED`: inbound response/event, if supported.
* `FAILED`: delivery failed.
* `CANCELLED`: user cancelled before delivery.

Allowed transitions:

```txt
SCHEDULED -> QUEUED
SCHEDULED -> CANCELLED
QUEUED -> ACCEPTED
ACCEPTED -> SENT
SENT -> DELIVERED
DELIVERED -> RECEIVED
QUEUED -> FAILED
ACCEPTED -> FAILED
SENT -> FAILED
```

Rules:

* `CANCELLED` is terminal.
* `FAILED` is terminal unless manual retry is implemented.
* Messages cannot be cancelled after `QUEUED`, `ACCEPTED`, `SENT`, `DELIVERED`, or `RECEIVED`.

---

## Data Model

### `ScheduledMessage`

```ts
{
  id: string;
  toPhone: string;
  body: string;
  scheduledAt: Date;
  status: MessageStatus;
  provider?: string;
  providerMessageId?: string;
  errorMessage?: string;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### `MessageStatusEvent`

```ts
{
  id: string;
  messageId: string;
  status: MessageStatus;
  payload?: object;
  idempotencyKey?: string;
  createdAt: Date;
}
```

Required indexes:

```txt
ScheduledMessage.status
ScheduledMessage.scheduledAt
MessageStatusEvent.messageId
unique(messageId, status, idempotencyKey)
```

---

## Backend API

Base path: `/api`

### `POST /messages`

Create scheduled message.

Request:

```json
{
  "toPhone": "+15551234567",
  "body": "Scheduled iMessage body",
  "scheduledAt": "2026-05-26T18:00:00.000Z"
}
```

Behavior:

* Validate input with Zod.
* Store message in Postgres as `SCHEDULED`.
* Create `SCHEDULED` status event.
* Add delayed BullMQ job.

### `GET /messages`

List messages.

Query params:

```txt
status?: MessageStatus
search?: string
limit?: number
offset?: number
```

Return dashboard-friendly list ordered by latest activity or scheduled time.

### `GET /messages/:id`

Return one message with status event timeline.

### `PATCH /messages/:id/cancel`

Cancel a scheduled message.

Behavior:

* Only allowed when current status is `SCHEDULED`.
* Set status to `CANCELLED`.
* Append `CANCELLED` event.
* Worker must skip cancelled messages.

### `POST /gateway/status`

Receive status update from gateway.

Request:

```json
{
  "messageId": "cm...",
  "status": "SENT",
  "provider": "local-applescript",
  "providerMessageId": "local-1710000000000",
  "idempotencyKey": "local-1710000000000-SENT",
  "raw": {}
}
```

Behavior:

* Validate payload.
* Apply status transition if valid.
* Append status event.
* Use `idempotencyKey` to ignore duplicate callbacks.
* Store provider metadata.

### `GET /queue/stats`

Return BullMQ stats:

```json
{
  "waiting": 0,
  "delayed": 3,
  "active": 1,
  "completed": 12,
  "failed": 2
}
```

---

## Worker Requirements

Use BullMQ worker.

Requirements:

* Process one job at a time by default.
* Enforce configurable send interval.
* Default: one message per hour.
* Demo mode: allow one message per minute or faster via env.
* Retry transient failures.
* Use exponential backoff.
* Check database status before sending.
* Skip cancelled messages.
* Mark message `QUEUED` before calling gateway.
* Call gateway `/send`.
* Record `ACCEPTED`, `SENT`, or `FAILED`.

FIFO rule:

```txt
eligible messages ordered by scheduledAt ASC, createdAt ASC
```

Environment:

```env
SEND_INTERVAL_MS=3600000
WORKER_CONCURRENCY=1
WORKER_ATTEMPTS=3
WORKER_BACKOFF_MS=30000
```

---

## Gateway API

Gateway runs as separate local Node service.

### `POST /send`

Request:

```json
{
  "messageId": "cm...",
  "toPhone": "+15551234567",
  "body": "Scheduled iMessage body"
}
```

Response:

```json
{
  "provider": "local-applescript",
  "providerMessageId": "local-1710000000000",
  "status": "SENT"
}
```

Environment:

```env
GATEWAY_PORT=4000
GATEWAY_ADAPTER=mock
API_STATUS_CALLBACK_URL=http://localhost:3000/api/gateway/status
```

Adapter interface:

```ts
interface IMessageGateway {
  send(input: {
    messageId: string;
    toPhone: string;
    body: string;
  }): Promise<{
    provider: string;
    providerMessageId: string;
    status: "ACCEPTED" | "SENT";
  }>;
}
```

---

## Frontend Requirements

### Page: Schedule

Fields:

* Recipient phone number
* Message body
* Scheduled date/time

Behavior:

* Validate required fields.
* Submit to `POST /api/messages`.
* Show success/error feedback.
* Reset on success.

### Page: Dashboard

Show:

* Summary cards by status.
* Message table.
* Status badges.
* Queue stats.
* Cancel action for `SCHEDULED` messages.
* Optional detail drawer/modal with full message and status timeline.

Table columns:

```txt
Recipient | Preview | Scheduled At | Status | Updated At | Actions
```

---

## Local Development

Required commands should be documented in README:

```bash
cp .env.example .env
docker compose up -d
pnpm install
pnpm db:migrate
pnpm dev
```

Demo configuration:

```env
SEND_INTERVAL_MS=60000
GATEWAY_ADAPTER=mock
```

AppleScript gateway requires:

* macOS
* Messages.app signed in
* iMessage enabled
* Automation permissions granted to Terminal/Node

---

## Error Handling

Handle these cases:

* Invalid phone number
* Empty body
* Scheduled time invalid
* Postgres unavailable
* Redis unavailable
* Gateway unavailable
* AppleScript permission denied
* Messages.app not signed in
* Gateway send failure

Expected behavior:

* Validation errors: 400
* Missing entity: 404
* Gateway failures: retry, then `FAILED`
* Error details stored in `errorMessage` and status event payload

---

## Testing Requirements

Minimum tests:

* Request validation
* Status transition validation
* Create scheduled message
* Cancel scheduled message
* Worker skips cancelled message
* Worker sends due message with mock gateway
* Duplicate gateway status callback is idempotent

---

## Implementation Order

1. Create monorepo and Docker Compose.
2. Add Prisma schema and migrations.
3. Implement shared status enum and Zod schemas.
4. Implement API create/list/detail/cancel/status endpoints.
5. Implement BullMQ queue and worker using mock gateway.
6. Implement React schedule form.
7. Implement dashboard table, status badges, queue stats.
8. Implement AppleScript gateway adapter.
9. Add tests.
10. Polish README and document limitations.
11. Optional only after core is complete: BlueBubbles adapter.

---

## Demo Success Path

The final demo must show:

```txt
1. Open browser UI.
2. Schedule a message.
3. Message appears as SCHEDULED.
4. Worker processes it when due.
5. Status changes to QUEUED.
6. Gateway receives send request.
7. Status changes to ACCEPTED/SENT or FAILED.
8. Dashboard shows current status and event timeline.
```

---

## Explicit Non-Goals

Do not implement unless extra time remains:

* User authentication
* Multi-tenant accounts
* AWS deployment
* Kubernetes
* Billing
* Contact import
* Message templates
* Campaign analytics
* Complex timezone rules
* BlueBubbles adapter as required path

---

## Open Questions for Evaluator

1. Is the one-message-per-hour limit global, per sender account, or per recipient?
2. Is a local macOS gateway using Messages.app automation acceptable for the required gateway?
3. Are `DELIVERED` and `RECEIVED` required as real statuses, or can they be adapter-dependent/documented in local mode?
4. Is authentication expected, or is a single-user local demo acceptable?
5. Is local Docker-based execution sufficient, or is deployment expected?
