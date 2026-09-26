# ADR-0018: Universal Numbering & Business ID Engine

**Status:** Approved
**Date:** 2026-09-23

## 1. Context

RMN ERP must support multiple branches and potentially multiple independent consultancies using the same deployment. Entities like Students, Employees, Invoices, and Applications require human-readable, unique Business IDs (e.g., `DAB-2026-00001`). 

Hard-coding ID formats (e.g., inside the Student module) creates severe limitations. It violates the requirement that RMN ERP must remain usable by multiple consultancies and branches with different numbering conventions. 

Therefore, we need a configurable Universal Numbering & Business ID Engine to generate these IDs dynamically based on administrative policies rather than hard-coded logic.

## 2. Decision

We will implement a **Universal Numbering & Business ID Engine** as a core service. 
The architecture will rely on a **Business ID Engine** that reads a **Numbering Policy** to output a formatted **Entity ID**. 

This ensures:
- Numbering formats are configurable per entity type and branch.
- Formats are policy-driven and stored in the database.
- The engine is extensible for any future entity types.
- Business IDs are generated atomically and concurrently safe.

## 3. Architecture

The generation process follows this flow:
1. **Request:** A domain module (e.g., Student Registration) requests a new ID for an entity type (`STUDENT`), providing context like branch ID and transaction timestamp.
2. **Policy Lookup:** The Business ID Engine looks up the active `numbering_policies` record for the `STUDENT` entity type.
3. **Pattern Resolution:** The engine parses the pattern template (e.g., `{PREFIX}-{YEAR}-{SEQ:5}`).
4. **Sequence Acquisition:** The engine acquires the next atomic sequence number based on the policy's sequence scope.
5. **Formatting:** The pattern tokens are replaced with contextual data and the zero-padded sequence.
6. **Return:** The generated Business ID is returned to the domain module to be saved with the domain entity.

## 4. Numbering Policy Model

The configuration will be stored in the PostgreSQL database using the standard RMN ERP conventions.

### Table: `numbering_policies`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Standard PK |
| `entity_type` | `VARCHAR(50)` | `NOT NULL` | E.g., `STUDENT`, `EMPLOYEE`, `INVOICE` |
| `branch_id` | `UUID` | `NULL` | If NULL, applies globally. If set, overrides global policy for this branch. |
| `prefix` | `VARCHAR(20)` | `NULL` | Static prefix if not embedded in the pattern. |
| `pattern` | `VARCHAR(100)` | `NOT NULL` | The template, e.g., `{PREFIX}-{YEAR}-{SEQ:5}` |
| `sequence_scope` | `VARCHAR(30)` | `NOT NULL` | `GLOBAL`, `BRANCH`, `YEARLY`, `BRANCH_YEARLY` |
| `is_gapless` | `BOOLEAN` | `NOT NULL DEFAULT false` | If true, uses strict table-based locking. If false, uses fast PostgreSQL `SEQUENCE` |
| `is_active` | `BOOLEAN` | `NOT NULL DEFAULT true` | Only one active policy per entity/branch combo |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Audit |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Audit |
| `created_by` | `UUID` | `NULL` | Audit |
| `updated_by` | `UUID` | `NULL` | Audit |

*Constraint:* `uq_numbering_policies_active` on `(entity_type, branch_id)` where `is_active = true`.

### Table: `numbering_sequences`
Used for tracking the current sequence value per scope.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Standard PK |
| `policy_id` | `UUID` | `NOT NULL REFERENCES numbering_policies(id)` | Link to policy |
| `scope_key` | `VARCHAR(100)` | `NOT NULL` | E.g., `GLOBAL`, `BRANCH_XYZ`, `2026`, `BRANCH_XYZ_2026` |
| `current_value` | `BIGINT` | `NOT NULL DEFAULT 0` | The last issued sequence number |
| `updated_at` | `TIMESTAMPTZ`| `NOT NULL DEFAULT NOW()` | Audit |

*Constraint:* `uq_numbering_sequences_scope` on `(policy_id, scope_key)`.

## 5. Pattern Components

The engine supports token replacement within the `pattern` string. 

Available tokens:
- `{PREFIX}`: Replaced by the `prefix` column of the policy.
- `{BRANCH_CODE}`: Looked up from the branch context (e.g., `DAB`, `KTM`).
- `{YEAR}`: 4-digit current year (e.g., `2026`).
- `{YEAR2}`: 2-digit current year (e.g., `26`).
- `{MONTH}`: 2-digit current month (e.g., `09`).
- `{SEQ:N}`: The sequence number, zero-padded to `N` digits (e.g., `{SEQ:5}` for `00001`).

## 6. Sequence Generation

Concurrency and atomicity are critical. RMN ERP supports two modes (`is_gapless`):

1. **Gap-Tolerant (Default & Recommended):**
   - Uses native PostgreSQL `SEQUENCE` objects.
   - The engine dynamically creates a `SEQUENCE` for each new `scope_key`.
   - Highest performance, no row-level locking bottlenecks.
   - If a transaction rolls back, the sequence number is lost (a gap appears). This is acceptable for Students and Employees.

2. **Gap-Free (Strict):**
   - Uses row-level locking on the `numbering_sequences` table (`SELECT ... FOR UPDATE`).
   - Slower, can cause transaction contention.
   - Used only for strict financial entities (e.g., Invoices) where local tax laws might forbid missing numbers.

## 7. Uniqueness Guarantee

- **Database level:** All domain tables (e.g., `students`) MUST have a `UNIQUE` constraint on their business ID column (e.g., `uq_students_student_id`).
- **Engine level:** Sequences are scoped. If the pattern includes `{YEAR}`, the `sequence_scope` MUST be `YEARLY` or `BRANCH_YEARLY` to ensure the sequence resets correctly without causing duplicates across years. The engine validates policy patterns against scopes on creation.

## 8. ID Immutability

Once generated and persisted, a Business ID **NEVER** changes.
- Even if a student changes branches, their existing ID remains intact.
- Even if the numbering policy is updated, existing records are not retroactively modified.
- Domain modules must treat business ID columns as read-only after creation.

## 9. Administration

An internal Admin API `/api/v1/admin/numbering-policies` will be provided to manage policies.
- Admins can create, read, update (soft deactivate), and list policies.
- Changes to policies take effect immediately for new entities.

## 10. Initial Policies

The system will ship with a default policy for `STUDENT` to satisfy EWP-1001, but it will be loaded via a database seed migration, **not** hard-coded.

- **Entity Type:** `STUDENT`
- **Pattern:** `{PREFIX}-{YEAR}-{SEQ:5}`
- **Prefix:** `DAB`
- **Scope:** `GLOBAL` (or `BRANCH_YEARLY` if branch isolation is desired)
- **Output Example:** `DAB-2026-00001`

## 11. Future Extension

The engine is designed to be agnostic. As RMN ERP expands, the same engine will be used for:
- **EMPLOYEE:** e.g., `EMP-0015`
- **INVOICE:** e.g., `INV-2026-10-9942` (Gap-free)
- **APPLICATION:** e.g., `APP-26-0001`
