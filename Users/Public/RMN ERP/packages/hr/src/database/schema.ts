import { pgTable, uuid, text, timestamp, varchar, integer, decimal, date, boolean } from 'drizzle-orm/pg-core';

const auditColumns = {
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by')
};

export const designations = pgTable('designations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  level: integer('level').notNull(),
  baseSalary: decimal('base_salary', { precision: 12, scale: 2 }).notNull(),
  ...auditColumns
});

export const staff = pgTable('staff', {
  id: uuid('id').primaryKey().defaultRandom(),
  personId: uuid('person_id').notNull(),
  employeeId: varchar('employee_id', { length: 100 }).notNull().unique(),
  branchId: uuid('branch_id').notNull(),
  designationId: uuid('designation_id').notNull().references(() => designations.id),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  ...auditColumns
});

export const staffAttendance = pgTable('staff_attendance', {
  id: uuid('id').primaryKey().defaultRandom(),
  staffId: uuid('staff_id').notNull().references(() => staff.id),
  date: date('date').notNull(),
  checkIn: timestamp('check_in'),
  checkOut: timestamp('check_out'),
  status: varchar('status', { length: 50 }).notNull(),
  ...auditColumns
});

export const leaveTypes = pgTable('leave_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  maxDaysPerYear: integer('max_days_per_year').notNull(),
  isPaid: boolean('is_paid').notNull().default(true),
  ...auditColumns
});

export const leaveRequests = pgTable('leave_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  staffId: uuid('staff_id').notNull().references(() => staff.id),
  leaveTypeId: uuid('leave_type_id').notNull().references(() => leaveTypes.id),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  ...auditColumns
});

export const payroll = pgTable('payroll', {
  id: uuid('id').primaryKey().defaultRandom(),
  staffId: uuid('staff_id').notNull().references(() => staff.id),
  month: integer('month').notNull(),
  year: integer('year').notNull(),
  baseSalary: decimal('base_salary', { precision: 12, scale: 2 }).notNull(),
  allowances: decimal('allowances', { precision: 12, scale: 2 }).notNull().default('0'),
  deductions: decimal('deductions', { precision: 12, scale: 2 }).notNull().default('0'),
  netSalary: decimal('net_salary', { precision: 12, scale: 2 }).notNull(),
  ...auditColumns
});

export const contracts = pgTable('contracts', {
  id: uuid('id').primaryKey().defaultRandom(),
  staffId: uuid('staff_id').notNull().references(() => staff.id),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  salary: decimal('salary', { precision: 12, scale: 2 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  ...auditColumns
});
