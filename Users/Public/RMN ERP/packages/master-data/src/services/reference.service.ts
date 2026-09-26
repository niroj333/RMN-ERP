import { db } from '@rmn-erp/core';
import { and, eq, lte, or, isNull, gte } from 'drizzle-orm';
import { referenceTypes, referenceValues } from '../database/schema.js';

export class ReferenceService {
  async getActiveReferences(typeCode: string) {
    const today = new Date().toISOString().split('T')[0];

    const refs = await db
      .select({
        id: referenceValues.id,
        code: referenceValues.code,
        value: referenceValues.value,
        displayOrder: referenceValues.displayOrder,
      })
      .from(referenceValues)
      .innerJoin(referenceTypes, eq(referenceValues.typeId, referenceTypes.id))
      .where(
        and(
          eq(referenceTypes.code, typeCode),
          eq(referenceValues.isActive, true),
          lte(referenceValues.effectiveFrom, today),
          or(
            isNull(referenceValues.effectiveTo),
            gte(referenceValues.effectiveTo, today)
          )
        )
      )
      .orderBy(referenceValues.displayOrder);

    return refs;
  }
}

export const referenceService = new ReferenceService();
