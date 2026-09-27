import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { PropertyController } from './controllers.js';
import { PropertyService } from '../services/property.service.js';
import { requireFullAuth, requirePermission } from '@rmn-erp/iam/middleware.js';

const createFieldDefSchema = z.object({
  entityType: z.string(),
  fieldKey: z.string(),
  label: z.string(),
  dataType: z.string(),
  inputType: z.string(),
}).passthrough();

const setFieldValuesSchema = z.record(z.any());

export async function propertyRoutes(fastify: FastifyInstance) {
  // Assuming database instance is attached to fastify context
  const db = (fastify as any).db;
  const service = new PropertyService(db);
  const controller = new PropertyController(service);

  fastify.post('/properties/definitions', {
    preHandler: [requireFullAuth, requirePermission('manage_properties')],
    schema: {
      body: createFieldDefSchema as any,
    }
  }, controller.createFieldDefinition);

  fastify.get('/properties/definitions/:entityType', {
    preHandler: [requireFullAuth],
  }, controller.getFieldDefinitions);

  fastify.get('/properties/values/:entityType/:entityId', {
    preHandler: [requireFullAuth]
  }, controller.getFieldValues);

  fastify.put('/properties/values/:entityType/:entityId', {
    preHandler: [requireFullAuth, requirePermission('edit_properties')],
    schema: {
      body: setFieldValuesSchema as any,
    }
  }, controller.setFieldValues);
}
