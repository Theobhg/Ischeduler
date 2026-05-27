-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('SCHEDULED', 'QUEUED', 'ACCEPTED', 'SENT', 'DELIVERED', 'RECEIVED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "scheduled_messages" (
    "id" UUID NOT NULL,
    "toPhone" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'SCHEDULED',
    "provider" TEXT,
    "providerMessageId" TEXT,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_status_events" (
    "id" UUID NOT NULL,
    "messageId" UUID NOT NULL,
    "status" "MessageStatus" NOT NULL,
    "payload" JSONB,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_status_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scheduled_messages_status_idx" ON "scheduled_messages"("status");

-- CreateIndex
CREATE INDEX "scheduled_messages_scheduledAt_idx" ON "scheduled_messages"("scheduledAt");

-- CreateIndex
CREATE INDEX "message_status_events_messageId_idx" ON "message_status_events"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "message_status_events_messageId_status_idempotencyKey_key" ON "message_status_events"("messageId", "status", "idempotencyKey");

-- AddForeignKey
ALTER TABLE "message_status_events" ADD CONSTRAINT "message_status_events_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "scheduled_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
