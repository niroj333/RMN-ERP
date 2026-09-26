CREATE TABLE IF NOT EXISTS "outbox_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "event_type" varchar(255) NOT NULL,
  "aggregate_type" varchar(255) NOT NULL,
  "aggregate_id" uuid NOT NULL,
  "payload" jsonb NOT NULL,
  "correlation_id" uuid NOT NULL,
  "causation_id" uuid,
  "producer" varchar(255) NOT NULL,
  "status" varchar(50) NOT NULL DEFAULT 'PENDING',
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "published_at" timestamp with time zone,
  "error" text
);

CREATE INDEX IF NOT EXISTS "idx_outbox_events_status_created" ON "outbox_events" ("status", "created_at") WHERE "status" = 'PENDING';

CREATE TABLE IF NOT EXISTS "consumer_idempotency" (
  "consumer_name" varchar(255) NOT NULL,
  "event_id" uuid NOT NULL,
  "processed_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "consumer_idempotency_pk" PRIMARY KEY ("consumer_name", "event_id")
);

CREATE TABLE IF NOT EXISTS "dead_letter_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "original_event_id" uuid NOT NULL,
  "consumer_name" varchar(255) NOT NULL,
  "envelope" jsonb NOT NULL,
  "last_error" text,
  "failed_at" timestamp with time zone NOT NULL DEFAULT now(),
  "status" varchar(50) NOT NULL DEFAULT 'UNRESOLVED',
  "resolved_at" timestamp with time zone,
  "resolved_by" uuid
);

CREATE INDEX IF NOT EXISTS "idx_dlq_unresolved" ON "dead_letter_events" ("status") WHERE "status" = 'UNRESOLVED';
