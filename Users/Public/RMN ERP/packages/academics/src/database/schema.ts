import { pgTable, uuid, varchar, timestamp, date, integer, numeric } from 'drizzle-orm/pg-core';

// Reusable audit columns
const auditColumns = {
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
};

export const academicYears = pgTable('academic_years', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  status: varchar('status', { length: 50 }).default('active').notNull(),
  ...auditColumns,
});

export const programs = pgTable('programs', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 100 }).notNull().unique(),
  branchId: uuid('branch_id').notNull(),
  durationYears: integer('duration_years').notNull(),
  ...auditColumns,
});

export const gradeLevels = pgTable('grade_levels', {
  id: uuid('id').defaultRandom().primaryKey(),
  programId: uuid('program_id').references(() => programs.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  level: integer('level').notNull(),
  ...auditColumns,
});

export const sections = pgTable('sections', {
  id: uuid('id').defaultRandom().primaryKey(),
  gradeLevelId: uuid('grade_level_id').references(() => gradeLevels.id).notNull(),
  academicYearId: uuid('academic_year_id').references(() => academicYears.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  capacity: integer('capacity').notNull(),
  ...auditColumns,
});

export const subjects = pgTable('subjects', {
  id: uuid('id').defaultRandom().primaryKey(),
  gradeLevelId: uuid('grade_level_id').references(() => gradeLevels.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 100 }).notNull().unique(),
  creditHours: numeric('credit_hours').notNull(),
  ...auditColumns,
});

export const enrollments = pgTable('enrollments', {
  id: uuid('id').defaultRandom().primaryKey(),
  studentId: uuid('student_id').notNull(),
  sectionId: uuid('section_id').references(() => sections.id).notNull(),
  academicYearId: uuid('academic_year_id').references(() => academicYears.id).notNull(),
  status: varchar('status', { length: 50 }).default('enrolled').notNull(),
  ...auditColumns,
});

export const exams = pgTable('exams', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  academicYearId: uuid('academic_year_id').references(() => academicYears.id).notNull(),
  gradeLevelId: uuid('grade_level_id').references(() => gradeLevels.id).notNull(),
  examType: varchar('exam_type', { length: 100 }).notNull(),
  ...auditColumns,
});

export const examResults = pgTable('exam_results', {
  id: uuid('id').defaultRandom().primaryKey(),
  examId: uuid('exam_id').references(() => exams.id).notNull(),
  studentId: uuid('student_id').notNull(),
  subjectId: uuid('subject_id').references(() => subjects.id).notNull(),
  marks: numeric('marks').notNull(),
  grade: varchar('grade', { length: 10 }),
  ...auditColumns,
});

export const attendance = pgTable('attendance', {
  id: uuid('id').defaultRandom().primaryKey(),
  studentId: uuid('student_id').notNull(),
  sectionId: uuid('section_id').references(() => sections.id).notNull(),
  date: date('date').notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  ...auditColumns,
});
