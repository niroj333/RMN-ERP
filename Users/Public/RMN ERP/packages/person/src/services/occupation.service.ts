import { db } from '@rmn-erp/core';
import { occupations } from '../database/schema.js';

export const occupationService = {
  async addOccupation(personId: string, details: any) {
    const [occupation] = await db.insert(occupations).values({
      personId,
      ...details
    }).returning();
    return occupation;
  }
};
