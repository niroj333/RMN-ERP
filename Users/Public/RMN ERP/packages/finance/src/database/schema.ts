import { pgTable, text, timestamp, uuid, decimal } from "drizzle-orm/pg-core";

const auditColumns = {
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
};

export const feeStructures = pgTable("fee_structures", {
  id: uuid("id").primaryKey().defaultRandom(),
  academicYearId: uuid("academic_year_id").notNull(),
  gradeLevelId: uuid("grade_level_id").notNull(),
  branchId: uuid("branch_id").notNull(),
  frequency: text("frequency").notNull(),
  ...auditColumns,
});

export const feeComponents = pgTable("fee_components", {
  id: uuid("id").primaryKey().defaultRandom(),
  feeStructureId: uuid("fee_structure_id").references(() => feeStructures.id).notNull(),
  name: text("name").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  ...auditColumns,
});

export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  studentId: uuid("student_id").notNull(),
  dueDate: timestamp("due_date").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  ...auditColumns,
});

export const invoiceItems = pgTable("invoice_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id").references(() => invoices.id).notNull(),
  feeComponentId: uuid("fee_component_id").references(() => feeComponents.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
  ...auditColumns,
});

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  paymentNumber: text("payment_number").notNull().unique(),
  invoiceId: uuid("invoice_id").references(() => invoices.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  method: text("method").notNull(),
  status: text("status").notNull().default("success"),
  ...auditColumns,
});

export const scholarships = pgTable("scholarships", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  ...auditColumns,
});
