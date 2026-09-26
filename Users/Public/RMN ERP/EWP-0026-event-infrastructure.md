# EWP-0026 — Event Infrastructure

**Status:** Ready for implementation  
**Priority:** P0  
**Architecture:** Frozen  
**Specification:** 1.0.0

## Objective
Implement the infrastructure required by ADR-0026 for publishing, transporting, consuming, retrying, observing and tracing domain events.

## Dependencies
EWP-0001. Transport/broker choice must be formally selected before implementation.

## Scope
Event envelope; IDs; type/version; timestamps; producer/consumer contracts; transport abstraction; retries; dead-letter handling; idempotency/deduplication; correlation/causation; observability.

## Explicitly Out of Scope
Full business event catalogue and arbitrary CRUD events.

## Business / Engineering Rules
Events are immutable facts. Consumers are idempotent. Schema versions must not silently break consumers. Assume at-least-once delivery unless explicitly specified otherwise.

## Database / Data
Persist event registry/checkpoints/idempotency data only where required by the chosen architecture.

## API
Internal event infrastructure and operational diagnostics; no uncontrolled public event bus.

## UI/UX
No end-user UI required; operational diagnostics only if approved.

## Events
Support versioned event contracts, retry/dead-letter signals and tracing metadata.

## Security & Audit
Secure transport; protected credentials; sensitive payload minimization; audit event administration.

## Testing
Serialization; schema compatibility; duplicate delivery; retry; dead-letter; correlation; idempotency; recovery.

## Acceptance Criteria
Events publish/consume reliably; duplicate delivery does not duplicate effects; failures are observable/recoverable; versioning works.

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

