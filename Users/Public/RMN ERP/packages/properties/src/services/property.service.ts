import { eq, and } from 'drizzle-orm';
import { fieldDefinitions, fieldValues, fieldDefinitionAudit } from '../database/schema.js';

export class PropertyService {
  constructor(private readonly db: any) {}

  async createFieldDefinition(data: any, userId?: string) {
    return await this.db.transaction(async (tx: any) => {
      const [result] = await tx.insert(fieldDefinitions).values({
        ...data,
        createdBy: userId,
        updatedBy: userId,
      }).returning();

      await tx.insert(fieldDefinitionAudit).values({
        fieldDefinitionId: result.id,
        action: 'CREATE',
        newData: result,
        changedBy: userId,
      });

      return result;
    });
  }

  async getFieldDefinitions(entityType: string) {
    return await this.db
      .select()
      .from(fieldDefinitions)
      .where(eq(fieldDefinitions.entityType, entityType));
  }

  async getFieldValues(entityType: string, entityId: string) {
    return await this.db
      .select()
      .from(fieldValues)
      .where(and(eq(fieldValues.entityType, entityType), eq(fieldValues.entityId, entityId)));
  }

  async setFieldValues(entityType: string, entityId: string, values: Record<string, any>, userId: string) {
    const defs = await this.getFieldDefinitions(entityType);
    const defMap = new Map(defs.map((d: any) => [d.fieldKey, d]));

    return await this.db.transaction(async (tx: any) => {
      // Simplistic override logic for updating existing values
      await tx.delete(fieldValues).where(
        and(eq(fieldValues.entityType, entityType), eq(fieldValues.entityId, entityId))
      );

      const records = Object.entries(values).map(([key, value]) => {
        const def = defMap.get(key);
        if (!def) return null;

        const record: any = {
          entityType,
          entityId,
          fieldDefinitionId: def.id,
          createdBy: userId,
          updatedBy: userId,
        };

        // Map standard value types based on datatype
        if (def.dataType === 'number') record.numberValue = value;
        else if (def.dataType === 'boolean') record.booleanValue = value;
        else if (def.dataType === 'json') record.jsonValue = value;
        else if (def.dataType === 'date' || def.dataType === 'datetime') record.dateValue = new Date(value);
        else record.textValue = String(value);

        return record;
      }).filter(Boolean);

      if (records.length > 0) {
        await tx.insert(fieldValues).values(records);
      }
    });
  }
}
