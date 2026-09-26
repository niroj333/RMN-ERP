# ADR-0010: Identity & Access Management Architecture

**Status:** Accepted
**Date:** 2026-09-23
**Related EWPs:** EWP-0002, EWP-0003
**Related TDRs:** TDR-0001

## 1. Context & Decision

RMN ERP is a multi-branch enterprise application handling sensitive operational and financial data. The system requires a robust Identity & Access Management (IAM) foundation to securely identify users, manage their sessions, and enforce fine-grained authorization. A decision must be made regarding the core mechanisms for authentication, session management, and authorization, considering the requirements for strict auditing, branch isolation, and mandatory Multi-Factor Authentication (MFA) for privileged roles.

**Decision:**
We will implement a stateful, session-based authentication model backed by PostgreSQL and Redis. Authorization will follow a Role-Based Access Control (RBAC) model extended with Branch Scope (context-aware RBAC), operating on a strict deny-by-default basis.

## 2. Authentication Model

Authentication in RMN ERP relies on stateful sessions rather than stateless JWTs. This approach allows for immediate session revocation, accurate concurrent session tracking, and centralized control over active logins.

1. **Transport:** Authentication tokens (Session IDs) are transmitted exclusively via cookies.
2. **Cookie Security:** Cookies must be configured as `httpOnly`, `Secure` (over HTTPS), and `SameSite=Strict`.
3. **MFA Enforcement:** MFA (TOTP / Google Authenticator) is mandatory for Super Admin, HR, Finance, Documentation, and Branch Managers (per EWP-0003). Authentication flows must support partial login states to handle MFA verification before issuing a full session.
4. **Password Hashing:** Passwords are hashed using Argon2id. Plaintext passwords must never be logged or stored.

## 3. Session Management

Session data requires both durability (for audit and management) and high performance (for validation on every request).

1. **Source of Truth:** PostgreSQL is the ultimate source of truth for all sessions (`sessions` table), tracking creation, expiry, user agent, IP address, and status.
2. **Runtime Cache:** Redis 7 serves as the runtime layer. The API middleware queries Redis to validate sessions on every request.
3. **Lifecycle:**
   - **Creation:** Upon successful login (and MFA if required), a session is created in PostgreSQL and cached in Redis.
   - **Validation:** API requests include the cookie. Middleware checks Redis. If missing in Redis but valid in DB, it is re-cached.
   - **Invalidation:** Logout or admin revocation immediately deletes the session from Redis and marks it invalid/deleted in PostgreSQL.
4. **Concurrent Sessions:** The system supports tracking multiple concurrent sessions per user. Security policies may restrict the maximum number of concurrent sessions based on role.

## 4. Step-Up Authentication Architecture

EWP-0003 requires step-up authentication for sensitive operations. This section defines the architectural mechanics.

1. **Purpose:** Step-up provides a short-lived elevated authentication state within an existing session, required before performing sensitive actions (e.g., modifying roles, resetting MFA, changing financial data, bulk operations).
2. **State Storage:**
   - **PostgreSQL:** The `step_up_challenges` table records the challenge: `id`, `user_id`, `session_id`, `action` (the sensitive operation being authorized), `verified` (boolean), `expires_at`, `created_at`.
   - **Redis:** Upon successful verification, a short-lived Redis key is set: `stepup:{session_id}:{action}` with a TTL matching the expiry window. This allows fast middleware checks without hitting the database on every request.
3. **Lifecycle:**
   - **Initiation:** When a user attempts a sensitive action, the API returns `403` with error code `STEP_UP_REQUIRED` and a `challengeId`. A row is created in `step_up_challenges` with `verified = false`.
   - **Verification:** The user submits their TOTP code against the challenge. On success, `verified = true` is set in PostgreSQL and the Redis key is created.
   - **Authorization:** The middleware protecting the sensitive action checks for a valid Redis key `stepup:{session_id}:{action}`. If missing or expired, step-up is re-required.
   - **Expiry:** Step-up tokens are short-lived (e.g., 5 minutes). Redis TTL handles automatic expiry. A background cleanup removes expired PostgreSQL rows.
4. **Binding Rules:**
   - Step-up is bound to the **specific session** — a different session cannot reuse it.
   - Step-up is bound to a **specific action category** — step-up for `role:modify` does not grant step-up for `mfa:reset`.
   - Step-up is **single-use or time-boxed** — either consumed on first use or valid for a short window (configurable per action).
