# EWP-0101 — Universal Person Engine

**Status:** Ready for implementation  
**Priority:** P0  
**Architecture:** Frozen  
**Specification:** 1.0.0

## Objective
Create the canonical Person model used by students, employees, family members, contacts and other human actors without duplicate identity models.

## Dependencies
EWP-0001; IAM recommended. Align with Universal Person Engine, Temporal Data, Reference Tables, Data Governance and numbering decisions.

## Scope
Person identity; names/titles; contact methods; addresses; identifiers/document references; relationships; occupation/employment history; lifecycle; provenance; audit/history.

## Explicitly Out of Scope
Student-specific visa/application logic, payroll, organization-specific rules and OCR pipelines.

## Business / Engineering Rules
Downstream domains reference the canonical person. Family-member title supports the approved 'late' value. Occupation includes Employer Name, Address, Start Date and End Date.

## Database / Data
Use approved Volume 05 person/history structures. Do not put student-only fields into the universal entity. Enforce uniqueness only where justified.

## API
Person/contact/address/relationship/occupation CRUD and search; stable identifiers; effective-date/history support.

## UI/UX
Reusable person search/profile and relationship/occupation forms; not the full Student UI.

## Events
Person/relationship/employment history events only where approved.

## Security & Audit
PII protection; domain-scoped access; audit changes; data minimization; safe logs.

## Testing
CRUD; duplicate rules; history; relationship; 'late' title; occupation date validation; authorization; audit; API tests.

## Acceptance Criteria
Canonical person can be created/referenced; history works; family/occupation requirements work; unauthorized PII access fails.

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

