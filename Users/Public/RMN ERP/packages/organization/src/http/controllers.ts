import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { organizationService } from '../services/organization.service.js';

const createSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(['COMPANY', 'BRANCH', 'DEPARTMENT', 'UNIT', 'EXTERNAL_INSTITUTION']),
  parentId: z.string().uuid().optional().nullable(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
});

const reparentSchema = z.object({
  parentId: z.string().uuid().nullable(),
});

export async function createOrgHandler(request: FastifyRequest, reply: FastifyReply) {
  const data = createSchema.parse(request.body);
  const org = await organizationService.createOrganization(data);
  return reply.status(201).send(org);
}

export async function getOrgHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const org = await organizationService.getOrganization(request.params.id);
  return reply.send(org);
}

export async function updateOrgHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const data = updateSchema.parse(request.body);
  const org = await organizationService.updateOrganization(request.params.id, data);
  return reply.send(org);
}

export async function reparentOrgHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const data = reparentSchema.parse(request.body);
  const org = await organizationService.reparentOrganization(request.params.id, data.parentId);
  return reply.send(org);
}

export async function getDescendantsHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const descendants = await organizationService.getDescendants(request.params.id);
  return reply.send(descendants);
}
