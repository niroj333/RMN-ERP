# EWP-0003 — MFA & Step-Up Authentication

**Status:** Ready for implementation  
**Priority:** P0  
**Architecture:** Frozen  
**Specification:** 1.0.0

## Objective
Implement mandatory MFA for Super Admin, HR, Finance, Documentation and Branch Managers, using the approved Google Authenticator/TOTP approach, plus step-up authentication for sensitive operations.

## Dependencies
EWP-0002. Align with approved MFA Policy and step-up authentication decision.

## Scope
TOTP enrollment; protected secret handling; verification; role-based MFA enforcement; challenge; recovery/reset workflow; step-up challenge; expiry/session binding; audit.

## Explicitly Out of Scope
SMS MFA, biometrics, hardware keys or user bypasses unless separately approved.

## Business / Engineering Rules
Required roles cannot access protected areas until MFA succeeds. Step-up is short-lived and bound to the authenticated session/action.

## Database / Data
Store MFA configuration securely; never store raw one-time codes. Record enrollment/status and verification metadata according to data governance.

## API
Enrollment; verification; MFA status; privileged reset; challenge; step-up verification; standardized failures. Never return secrets after enrollment.

## UI/UX
Enrollment/provisioning and verification screens; step-up modal; accessible error/recovery states.

## Events
MFA enabled/verified/reset and step-up events where approved; never include raw codes/secrets.

## Security & Audit
Secret protection; rate limiting; replay resistance; expiry; session binding; privileged reset audit; no bypass.

## Testing
TOTP correctness; replay; expiry; brute-force; role enforcement; step-up; recovery; audit; security testing.

## Acceptance Criteria
Required roles cannot bypass MFA; valid authenticator codes work; invalid/replayed/expired codes fail; sensitive operations require step-up; resets are audited.

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

