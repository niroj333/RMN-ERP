# ADR-0026: Event Infrastructure Architecture

## Status
**Status:** Accepted
**Date:** 2026-09-23

## 1. Context & Decision

RMN ERP is designed as a modular monolith using Domain-Driven Design (DDD). To ensure modules remain decoupled while communicating state changes, an Event-Driven Architecture (EDA) is employed. The system must support asynchronous execution, decoupled interactions, and eventually consistent data projections.

Based on TDR-0001, we require:
- **Pattern:** Transactional Outbox to prevent dual-write problems.
- **Initial Transport:** Redis Streams.
- **Transport Abstraction:** The underlying transport mechanism must be abstracted, allowing migration to systems like Kafka or RabbitMQ as the system scales.
- **Delivery Guarantee:** At-least-once delivery.

**Decision:** We adopt a Transactional Outbox pattern implemented natively in PostgreSQL alongside domain tables, polled asynchronously (or via WAL tailing in the future), and published to a transport-agnostic interface backed initially by Redis Streams. Consumers will be inherently idempotent, leveraging a dedicated idempotency store.

## 2. Event Envelope Specification

All events must adhere to a strict envelope contract. No domain event is permitted to omit these fields.

```typescript
interface EventEnvelope<T = unknown> {
  id: string;               // UUID v4: Unique identifier for the specific event instance
  type: string;             // e.g., 'iam.user.registered'
  version: string;          // e.g., '1' or 'v1'
  aggregateType: string;    // e.g., 'user'
  aggregateId: string;      // UUID v4: The primary key of the aggregate
  payload: T;               // The domain-specific event data
  correlationId: string;    // UUID v4: Trace ID of the original request/action
  causationId?: string;     // UUID v4: ID of the event that directly caused this event
  producer: string;         // Module/Service name originating the event
  timestamp: string;        // ISO 8601 UTC timestamp of creation
  metadata?: Record<string, unknown>; // Optional infrastructure/tracing metadata
}
```

## 3. Event Type Naming Convention

Event types must be structured, predictable, and represent facts that have already happened.
**Format:** `<domain>.<entity>.<action_past_tense>`

Examples:
- `iam.user.login_succeeded`
- `academic.student.registered`
- `billing.invoice.paid`

## 4. Schema Versioning

- **Immutability:** Event schemas are immutable once published to production.
- **Backward Compatibility:** Additive changes (new optional fields) to `payload` are permitted without a version bump.
- **Breaking Changes:** Any removal, renaming, or type change of fields requires a new event version (e.g., `version: "2"`).
- **Versioning Strategy:** Version bumps result in concurrent processing of multiple versions by consumers until legacy producers are decommissioned. Consumers must not silently break on unknown versions; they should route to DLQ if they cannot handle a strict version requirement.

## 5. Transactional Outbox Pattern

To guarantee atomicity between domain state changes and event emission:
1. **Business Transaction:** An API request initiates a PostgreSQL transaction.
2. **State & Event Writing:** The domain tables are updated, and the event envelope is inserted into the `outbox_events` table within the same transaction.
3. **Commit:** The transaction is committed.
4. **Publishing:** A background process (Outbox Relay) polls the `outbox_events` table, publishes pending events via the Abstract Transport Interface (Redis Streams), and updates the event status.

## 6. Outbox Table Specification

```sql
CREATE TABLE outbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(255) NOT NULL,
    aggregate_type VARCHAR(100) NOT NULL,
    aggregate_id UUID NOT NULL,
    payload JSONB NOT NULL,
    correlation_id UUID NOT NULL,
    causation_id UUID,
    producer VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    error TEXT,
    CONSTRAINT ck_outbox_events_status CHECK (status IN ('PENDING', 'PUBLISHED', 'FAILED', 'ARCHIVED'))
);

CREATE INDEX idx_outbox_events_status_created ON outbox_events(status, created_at) WHERE status = 'PENDING';
```

**Lifecycle:** `PENDING` → `PUBLISHED` → `ARCHIVED` (via partition pruning or scheduled cleanup).

