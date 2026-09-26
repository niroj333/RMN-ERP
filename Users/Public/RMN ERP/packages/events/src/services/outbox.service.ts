import { EventEnvelope } from '../types.js';
import { outboxEvents } from '../database/schema.js';

export async function insertOutboxEvent(tx: any, envelope: EventEnvelope) {
  await tx.insert(outboxEvents).values({
    id: envelope.id,
    eventType: envelope.type,
    aggregateType: envelope.aggregateType,
    aggregateId: envelope.aggregateId,
    payload: envelope.payload,
    correlationId: envelope.correlationId,
    causationId: envelope.causationId,
    producer: envelope.producer,
    status: 'PENDING'
  });
}
