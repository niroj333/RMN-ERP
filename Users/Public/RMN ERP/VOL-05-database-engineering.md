# Volume 05 — Database Engineering Standard
**System:** RMN ERP
**Status:** Authoritative Specification
**Engine:** PostgreSQL 16
**Version:** 1.0

This document serves as the authoritative database engineering standard for the RMN ERP system. All engineering work, domain modeling, and migrations MUST comply with these rules. Implementations that violate this specification will be rejected.

## 1. Standard Table Structure
All domain tables MUST adhere to a consistent structure to ensure uniform auditability, simplified ORM mapping (Drizzle ORM), and predictable behavior.

### 1.1 Primary Keys
- **Rule:** Every table MUST have a UUID primary key.
- **Column Name:** `id`
- **Data Type:** `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- **Exception:** Join tables in many-to-many relationships MAY use composite primary keys constructed from the foreign keys of the joined entities.
- **Prohibition:** Auto-incrementing integers (`SERIAL`, `BIGSERIAL`) or sequences MUST NOT be used for primary keys.

### 1.2 Mandatory Audit Columns
Every domain table (excluding pure join tables and infrastructure tracking tables) MUST include the following standard audit columns:
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `created_by UUID` (References the IAM `users` table; nullable only for system-generated records or migration bootstrapping)
- `updated_by UUID` (References the IAM `users` table; nullable)

### 1.3 Entity Status and Soft Deletion
- **Rule:** Physical deletion (`DELETE FROM`) of domain entities is strongly discouraged, particularly when historical records or reference data depend on them (EWP-0018).
- **Pattern:** Use a status column to manage entity lifecycle.
- **Column Name:** `status` or `<entity>_status` (e.g., `user_status`, `document_status`).
- **Data Type:** `VARCHAR(30)`
- **Constraints:** Allowed values MUST be documented and application-enforced, backed by a database `CHECK` constraint.

## 2. Naming Conventions
Naming conventions must be strictly followed to ensure predictability and tooling compatibility across the monorepo workspace.

### 2.1 Schema, Tables, and Columns
- **Schemas:** Use the default `public` schema unless an ADR specifies a dedicated schema for multi-tenant isolation.
- **Tables:** lowercase, snake_case, plural nouns (e.g., `users`, `persons`, `organizations`).
- **Columns:** lowercase, snake_case (e.g., `first_name`, `is_active`).
- **Booleans:** MUST be prefixed with `is_`, `has_`, or `can_` (e.g., `is_active`, `has_children`, `can_login`).
- **Foreign Keys:** `<referenced_entity_singular>_id` (e.g., `organization_id`).

### 2.2 Constraints and Indexes
- **Primary Key Constraint:** `pk_<table>` (e.g., `pk_users`)
- **Foreign Key Constraint:** `fk_<table>_<referenced_table>` (e.g., `fk_users_organizations`)
- **Unique Constraint:** `uq_<table>_<columns_or_purpose>` (e.g., `uq_users_email`)
- **Check Constraint:** `ck_<table>_<description>` (e.g., `ck_users_status_valid`)
- **Indexes:** `idx_<table>_<columns_or_purpose>` (e.g., `idx_users_last_name`)

## 3. Data Types
PostgreSQL provides robust types. The following mapping is mandatory for consistency across Drizzle ORM and the Fastify layer.

- **Timestamps:** ALWAYS use `TIMESTAMPTZ` (Timestamp with time zone). NEVER use `TIMESTAMP` (Timestamp without time zone). All times are stored in UTC and converted at the presentation layer.
- **Strings (Bounded):** `VARCHAR(n)`. Use when the domain explicitly bounds the length (e.g., country codes, specific identifiers).
- **Strings (Unbounded):** `TEXT`. Use for names, descriptions, notes, and general text.
- **Booleans:** `BOOLEAN`.
- **Financial/Currency:** `NUMERIC(precision, scale)`. Usually `NUMERIC(15, 2)` or `NUMERIC(19, 4)` depending on domain requirements. NEVER use `FLOAT` or `REAL` for financial data.
- **JSON:** `JSONB`. NEVER use `JSON`.
- **IP Addresses:** `INET`.

## 4. Temporal Data and History
RMN ERP requires rigorous temporal tracking to support EWP-0002 (Preserve temporal/audit requirements) and EWP-0018 (Master tables and history).

### 4.1 Effective Dates Pattern
For reference data, organizational hierarchies (EWP-0201), and metadata configuration (ADR-0020) that change over time:
- Include temporal bounds:
  - `effective_from DATE NOT NULL DEFAULT CURRENT_DATE`
  - `effective_to DATE` (NULL indicates the record is currently active and has no planned expiration)
- Queries must use `CURRENT_DATE BETWEEN effective_from AND COALESCE(effective_to, '9999-12-31')` to retrieve current state.

### 4.2 History Preservation
- Master data values MUST NOT be deleted when historical records depend on them (EWP-0018).
- For critical entities, when a record is updated, the previous state MUST be preserved.
- **Implementation:** Terminate the current record by setting `effective_to = CURRENT_DATE` and insert a new record with `effective_from = CURRENT_DATE + 1`. Alternatively, utilize an append-only `<entity>_history` table for pure bi-temporal modeling if prescribed by a specific EWP.

## 5. Audit Trail
In addition to row-level audit columns (`created_by`, `updated_by`), all critical state changes must be recorded in an immutable audit log.

### 5.1 Infrastructure `audit_log` Table (EWP-0001)
The core infrastructure MUST provide the following shared table:

```sql
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_name VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_data JSONB,
    new_data JSONB,
    performed_by UUID, -- References users.id
    performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    correlation_id UUID NOT NULL
);
```
- **Immutability:** The `audit_log` table is strictly APPEND-ONLY. The database user utilized by the application MUST NOT have `UPDATE` or `DELETE` privileges on this table.
- **Correlation:** Every entry MUST include the `X-Correlation-ID` propagated from the HTTP request context.

## 6. Referential Integrity
- **Foreign Keys:** All relationships MUST be explicitly defined and enforced by foreign key constraints.
- **Cascading Rules:**
  - `ON DELETE RESTRICT` (or `NO ACTION`) is the DEFAULT. This prevents accidental deletion of referenced data (EWP-0018).
  - `ON DELETE CASCADE` is permitted ONLY for composition relationships (weak entities), where the child has no independent existence outside the parent (e.g., deleting an `invoice` deletes its `invoice_line_items`).
- **Soft-Delete Interaction:** Application logic MUST filter out inactive records. Uniqueness constraints involving soft-deleted records MUST use partial indexes (e.g., `CREATE UNIQUE INDEX uq_users_email ON users (email) WHERE status != 'DELETED'`).

## 7. Migration Standards
Migrations establish a deterministic, reviewable evolution of the schema (EWP-0001).

- **Tooling:** Drizzle ORM migration generation and execution.
- **Format:** Forward-only SQL files.
- **Determinism:** Migrations MUST NOT rely on external state or non-deterministic functions (except `NOW()` / `gen_random_uuid()` for defaults).
- **Rollback Strategy:** Migrations are forward-only. If a deployment fails, a corrective forward migration (fix-forward) MUST be created. There is no automated `DOWN` migration execution in production.
- **Data Migrations:** DML operations (INSERT, UPDATE) within migrations must be idempotent and safely re-runnable if they fail mid-execution.
- **Separation of Concerns:** Test fixtures and seed data for local development MUST NOT be included in production migrations.

## 8. Domain Table Ownership and Boundaries
RMN ERP is an event-driven Modular Monolith. 
- **Ownership:** Each domain module (Identity, HR, Finance, Student) physically owns its respective tables.
- **Strict Isolation:** A module MUST NOT execute direct SQL queries (or Drizzle queries) against another module's tables.
- **Integration:** Cross-module communication MUST occur via:
  1. Internal Application API (function calls crossing module boundaries).
  2. Asynchronous Event-Driven Architecture (Transactional Outbox pattern writing to Redis Streams).
- **Universal vs Specific Entities:**
  - The universal `persons` table belongs to the Core/Identity domain (EWP-0101).
  - Domain-specific extensions (e.g., Student-only fields) MUST be placed in separate tables owned by their respective domains (e.g., `student_profiles` in the Student domain) with a foreign key back to `persons.id`.

## 9. Security and Compliance
- **Credentials:** Under no circumstances may credentials, passwords, authentication tokens, or secrets be stored in plaintext (EWP-0002). Passwords MUST be hashed using industry-standard algorithms (e.g., Argon2id or bcrypt).
- **PII:** Personally Identifiable Information MUST be logically grouped to allow for future field-level encryption if mandated.
- **Metadata:** Metadata configuration MUST be physically separated from transactional data (ADR-0020). Ensure metadata tables enforce valid types and references without cluttering domain transactional tables.

## 10. Performance and Indexing
- **Foreign Keys:** Every foreign key column MUST have an accompanying B-Tree index to prevent table scans during JOIN operations and cascading checks.
- **Querying:** Application queries MUST NOT use `SELECT *`. Drizzle queries must explicitly select only the required fields.
- **Pagination:** All listing queries MUST utilize cursor-based pagination (using keyset pagination via UUIDs or Timestamps). Offset-based pagination is permitted only for internal admin tools where dataset sizes are strictly bounded.

## 11. PostgreSQL-Specific Features
- **Allowed:** `JSONB`, `gen_random_uuid()`, `INET`, Array types (`TEXT[]`, `UUID[]`) when strictly appropriate (e.g., simple lists of tags; prefer normalization for relational data).
- **Restricted:**
  - **Triggers and Stored Procedures:** DISCOURAGED. Business logic MUST reside in the Node.js application layer. Triggers are permitted ONLY for infrastructure concerns (e.g., automatically updating `updated_at` columns).
  - **Table Inheritance:** FORBIDDEN.
  - **Rules:** FORBIDDEN.

---
**End of Volume 05**
