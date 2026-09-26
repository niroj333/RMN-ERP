import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';

export const students = pgTable('students', {
  id: uuid('id').defaultRandom().primaryKey(),
  personId: uuid('person_id').notNull(),
  studentId: varchar('student_id', { length: 50 }).notNull().unique(),
  branchId: uuid('branch_id').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('PROSPECT'), // PROSPECT, ENROLLED, ALUMNI
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
});