## 7. Consumer Contract

- **At-Least-Once:** Consumers assume events may be delivered more than once.
- **Idempotency:** Processing the same `event.id` multiple times must yield the same system state as processing it once.
- **Checkpointing:** Consumers must explicitly acknowledge (ACK) processing success to the transport.
- **Error Handling:** Unhandled exceptions must not advance the consumer offset. The event must be retried based on the retry strategy.

## 8. Idempotency Store

To enforce idempotency, consumers utilize a deduplication table in PostgreSQL.

```sql
CREATE TABLE consumer_idempotency (
    consumer_name VARCHAR(100) NOT NULL,
    event_id UUID NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (consumer_name, event_id)
);
```
*Flow:* Before processing, a consumer attempts to insert a record. If a Unique Constraint Violation occurs, the event is treated as already processed and acknowledged without side effects.

## 9. Retry Strategy

- **Transient Errors:** Errors like DB locks or network timeouts trigger retries.
- **Backoff:** Exponential backoff mechanism (e.g., base delay * 2^attempt).
- **Limit:** Maximum of 5 retry attempts.
- **Poison Pills:** Non-transient errors (e.g., schema validation failure) bypass retries and route directly to the Dead Letter Queue (DLQ).
- After max attempts are exhausted, the event is routed to the DLQ.

## 10. Dead Letter Queue (DLQ)

Messages that cannot be processed are moved to a DLQ for manual intervention.

```sql
CREATE TABLE dead_letter_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_event_id UUID NOT NULL,
    consumer_name VARCHAR(100) NOT NULL,
    envelope JSONB NOT NULL,
    last_error TEXT NOT NULL,
    failed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(30) NOT NULL DEFAULT 'UNRESOLVED',
    resolved_at TIMESTAMPTZ,
    resolved_by UUID,
    CONSTRAINT ck_dlq_status CHECK (status IN ('UNRESOLVED', 'REPLAYED', 'DISMISSED'))
);

CREATE INDEX idx_dlq_unresolved ON dead_letter_events(consumer_name, failed_at) WHERE status = 'UNRESOLVED';
```
- A CLI/Admin UI is required to view, dismiss, or replay DLQ events.

## 11. Correlation & Causation

To ensure traceability across asynchronous boundaries:
- **Correlation ID:** Maps directly to the incoming API Request ID (`X-Correlation-ID`). It remains unchanged across the entire causal chain.
- **Causation ID:** If Event A triggers an action that emits Event B, Event B's `causationId` is set to Event A's `id`.

## 12. Transport Abstraction

The infrastructure code must decouple domain logic from Redis Streams.

```typescript
export interface IEventPublisher {
  publish(event: EventEnvelope): Promise<void>;
  publishBatch(events: EventEnvelope[]): Promise<void>;
}

export interface IEventConsumer {
  subscribe(topics: string[], handler: (event: EventEnvelope) => Promise<void>): void;
  unsubscribe(): Promise<void>;
}
```
**Initial Implementation:** Redis Streams (`XADD`, `XREADGROUP`, `XACK`).
**Future Migrations:** Implementation can be swapped at the IoC container level without changing application logic.

## 13. Observability

- **Metrics:** 
  - `event_publish_rate`: Events published per second.
  - `consumer_lag`: Difference between last published event timestamp and last processed event timestamp.
  - `dlq_depth`: Number of unresolved messages in DLQ.
  - `event_processing_duration`: Histogram of processing time.
- **Logging:** All publish and consume operations log the `event.id`, `correlationId`, and `type`.
- **Tracing:** APM spans must link producer and consumer traces using the correlation ID and metadata headers.

## 14. Security

- **Payload Sanitization:** No plain text credentials, tokens, or highly sensitive PII may be serialized into event payloads. If PII is necessary, it must be encrypted or passed by reference.
- **Transport Security:** Redis connections must enforce TLS (`rediss://`).
- **Access Control:** The Outbox Poller and Consumers authenticate with IAM policies restricting cross-domain direct access, relying strictly on authorized topics/streams.