5. **Replay Resistance:** Each TOTP code can only be used once within its time window (tracked in Redis to prevent replay across step-up and login flows).

## 5. Authorization Model

Authorization is evaluated entirely server-side. The default stance is **deny-by-default**.

1. **RBAC:** Users are assigned Roles, which contain Collections of Permissions.
2. **Context-Aware:** Authorization is not just "Can the user read persons?" but "Can the user read persons *in this branch*?".
3. **Middleware:** API endpoints are protected by authorization middleware that checks both the user's permissions and their scope for the requested resource.

## 6. Permission Structure

Permissions follow a granular `resource:action` format.

- **Format:** `[resource]:[action]`
- **Examples:** `student:create`, `person:read`, `invoice:delete`, `system:audit`
- Permissions are strictly defined in the code and database. They are not arbitrary strings.

## 7. Role Definitions

Roles aggregate permissions.

1. **System Roles:** Pre-defined roles that cannot be deleted or fundamentally altered.
   - **Super Admin:** Global access, unrestricted.
   - **HR:** Human resources management.
   - **Finance:** Financial operations and reporting.
   - **Documentation:** Document and record management.
   - **Branch Manager:** Full administrative access within their assigned branch(es).
   - **Staff:** Standard operational access within assigned branch(es).
2. **Custom Roles:** Administrators can define custom roles by composing specific permissions to fit localized needs.

## 8. Branch Scope

A critical requirement of RMN ERP is strict branch isolation.

1. **Scope Assignment:** When a role is assigned to a user, it must be scoped. The scope is either `GLOBAL` (all branches) or a specific list of `branch_id`s.
2. **Multi-Branch Users:** A user can be associated with multiple branches. For example, a regional manager might have `Branch Manager` role scoped to `Branch A` and `Branch B`.
3. **Data Access:** When querying data, the backend must automatically apply filtering based on the user's authorized branch scope for that specific entity type. A Branch user can access only permitted branch data.

## 9. Account Lifecycle

User accounts follow a defined state machine.

- `PENDING`: Account created, awaiting initial setup or verification. Cannot log in.
- `ACTIVE`: Normal operational state. Can log in.
- `SUSPENDED`: Temporarily disabled by an administrator. Cannot log in. Existing sessions are terminated.
- `LOCKED`: Automatically disabled due to security triggers (e.g., brute-force attempts). Cannot log in until unlocked by admin or cooldown expires.

## 10. Brute-Force Protection

The system must protect against credential stuffing and brute-force attacks.

1. **Attempt Tracking:** Failed login attempts are tracked per username and per IP address in Redis.
2. **Lockout Rules:** After N consecutive failed attempts (e.g., 5), the account enters the `LOCKED` state.
3. **Cooldown:** A locked account remains locked for a defined cooldown period (e.g., 15 minutes) or until manually unlocked by an administrator.

## 11. Security Events

IAM operations must emit domain events for audit and reactive processing via the Transactional Outbox pattern.

- `UserLoggedIn` (Includes session ID, IP, MFA status)
- `UserLoggedOut`
- `AuthenticationFailed` (Includes reason, IP)
- `AccountLocked`
- `RoleAssigned` / `RoleRevoked`
- `PasswordChanged`
- `StepUpVerified` (Includes action, session ID)
- `StepUpFailed` (Includes action, reason)

## 12. Audit Requirements

All privileged actions must be auditable.

1. **Definition of Privileged:** Any action modifying user access, roles, system configuration, or financial records.
2. **Audit Trail:** The `created_by` and `updated_by` columns on all domain tables provide basic lineage.
3. **Event Log:** The security events detailed above provide an immutable ledger of IAM activities.

## 13. Data Governance

1. **PII Handling:** User details (names, emails) are subject to PII protection standards.
2. **Credential Storage:** As specified, Argon2id for passwords. No plaintext storage of tokens or secrets.
3. **Log Safety:** Application and system logs must be scrubbed of passwords, session cookies, and sensitive PII before storage or aggregation.

## Consequences

- **Positive:** High security, immediate revocation capability, strict auditability, explicit branch data isolation.
- **Negative:** Increased database and Redis traffic due to session validation on every request. Increased complexity in query construction to enforce branch scopes.
