import { pgTable, uuid, varchar, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityName: varchar('entity_name', { length: 100 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  action: varchar('action', { length: 20 }).notNull(),
  oldData: jsonb('old_data'),
  newData: jsonb('new_data'),
  performedBy: uuid('performed_by'),
  performedAt: timestamp('performed_at', { withTimezone: true }).notNull().defaultNow(),
  correlationId: uuid('correlation_id').notNull(),
});

export type AuditLog = typeof auditLog.$inferSelect;
export type NewAuditLog = typeof auditLog.$inferInsert;
