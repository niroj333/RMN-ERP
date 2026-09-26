import { db, logger } from '@rmn-erp/core';
import { eq } from 'drizzle-orm';
import { outboxEvents } from '../database/schema.js';
import { redisPublisher } from './redis-publisher.service.js';
import { EventEnvelope } from '../types.js';

export class OutboxRelayWorker {
  private timer: NodeJS.Timeout | null = null;

  start() {
    this.timer = setInterval(async () => {
      try {
        const events = await db.select().from(outboxEvents).where(eq(outboxEvents.status, 'PENDING')).limit(50);
        
        if (events.length > 0) {
          const envelopes = events.map(e => ({
            id: e.id,
            type: e.eventType,
            version: 1,
            aggregateType: e.aggregateType,
            aggregateId: e.aggregateId,
            payload: e.payload,
            correlationId: e.correlationId,
            causationId: e.causationId,
            producer: e.producer,
            timestamp: e.createdAt.toISOString()
          })) as EventEnvelope[];

          await redisPublisher.publishBatch(envelopes);
          
          for (const ev of events) {
            await db.update(outboxEvents)
              .set({ status: 'PUBLISHED', publishedAt: new Date() })
              .where(eq(outboxEvents.id, ev.id));
          }
        }
      } catch (err: any) {
        logger.error(`Outbox relay error: ${err.message}`);
      }
    }, 5000);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

export const outboxRelayWorker = new OutboxRelayWorker();
