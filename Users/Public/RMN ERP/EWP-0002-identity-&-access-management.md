# EWP-0002 — Identity & Access Management

**Status:** Ready for implementation  
**Priority:** P0  
**Architecture:** Frozen  
**Specification:** 1.0.0

## Objective
Implement the approved IAM boundary: users, authentication lifecycle, roles, permissions, organization/branch scope, sessions and server-side authorization.

## Dependencies
EWP-0001. Align with ADR-0010, Data Governance, IAM policy and Volumes 05/06.

## Scope
User lifecycle; authentication; logout/session controls; roles; permissions; role assignments; organization/branch scope; authorization policy service/middleware; account status; security events; admin APIs.

## Explicitly Out of Scope
MFA and step-up implementation; business-domain permissions; external identity providers not yet approved.

## Business / Engineering Rules
Authorization is server-side and deny-by-default. Branch users can access only permitted branch data. Privileged actions are auditable.

## Database / Data
Use approved IAM schema. Never store plaintext credentials. Preserve temporal/audit requirements.

## API
Authentication, user lifecycle, roles/permissions, current-user context, session control and authorization-failure endpoints/contracts.

## UI/UX
Login/logout and admin screens; access-denied states. UI never replaces server authorization.

## Events
Security-relevant authentication and policy events as defined by the event catalogue; never emit credentials/tokens.

## Security & Audit
Least privilege; session invalidation; brute-force protections; branch isolation; privileged audit; no sensitive logs.

## Testing
Authentication; authorization matrix; branch isolation; privilege escalation; session invalidation; audit; negative tests; security scans.

## Acceptance Criteria
Users authenticate; permissions enforce correctly; branch boundaries are enforced server-side; privileged actions are audited; invalid sessions fail.

## Definition of Done
- [ ] Implementation complete
- [ ] Database migrations/fixtures complete where applicable
- [ ] API contracts documented and tested
- [ ] UI implemented/tested where applicable
- [ ] Authorization tested server-side
- [ ] Audit behaviour verified
- [ ] Unit/integration/E2E tests appropriate to scope pass
- [ ] Documentation and traceability updated
- [ ] CI quality gates pass
- [ ] Human review complete

## Agent Rules
- Read this EWP and all linked approved specifications before coding.
- Do not change frozen architecture silently.
- Do not invent missing requirements.
- Do not bypass authorization, migrations, audit, or tests.
- Keep implementation scoped to this EWP.
- If a conflict requires an architectural change, STOP and raise an ADR/RFC.

