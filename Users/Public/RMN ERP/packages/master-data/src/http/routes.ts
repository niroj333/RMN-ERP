import { FastifyInstance } from 'fastify';
import { requireAuth, requireFullAuth, requirePermission } from '@rmn-erp/iam';
import { getReferences, getMetadataDefinitions, createNumberingPolicy } from './controllers.js';

export async function masterDataRoutes(app: FastifyInstance) {
  app.get(
    '/api/v1/master-data/references/:typeCode',
    {
      preHandler: [requireAuth]
    },
    getReferences
  );

  app.get(
    '/api/v1/admin/metadata/:entityType',
    {
      preHandler: [requireAuth]
    },
    getMetadataDefinitions
  );

  app.post(
    '/api/v1/admin/numbering-policies',
    {
      preHandler: [requireFullAuth, requirePermission('master_data:write')]
    },
    createNumberingPolicy
  );
}
