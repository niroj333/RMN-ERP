import { db } from '@rmn-erp/core';
import { eq, sql } from 'drizzle-orm';

export const temporalService = {
  async expireRecord(table: any, id: string) {
    return await db.update(table)
      .set({ effectiveTo: sql`CURRENT_DATE` })
      .where(eq(table.id, id))
      .returning();
  }
};
