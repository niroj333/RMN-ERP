import { pgTable, uuid, varchar, jsonb, timestamp, text, primaryKey } from 'drizzle-orm/pg-core';

export const outboxEvents = pgTable('outbox_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventType: varchar('event_type', { length: 255 }).notNull(),
  aggregateType: varchar('aggregate_type', { length: 255 }).notNull(),
  aggregateId: uuid('aggregate_id').notNull(),
  payload: jsonb('payload').notNull(),
  correlationId: uuid('correlation_id').notNull(),
  causationId: uuid('causation_id'),
  producer: varchar('producer', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('PENDING'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  error: text('error'),
});

export const consumerIdempotency = pgTable('consumer_idempotency', {
  consumerName: varchar('consumer_name', { length: 255 }).notNull(),
  eventId: uuid('event_id').notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.consumerName, table.eventId] })
  };
});

export const deadLetterEvents = pgTable('dead_letter_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  originalEventId: uuid('original_event_id').notNull(),
  consumerName: varchar('consumer_name', { length: 255 }).notNull(),
  envelope: jsonb('envelope').notNull(),
  lastError: text('last_error'),
  failedAt: timestamp('failed_at', { withTimezone: true }).notNull().defaultNow(),
  status: varchar('status', { length: 50 }).notNull().default('UNRESOLVED'),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  resolvedBy: uuid('resolved_by'),
});
