# EWP-0001 — Core Platform Foundation

**Status:** Ready for implementation  
**Priority:** P0  
**Architecture:** Frozen  
**Specification:** 1.0.0

## Objective
Create the executable application foundation used by every later domain: application bootstrap, configuration boundary, migration framework, common errors, correlation IDs, health/readiness, structured logging, test harness and CI quality hooks.

## Dependencies
None. This is the first implementation package. Any unapproved technology choice must be resolved through the technology-decision process before it becomes a permanent dependency.

## Scope
Repository/application skeleton; environment configuration; database connection abstraction; migration mechanism; standard error envelope; request/correlation IDs; health/readiness; structured logging; testing harness; CI hooks; shared conventions.

## Explicitly Out of Scope
Business-domain tables, users, MFA, student workflows, AI/OCR providers and production cloud infrastructure.

## Business / Engineering Rules
Keep domain logic out of the foundation. Secrets are never committed. Health and readiness are distinct. External errors use the Volume 06 error contract.

## Database / Data
Only shared infrastructure objects explicitly required by Volume 05. No speculative business tables. Establish deterministic migrations and rollback strategy.

## API
Versioned API bootstrap; health/readiness; standardized error handling; correlation-ID propagation; validation hooks; API documentation scaffold.

## UI/UX
Only developer-facing foundation primitives; no full application shell.

## Events
Infrastructure/observability events only where required; no arbitrary CRUD event stream.

## Security & Audit
Secure configuration; safe logs; no secrets/tokens in logs; deny-by-default protected routes.

## Testing
Build; migration; configuration; error contract; correlation; health/readiness; secret scanning; static analysis; dependency/security scanning.

## Acceptance Criteria
Fresh environment initializes from documentation; migrations are deterministic; health/readiness work; errors conform to Volume 06; correlation IDs propagate; CI passes.

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

