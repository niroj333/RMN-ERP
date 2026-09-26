import { redis } from '@rmn-erp/core';
import { EventEnvelope, IEventPublisher } from '../types.js';

export class RedisPublisherService implements IEventPublisher {
  async publish(envelope: EventEnvelope): Promise<void> {
    await redis.xadd('stream:events', '*', 'payload', JSON.stringify(envelope));
  }

  async publishBatch(envelopes: EventEnvelope[]): Promise<void> {
    const pipeline = redis.pipeline();
    for (const env of envelopes) {
      pipeline.xadd('stream:events', '*', 'payload', JSON.stringify(env));
    }
    await pipeline.exec();
  }
}

export const redisPublisher = new RedisPublisherService();
