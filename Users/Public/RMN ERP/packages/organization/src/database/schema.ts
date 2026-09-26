import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';

export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  parentId: uuid('parent_id').references((): any => organizations.id),
  type: varchar('type', { length: 50 }).notNull(), // COMPANY, BRANCH, DEPARTMENT, UNIT, EXTERNAL_INSTITUTION
  name: varchar('name', { length: 255 }).notNull(),
  path: text('path').notNull(),
  status: varchar('status', { length: 20 }).default('ACTIVE').notNull(), // ACTIVE, INACTIVE, ARCHIVED
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
});
