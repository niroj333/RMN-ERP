import { pgTable, uuid, varchar, text, integer, boolean, date, timestamp, bigint } from 'drizzle-orm/pg-core';

export const referenceTypes = pgTable('reference_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code').unique().notNull(),
  name: varchar('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
});

export const referenceValues = pgTable('reference_values', {
  id: uuid('id').primaryKey().defaultRandom(),
  typeId: uuid('type_id').references(() => referenceTypes.id).notNull(),
  code: varchar('code').notNull(),
  value: varchar('value').notNull(),
  displayOrder: integer('display_order').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  effectiveFrom: date('effective_from').defaultNow().notNull(),
  effectiveTo: date('effective_to'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
});

export const numberingPolicies = pgTable('numbering_policies', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityType: varchar('entity_type').notNull(),
  branchId: uuid('branch_id'),
  prefix: varchar('prefix'),
  pattern: varchar('pattern').notNull(),
  sequenceScope: varchar('sequence_scope').notNull(), // GLOBAL, BRANCH, YEARLY, BRANCH_YEARLY
  isGapless: boolean('is_gapless').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
});

export const numberingSequences = pgTable('numbering_sequences', {
  id: uuid('id').primaryKey().defaultRandom(),
  policyId: uuid('policy_id').references(() => numberingPolicies.id).notNull(),
  scopeKey: varchar('scope_key').notNull(),
  currentValue: bigint('current_value', { mode: 'number' }).default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
});

export const metadataDefinitions = pgTable('metadata_definitions', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityType: varchar('entity_type').notNull(),
  fieldName: varchar('field_name').notNull(),
  dataType: varchar('data_type').notNull(), // STRING, NUMBER, BOOLEAN, DATE, REFERENCE
  isRequired: boolean('is_required').notNull(),
  isActive: boolean('is_active').notNull(),
  version: integer('version').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
});
