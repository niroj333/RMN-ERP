import { db } from '@rmn-erp/core';
import { eq } from 'drizzle-orm';
import { metadataDefinitions } from '../database/schema.js';

export class MetadataService {
  async getDefinitions(entityType: string) {
    const definitions = await db
      .select()
      .from(metadataDefinitions)
      .where(eq(metadataDefinitions.entityType, entityType));
      
    return definitions;
  }
}

export const metadataService = new MetadataService();
