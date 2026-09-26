import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { referenceService } from '../services/reference.service.js';
import { metadataService } from '../services/metadata.service.js';
import { db } from '@rmn-erp/core';
import { numberingPolicies } from '../database/schema.js';

export const getReferencesSchema = z.object({
  typeCode: z.string()
});

export async function getReferences(request: FastifyRequest<{ Params: { typeCode: string } }>, reply: FastifyReply) {
  const { typeCode } = request.params;
  const references = await referenceService.getActiveReferences(typeCode);
  return reply.send({ data: references });
}

export async function getMetadataDefinitions(request: FastifyRequest<{ Params: { entityType: string } }>, reply: FastifyReply) {
  const { entityType } = request.params;
  const definitions = await metadataService.getDefinitions(entityType);
  return reply.send({ data: definitions });
}

export const createNumberingPolicySchema = z.object({
  entityType: z.string(),
  branchId: z.string().uuid().optional(),
  prefix: z.string().optional(),
  pattern: z.string(),
  sequenceScope: z.enum(['GLOBAL', 'BRANCH', 'YEARLY', 'BRANCH_YEARLY']),
  isGapless: z.boolean(),
  isActive: z.boolean().default(true)
});

export async function createNumberingPolicy(
  request: FastifyRequest<{ Body: z.infer<typeof createNumberingPolicySchema> }>,
  reply: FastifyReply
) {
  const data = createNumberingPolicySchema.parse(request.body);
  const [policy] = await db.insert(numberingPolicies).values(data).returning();
  return reply.status(201).send({ data: policy });
}
