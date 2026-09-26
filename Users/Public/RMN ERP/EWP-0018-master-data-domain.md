# EWP-0018 — Master Data Domain

**Status:** Ready for implementation  
**Priority:** P0  
**Architecture:** Frozen  
**Specification:** 1.0.0

## Objective
Implement governed master/reference data so business domains use controlled stable values rather than uncontrolled hard-coded enumerations.

## Dependencies
EWP-0001, IAM and Event Infrastructure. Align with Master Data Domain, Reference Tables and Data Governance.

## Scope
Definitions; values; status; effective dates; ordering/display metadata where approved; activation/deactivation; administration; audit.

## Explicitly Out of Scope
Transactional business records and unrestricted replacement of every free-form field.

## Business / Engineering Rules
Master data changes are governed and audited. Transactions reference stable IDs rather than display labels.

## Database / Data
Implement approved reference/master tables and history. Do not delete values when historical records depend on them.

## API
Read/search/admin APIs; status/effective-date filtering; protected writes.

## UI/UX
Admin screens and reusable selectors.

## Events
Master-data changes where consumers require them.

## Security & Audit
Only authorized roles can modify; changes audited; historical integrity protected.

## Testing
Reference integrity; effective dates; authorization; audit; concurrency; API and regression tests.

## Acceptance Criteria
Domains consume governed values; administrators can safely manage them; historical meaning remains intact.

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

