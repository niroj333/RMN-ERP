import { sql, eq, and } from 'drizzle-orm';
import { numberingPolicies, numberingSequences } from '../database/schema.js';

export class NumberingService {
  async generateId(
    tx: any,
    entityType: string,
    branchId: string | null,
    context: { year?: string; branchCode?: string; }
  ): Promise<string> {
    const policies = await tx
      .select()
      .from(numberingPolicies)
      .where(
        and(
          eq(numberingPolicies.entityType, entityType),
          eq(numberingPolicies.isActive, true)
        )
      );

    const policy = branchId 
      ? policies.find((p: any) => p.branchId === branchId) || policies.find((p: any) => !p.branchId)
      : policies.find((p: any) => !p.branchId);

    if (!policy) {
      throw new Error(`No active numbering policy found for entityType ${entityType}`);
    }

    let scopeKey = 'GLOBAL';
    if (policy.sequenceScope === 'BRANCH') {
      scopeKey = `BRANCH_${branchId}`;
    } else if (policy.sequenceScope === 'YEARLY') {
      scopeKey = `YEAR_${context.year}`;
    } else if (policy.sequenceScope === 'BRANCH_YEARLY') {
      scopeKey = `BRANCH_${branchId}_YEAR_${context.year}`;
    }

    const safeScopeKey = scopeKey.replace(/[^a-zA-Z0-9_]/g, '_');
    let sequenceNumber: number;

    if (policy.isGapless) {
      const rows = await tx.execute(
        sql`SELECT * FROM ${numberingSequences} WHERE policy_id = ${policy.id} AND scope_key = ${scopeKey} FOR UPDATE`
      );
      const seq = rows[0];

      if (seq) {
        sequenceNumber = Number(seq.current_value) + 1;
        await tx.execute(
          sql`UPDATE ${numberingSequences} SET current_value = ${sequenceNumber}, updated_at = now() WHERE id = ${seq.id}`
        );
      } else {
        sequenceNumber = 1;
        await tx.execute(
          sql`INSERT INTO ${numberingSequences} (policy_id, scope_key, current_value) VALUES (${policy.id}, ${scopeKey}, ${sequenceNumber})`
        );
      }
    } else {
      const seqName = `seq_${safeScopeKey}`;
      await tx.execute(sql`CREATE SEQUENCE IF NOT EXISTS ${sql.identifier(seqName)}`);
      const rows = await tx.execute(sql`SELECT nextval(${seqName})`);
      sequenceNumber = Number(rows[0].nextval);
    }

    let resultId = policy.pattern;
    if (policy.prefix) {
      resultId = resultId.replace('{PREFIX}', policy.prefix);
    }
    if (context.year) {
      resultId = resultId.replace('{YEAR}', context.year);
    }
    if (context.branchCode) {
      resultId = resultId.replace('{BRANCH_CODE}', context.branchCode);
    }

    const seqMatch = resultId.match(/{SEQ:(\d+)}/);
    if (seqMatch) {
      const padding = parseInt(seqMatch[1], 10);
      const seqStr = String(sequenceNumber).padStart(padding, '0');
      resultId = resultId.replace(seqMatch[0], seqStr);
    }

    return resultId;
  }
}

export const numberingService = new NumberingService();
