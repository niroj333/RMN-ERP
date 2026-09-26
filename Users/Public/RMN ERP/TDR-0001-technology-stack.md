# TDR-0001 — Technology Architecture Baseline

**Status:** Approved  
**Priority:** P0  
**Version:** 1.0.0  
**Date:** 2026-09-23  
**Decided by:** DAB (Project Owner)

---

## Objective

Formalize the approved technology stack, architectural pattern, and engineering conventions for the RMN ERP greenfield implementation. All EWPs and ADR implementation packages reference this record as the authoritative technology baseline.

## Baseline

### Runtime & Language

| Component | Decision |
|:---|:---|
| Runtime | Node.js 20 LTS |
| Language | TypeScript 5.x (strict mode) |
| Package manager | pnpm |
| Monorepo | pnpm workspaces |

### Backend Framework

| Component | Decision |
|:---|:---|
| HTTP framework | Fastify |
| API style | REST |
| API specification | OpenAPI 3.1 |
| API versioning | URL-based (`/api/v1/...`) |
| Validation | Zod (runtime + compile-time schema validation) |

### Database

| Component | Decision |
|:---|:---|
| Database engine | PostgreSQL 16 |
| ORM | Drizzle ORM |
| Migration tool | Drizzle Kit |
| Migration strategy | SQL migrations under version control; deterministic; forward and rollback |
| Schema authority | Volume 05 — Database Engineering (pending recovery) |

### Cache & Runtime Infrastructure

| Component | Decision |
|:---|:---|
| Cache / sessions | Redis 7 |
| Session runtime | Redis-backed server sessions |
| IAM source of truth | PostgreSQL (Redis is runtime layer only, not IAM authority) |

### Authentication & Sessions

| Component | Decision |
|:---|:---|
| Session transport | httpOnly + Secure + SameSite cookies |
| Session store | Redis-backed server sessions |
| Password hashing | Argon2id |
| MFA | TOTP / Google Authenticator (RFC 6238) |
| Session revocation | Server-side invalidation via Redis + PostgreSQL |

### Event Architecture

| Component | Decision |
|:---|:---|
| Pattern | Transactional Outbox |
| Initial transport | Redis Streams |
| Transport abstraction | Yes — Kafka/RabbitMQ can be introduced later behind the same interface |
| Delivery guarantee | At-least-once |
| Consumer pattern | Idempotent consumers with deduplication |

### Architecture Pattern

| Component | Decision |
|:---|:---|
| Architecture | Modular Monolith |
| Design approach | Domain-Driven Design (DDD) |
| API design | API-first |
| Extensibility | Plugin-first |
| Communication | Event-driven (cross-domain via events, not direct table access) |
| Domain boundaries | Each domain owns its tables exclusively |

### Logging & Observability

| Component | Decision |
|:---|:---|
| Structured logging | Pino (JSON, correlation-ID aware) |
| Secret protection | Automatic redaction of tokens/secrets/PII in logs |
| Correlation | `X-Correlation-ID` propagated through all layers |
| Health probe | `/health` (liveness) |
| Readiness probe | `/ready` (dependency checks — distinct from health) |

### Testing

| Component | Decision |
|:---|:---|
| Test runner | Vitest |
| API testing | Supertest |
| Database testing | Testcontainers (real PostgreSQL in tests) |
| Test types | Unit, Integration, API/Contract, E2E |
| CI quality gates | Lint → Type-check → Test → Secret scan → Dependency audit → Migration check |

### Documentation

| Component | Decision |
|:---|:---|
| Documentation style | Markdown / Docs-as-Code |
| API documentation | OpenAPI 3.1 (auto-generated + contract-first) |
| Architecture governance | ADR / RFC / EWP / TDR |

### Deployment

| Component | Decision |
|:---|:---|
| Development / CI / Staging | Docker Compose (PostgreSQL + Redis + app) |
| Containerization | Docker (multi-stage build) |
| Production architecture | Deferred — to be finalized before production deployment |

---

## Explicitly Rejected (For Now)

| Technology | Reason |
|:---|:---|
| Microservices | Premature operational complexity before business domains are proven |
| Kubernetes | Premature; introduce only when HA/multi-region requires it |
| Kafka | Premature at current scale; Redis Streams behind transport abstraction is sufficient |
| RabbitMQ | Same as Kafka — can be introduced later if justified |
| SMS MFA | Not approved in MFA policy |
| Biometrics | Not approved in MFA policy |
| Hardware keys (FIDO/WebAuthn) | Not approved in MFA policy |
| Prisma | Too opinionated for architecture-first approach; Drizzle is more SQL-transparent |
| JWT for sessions | httpOnly cookies are safer for internal browser ERP; avoids exposing tokens to JavaScript |

---

## Architectural Principle

```
Redis is the RUNTIME session layer
PostgreSQL is the SOURCE OF TRUTH for IAM

Session lifecycle:
    Login → PostgreSQL records session → Redis caches active session
    Request → Redis validates session (fast path)
    Logout → Redis invalidated → PostgreSQL updated
    Revocation → PostgreSQL marks revoked → Redis cleared
```

---

## Domain Boundary Rules

1. Domains communicate through **events** or **explicit service interfaces** — never by directly querying another domain's tables
2. Each domain **owns** its database tables exclusively
3. Cross-domain reads go through **published API contracts**
4. The Event Infrastructure provides the backbone for **async cross-domain communication**
5. Future domains (CRM, DMS, Finance, HR) follow the same bounded-context pattern

---

## Pending Dependencies

> This TDR is approved as the technology baseline. However, the following authoritative specifications must be recovered before implementation begins:

| Document | Status | Blocks |
|:---|:---|:---|
| Volume 05 — Database Engineering | ❌ Not recovered | All database schemas |
| Volume 06 — API & Error Contract | ❌ Not recovered | All API implementations |
| Volume 07 — UI/UX Engineering | ❌ Not recovered | All UI work (not backend-blocking) |
| ADR-0010 — IAM Architecture | ❌ Not recovered | EWP-0002 |
| ADR-0018 — Universal Numbering | ❌ Not recovered | EWP-1001 (Student ID) |
| ADR-0025 — Organization Model | ❌ Not recovered | EWP-0201 |
| ADR-0026 — Event Architecture | ❌ Not recovered | EWP-0026 |

---

## Agent Rules

- This TDR is the authoritative technology reference for all RMN ERP implementation.
- Do not introduce technologies not listed here without a new TDR or ADR.
- Do not substitute Redis for PostgreSQL as the IAM source of truth.
- Do not introduce microservices, Kubernetes, or Kafka without explicit approval.
- If a technology conflict arises, STOP and raise a TDR amendment.
