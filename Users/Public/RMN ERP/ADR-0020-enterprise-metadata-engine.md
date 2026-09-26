# ADR-0020 — Enterprise Metadata Engine

**Status:** Ready for implementation  
**Priority:** P0  
**Architecture:** Frozen  
**Specification:** 1.0.0

## Objective
Implement the approved metadata capability for governed configurable fields, labels, display rules and extensibility without uncontrolled runtime schema/code changes.

## Dependencies
EWP-0001, IAM, Master Data, UPE/UOE foundations. Align with ADR-0020 and plugin-first architecture.

## Scope
Metadata definitions; types; validation metadata; labels/localization hooks; visibility/configuration; versioning; scope; audit; safe resolution.

## Explicitly Out of Scope
Arbitrary runtime code execution, unrestricted schema mutation, user SQL and bypass of domain invariants.

## Business / Engineering Rules
Metadata augments approved models; it cannot override security, integrity or mandatory business rules.

## Database / Data
Store versioned metadata definitions according to Volume 05. Validate types/references. Separate metadata configuration from transactional data.

## API
Admin CRUD; resolution/read API; validation metadata; versioned publish/configuration endpoints.

## UI/UX
Admin configuration/preview and approved dynamic field rendering hooks; not a universal no-code builder.

## Events
Metadata/configuration changes where required; all versions traceable.

## Security & Audit
Only authorized admins modify metadata; changes are versioned/audited; metadata never grants permissions.

## Testing
Validation; version compatibility; authorization; audit; rollback/publish; resolution performance.

## Acceptance Criteria
Valid metadata can be created/versioned/published; applications resolve it; invalid metadata cannot corrupt core data; security remains independent.

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

