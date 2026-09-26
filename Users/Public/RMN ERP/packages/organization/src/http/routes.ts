import { FastifyInstance } from 'fastify';
import { requireFullAuth, requirePermission } from '@rmn-erp/iam';
import * as controllers from './controllers.js';

export async function organizationRoutes(fastify: FastifyInstance) {
  fastify.register(async (app) => {
    // Add auth hooks
    app.addHook('onRequest', requireFullAuth);

    app.post('/api/v1/organizations', {
      preHandler: [requirePermission('organization:write')]
    }, controllers.createOrgHandler);

    // Assuming GET without ID isn't fully spec'd, omitting or adding a stub
    // For now we will add GET /api/v1/organizations to return all (if needed)

    app.get('/api/v1/organizations/:id', {
      preHandler: [requirePermission('organization:read')]
    }, controllers.getOrgHandler);

    app.get('/api/v1/organizations/:id/descendants', {
      preHandler: [requirePermission('organization:read')]
    }, controllers.getDescendantsHandler);

    app.put('/api/v1/organizations/:id', {
      preHandler: [requirePermission('organization:write')]
    }, controllers.updateOrgHandler);

    app.put('/api/v1/organizations/:id/parent', {
      preHandler: [requirePermission('organization:write')]
    }, controllers.reparentOrgHandler);

  });
}
