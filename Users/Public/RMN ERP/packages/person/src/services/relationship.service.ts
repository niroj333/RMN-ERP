import { db } from '@rmn-erp/core';
import { personRelationships } from '../database/schema.js';

export const relationshipService = {
  async createRelationship(personAId: string, personBId: string, relationshipType: string) {
    const [relationship] = await db.insert(personRelationships).values({
      personAId,
      personBId,
      relationshipType
    }).returning();
    return relationship;
  }
};
