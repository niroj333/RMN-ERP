import { pgTable, uuid, varchar, date, boolean, timestamp } from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';

const auditCols = {
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
};

export const persons = pgTable('persons', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title'),
  firstName: varchar('first_name'),
  middleName: varchar('middle_name'),
  lastName: varchar('last_name'),
  dateOfBirth: date('date_of_birth'),
  gender: varchar('gender'),
  status: varchar('status', { enum: ['ACTIVE', 'DECEASED', 'MERGED'] }).default('ACTIVE'),
  mergedIntoId: uuid('merged_into_id').references((): AnyPgColumn => persons.id),
  ...auditCols,
});

export const contactMethods = pgTable('contact_methods', {
  id: uuid('id').defaultRandom().primaryKey(),
  personId: uuid('person_id').references(() => persons.id).notNull(),
  type: varchar('type', { enum: ['EMAIL', 'PHONE'] }).notNull(),
  value: varchar('value').notNull(),
  isPrimary: boolean('is_primary').default(false).notNull(),
  effectiveFrom: date('effective_from').defaultNow().notNull(),
  effectiveTo: date('effective_to'),
  ...auditCols,
});

export const addresses = pgTable('addresses', {
  id: uuid('id').defaultRandom().primaryKey(),
  personId: uuid('person_id').references(() => persons.id).notNull(),
  type: varchar('type', { enum: ['HOME', 'MAILING', 'EMPLOYER'] }).notNull(),
  line1: varchar('line1'),
  line2: varchar('line2'),
  city: varchar('city'),
  state: varchar('state'),
  country: varchar('country'),
  postalCode: varchar('postal_code'),
  effectiveFrom: date('effective_from').defaultNow().notNull(),
  effectiveTo: date('effective_to'),
  ...auditCols,
});

export const personIdentifiers = pgTable('person_identifiers', {
  id: uuid('id').defaultRandom().primaryKey(),
  personId: uuid('person_id').references(() => persons.id).notNull(),
  type: varchar('type', { enum: ['NATIONAL_ID', 'PASSPORT'] }).notNull(),
  value: varchar('value').notNull(),
  issuingCountry: varchar('issuing_country'),
  expiresAt: date('expires_at'),
  effectiveFrom: date('effective_from').defaultNow().notNull(),
  effectiveTo: date('effective_to'),
  ...auditCols,
});

export const personRelationships = pgTable('person_relationships', {
  id: uuid('id').defaultRandom().primaryKey(),
  personAId: uuid('person_a_id').references(() => persons.id).notNull(),
  personBId: uuid('person_b_id').references(() => persons.id).notNull(),
  relationshipType: varchar('relationship_type', { enum: ['PARENT', 'CHILD', 'SPOUSE', 'EMERGENCY_CONTACT'] }).notNull(),
  effectiveFrom: date('effective_from').defaultNow().notNull(),
  effectiveTo: date('effective_to'),
  ...auditCols,
});

export const occupations = pgTable('occupations', {
  id: uuid('id').defaultRandom().primaryKey(),
  personId: uuid('person_id').references(() => persons.id).notNull(),
  employerName: varchar('employer_name').notNull(),
  addressLine1: varchar('address_line1'),
  addressLine2: varchar('address_line2'),
  city: varchar('city'),
  state: varchar('state'),
  country: varchar('country'),
  postalCode: varchar('postal_code'),
  startDate: date('start_date'),
  endDate: date('end_date'),
  effectiveFrom: date('effective_from').defaultNow().notNull(),
  effectiveTo: date('effective_to'),
  ...auditCols,
});
