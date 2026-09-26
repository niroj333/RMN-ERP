# ADR-0025 — Organization Model Architecture

**Status:** Approved
**Date:** 2026-09-23
**Related EWPs:** EWP-0201, EWP-0002
**Related TDRs:** TDR-0001

## 1. Context & Decision

RMN ERP requires a canonical representation of internal and external organizational structures. Internal structures define authorization boundaries (branches), reporting lines (departments), and business units. External structures represent third parties (schools, embassies, employers).
We need a unified, performant, and secure way to represent these entities and their hierarchies.

**Decision:** We will use a single `organizations` table utilizing an adjacency list with a materialized path (for querying) to model the organizational hierarchy. Branches will serve as explicit authorization scope boundaries. All downstream domains must reference organization IDs canonically and not duplicate organizational data.

## 2. Organization Types

The `organizations` table will classify entities using a standard `type` column.

Allowed `type` values (`VARCHAR(30)`):
- `COMPANY`: The root internal organization. Only one active root company is permitted.
- `BRANCH`: A primary operating location or legal entity. Acts as the primary authorization scope boundary.
- `DEPARTMENT`: A functional division within a company or branch.
- `UNIT`: A smaller team or sub-division within a department.
- `EXTERNAL_INSTITUTION`: A third-party organization (e.g., school, employer, embassy) that interacts with the system but is not part of the internal hierarchy.

## 3. Hierarchy Model

The hierarchy is implemented using an adjacency list (`parent_id`) combined with a materialized path (`path`) for query performance.

### Schema Requirements
```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES organizations(id),
    type VARCHAR(30) NOT NULL,
    name VARCHAR(255) NOT NULL,
    path TEXT NOT NULL, -- Materialized path (e.g., 'root_id.parent_id.this_id')
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    
    -- Audit columns
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);
```

- **Querying:** The `path` column allows efficient querying of all descendants using pattern matching (e.g., `WHERE path LIKE 'ancestor_id.%'`).
- **Path format:** Period-separated UUIDs representing the ancestry chain, starting from the root company down to the current node.

## 4. Branch as Scope Boundary

In accordance with EWP-0002, branches serve as the absolute boundary for data access.

- **Data Ownership:** Domain entities (e.g., invoices, applications, employees) MUST have a `branch_id` column.
- **Query Isolation:** All queries querying domain data MUST include a filter on `branch_id` based on the current user's authenticated session context.
- **Sub-hierarchies:** Departments and Units reside *under* a Branch in the hierarchy. Access to a branch implies access to data owned by that branch, but departments/units do not act as primary isolation boundaries for overarching entity access unless explicitly configured.

## 5. Hierarchy Integrity Rules

1. **No Circular References:** A node cannot be its own ancestor. The database must enforce this via triggers or application-level checks prior to write.
2. **Max Depth Policy:** The hierarchy depth is strictly limited to 10 levels to prevent performance degradation and infinite recursion.
3. **Re-parenting Rules:** 
   - When a node is re-parented, its `parent_id` and `path` must be updated.
   - All descendant nodes must have their `path` values synchronously recalculated and updated within the same transaction.
   - `EXTERNAL_INSTITUTION` types cannot have internal types (`BRANCH`, `DEPARTMENT`, `UNIT`) as descendants.

## 6. Cross-Branch Access Prevention

The hierarchy structure itself does **not** implicitly grant cross-branch data access.

1. **Explicit Grants Only:** Just because Branch A is a sibling of Branch B does not mean users in Branch A can access Branch B.
2. **Company/Root Scope:** Users assigned to the `COMPANY` root do not automatically inherit access to all branches unless explicitly granted a "Global Admin" role that resolves to explicitly listing all branch IDs in their session token.
3. **Query Engine Rule:** The API/Data layer will enforce isolation by strictly evaluating `user.allowed_branch_ids IN (entity.branch_id)`. The hierarchy path is only used for organizational modeling, not for dynamic data authorization.

## 7. Organization Lifecycle

Organizations transition through the following states (`status` column):

- `ACTIVE`: The organization is fully operational.
- `INACTIVE`: The organization is temporarily suspended. No new domain entities can be assigned to it, but existing data remains accessible.
- `ARCHIVED`: The organization is permanently closed. It is soft-deleted from standard views.

**Transitions:**
- `ACTIVE` -> `INACTIVE`
- `INACTIVE` -> `ACTIVE`
- `ACTIVE`/`INACTIVE` -> `ARCHIVED`
- `ARCHIVED` status is terminal.

## 8. External Institutions

- `EXTERNAL_INSTITUTION` records are stored in the same table to allow a unified reference model.
- They typically have `parent_id = NULL` (they do not roll up to the internal `COMPANY`).
- They are used as lookup targets for domains like HR (previous employers) or Education (universities).
- They are completely excluded from branch isolation rules (domain records pointing to external institutions still rely on their own `branch_id` for authorization).

## 9. Multi-Branch Users

Users can be assigned to multiple branches concurrently.

1. **Explicit Assignment:** Each branch assignment is explicitly recorded in a many-to-many junction table (e.g., `user_branches`).
2. **Session Context:** When a user authenticates, their session captures all explicitly assigned `branch_id`s.
3. **Current Context:** Users may select a "current" active branch in the UI, which passes a specific `X-Active-Branch-ID` header, but the backend always verifies this ID against the allowed list in the session.

## 10. Canonical Reference Rule

- **Single Source of Truth:** Downstream domains (e.g., HR, Finance) MUST store only the `branch_id` or `organization_id` (UUID).
- **No Duplication:** They must NEVER duplicate organization names, paths, or types in their own tables.
- **Cross-Domain Fetching:** To display organization names, downstream services must query the Organization domain API (`GET /api/v1/organizations/:id`) or rely on API Gateway composition.
