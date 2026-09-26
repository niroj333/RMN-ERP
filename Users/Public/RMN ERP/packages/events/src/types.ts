export interface EventEnvelope<T = unknown> {
  id: string;
  type: string;
  version: number;
  aggregateType: string;
  aggregateId: string;
  payload: T;
  correlationId: string;
  causationId?: string | null;
  producer: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface IEventPublisher {
  publish(envelope: EventEnvelope): Promise<void>;
  publishBatch(envelopes: EventEnvelope[]): Promise<void>;
}

export interface IEventConsumer {
  subscribe(topics: string[], handler: (envelope: EventEnvelope) => Promise<void>): Promise<void>;
  unsubscribe(topics: string[]): Promise<void>;
}
