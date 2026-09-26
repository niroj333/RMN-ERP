import { redis, db, logger } from '@rmn-erp/core';
import { EventEnvelope, IEventConsumer } from '../types.js';
import { isProcessed } from './idempotency.service.js';
import { deadLetterEvents } from '../database/schema.js';

export class RedisConsumerService implements IEventConsumer {
  private consumerName: string;
  private running = false;
  
  constructor(consumerName: string) {
    this.consumerName = consumerName;
  }

  async subscribe(topics: string[], handler: (envelope: EventEnvelope) => Promise<void>): Promise<void> {
    this.running = true;
    const stream = 'stream:events'; // Simplified to single stream for now
    const groupName = `${this.consumerName}-group`;
    
    try {
      await redis.xgroup('CREATE', stream, groupName, '0', 'MKSTREAM');
    } catch (e: any) {
      if (!e.message.includes('BUSYGROUP')) {
        logger.error(`Error creating consumer group: ${e.message}`);
      }
    }

    while (this.running) {
      try {
        const results = await redis.xreadgroup(
          'GROUP', groupName, this.consumerName,
          'COUNT', 10,
          'BLOCK', 5000,
          'STREAMS', stream, '>'
        ) as any[];

        if (results && results.length > 0) {
          const streamResults = results[0][1];
          for (const [messageId, fields] of streamResults) {
            const payloadStr = fields[1];
            const envelope = JSON.parse(payloadStr) as EventEnvelope;

            const alreadyProcessed = await isProcessed(this.consumerName, envelope.id);
            
            if (!alreadyProcessed) {
              let success = false;
              let lastError = null;
              
              for (let attempt = 1; attempt <= 5; attempt++) {
                try {
                  await handler(envelope);
                  success = true;
                  break;
                } catch (err: any) {
                  lastError = err.message;
                  await new Promise(r => setTimeout(r, 1000 * attempt)); // Backoff
                }
              }

              if (!success) {
                await db.insert(deadLetterEvents).values({
                  originalEventId: envelope.id,
                  consumerName: this.consumerName,
                  envelope: envelope as any,
                  lastError
                });
              }
            }
            
            await redis.xack(stream, groupName, messageId);
          }
        }
      } catch (err: any) {
        logger.error(`Consumer error: ${err.message}`);
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }

  async unsubscribe(topics: string[]): Promise<void> {
    this.running = false;
  }
}
