# EWP-0201 — Universal Organization Engine

**Status:** Ready for implementation  
**Priority:** P0  
**Architecture:** Frozen  
**Specification:** 1.0.0

## Objective
Create the canonical Organization model for companies, branches, departments and external organizations while enforcing organizational scope.

## Dependencies
EWP-0001 and IAM. Align with ADR-0025 and approved organization model.

## Scope
Organization identity/types; hierarchy; branches/units; addresses/contacts; lifecycle; relationships; external institutions; references.

## Explicitly Out of Scope
Student application rules, procurement-specific vendor logic and full business workflows.

## Business / Engineering Rules
Organizations are canonical. Branches are explicit units with access scope. Hierarchy cannot create accidental cross-branch access.

## Database / Data
Implement approved Volume 05 organization structures and hierarchy constraints; downstream domains reference them.

## API
Organization CRUD/search; hierarchy/unit administration; contacts and references; scoped authorization.

## UI/UX
Organization administration and reusable selectors/search.

## Events
Organization/unit changes where consumers require events.

## Security & Audit
Organization-scope authorization; branch isolation; audit; hierarchy integrity.

## Testing
Hierarchy; isolation; authorization; duplicate prevention; lifecycle; API; audit.

## Acceptance Criteria
Organizations/branches can be managed safely; hierarchy is valid; scope is enforced; changes are audited.

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

