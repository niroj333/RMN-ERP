import { pgTable, uuid, varchar, integer, boolean, timestamp, primaryKey } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('PENDING'),
  failedAttempts: integer('failed_attempts').notNull().default(0),
  totpSecret: varchar('totp_secret', { length: 255 }),
  isMfaEnabled: boolean('is_mfa_enabled').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by')
});

export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  isSystem: boolean('is_system').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by')
});

export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  resourceAction: varchar('resource_action', { length: 255 }).notNull().unique(),
  description: varchar('description', { length: 255 })
});

export const rolePermissions = pgTable('role_permissions', {
  roleId: uuid('role_id').notNull().references(() => roles.id),
  permissionId: uuid('permission_id').notNull().references(() => permissions.id)
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.roleId, table.permissionId] })
  };
});

export const userRoles = pgTable('user_roles', {
  userId: uuid('user_id').notNull().references(() => users.id),
  roleId: uuid('role_id').notNull().references(() => roles.id),
  scope: varchar('scope', { length: 50 }).notNull().default('GLOBAL'),
  branchId: uuid('branch_id')
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.userId, table.roleId] })
  };
});

export const sessions = pgTable('sessions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  userAgent: varchar('user_agent', { length: 255 }),
  ipAddress: varchar('ip_address', { length: 50 }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  isValid: boolean('is_valid').notNull().default(true),
  mfaVerified: boolean('mfa_verified').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const stepUpChallenges = pgTable('step_up_challenges', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  sessionId: varchar('session_id', { length: 255 }).notNull().references(() => sessions.id),
  action: varchar('action', { length: 255 }).notNull(),
  verified: boolean('verified').notNull().default(false),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});
