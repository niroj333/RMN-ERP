import { db } from '@rmn-erp/core';
import { consumerIdempotency } from '../database/schema.js';

export async function isProcessed(consumerName: string, eventId: string): Promise<boolean> {
  try {
    await db.insert(consumerIdempotency).values({
      consumerName,
      eventId
    });
    return false;
  } catch (error: any) {
    if (error.code === '23505') { // Postgres unique violation
      return true;
    }
    throw error;
  }
}
