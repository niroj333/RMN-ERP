# EWP-1001 — Student Vertical Slice — Registration to Student 360

**Status:** Ready for implementation  
**Priority:** P0  
**Architecture:** Frozen  
**Specification:** 1.0.0

## Objective
Prove the architecture with the first complete business slice: registration → person/profile → family/occupation → document reference → timeline → Student 360° → audit.

## Dependencies
EWP-0001 through EWP-0101/0201 plus Event Infrastructure, Master Data and Metadata. DMS foundation must support document references.

## Scope
Student registration; profile; branch scope; family members including 'late' title; occupation with Employer Name, Address, Start Date, End Date; document references; timeline; Student 360 read model; audit.

## Explicitly Out of Scope
Full COE/embassy/visa/travel workflow, finance, HR, OCR automation, advanced AI and full CRM.

## Business / Engineering Rules
Student is linked to canonical Person. Student ID follows ADR-0018. Branch ownership is explicit. Registration and material changes are auditable.

## Database / Data
Only approved tables required for this slice. Include person/student relation, branch scope, family relation, occupation history, timeline/audit references. Use migrations and fixtures.

## API
Registration, profile, family, occupation, document-reference, timeline and Student 360 APIs. Enforce permissions server-side.

## UI/UX
Registration/profile/family/occupation forms; Student 360; timeline; permission-aware states. Glass only on suitable summary surfaces; forms stay solid/readable.

## Events
Student registered/profile updated/family linked/occupation updated/document linked/timeline events as approved, with correlation/causation.

## Security & Audit
PII protection; branch isolation; role-based actions; audit; safe logging; duplicate prevention.

## Testing
End-to-end registration; branch isolation; validation; duplicate handling; 'late' title; occupation dates; Student 360 consistency; audit; API; accessibility; performance smoke tests.

## Acceptance Criteria
A staff user can register a student within permitted scope; canonical person linkage works; family/occupation requirements work; Student 360 is consistent; all changes are auditable; E2E passes.

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

