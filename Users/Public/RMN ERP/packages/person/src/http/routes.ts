import { FastifyInstance } from 'fastify';
import { requireFullAuth, requirePermission } from '@rmn-erp/iam';
import {
  searchPersonsController,
  createPersonController,
  getPersonController,
  addContactController,
  addAddressController,
  addRelationshipController,
  addOccupationController
} from './controllers.js';

export default async function personRoutes(app: FastifyInstance) {
  // Read permissions
  app.get('/api/v1/persons', { preHandler: [requireFullAuth, requirePermission('person:read')] }, searchPersonsController);
  app.get('/api/v1/persons/:id', { preHandler: [requireFullAuth, requirePermission('person:read')] }, getPersonController);
  
  // Write permissions
  app.post('/api/v1/persons', { preHandler: [requireFullAuth, requirePermission('person:write')] }, createPersonController);
  app.post('/api/v1/persons/:id/contacts', { preHandler: [requireFullAuth, requirePermission('person:write')] }, addContactController);
  app.post('/api/v1/persons/:id/addresses', { preHandler: [requireFullAuth, requirePermission('person:write')] }, addAddressController);
  app.post('/api/v1/persons/:id/relationships', { preHandler: [requireFullAuth, requirePermission('person:write')] }, addRelationshipController);
  app.post('/api/v1/persons/:id/occupations', { preHandler: [requireFullAuth, requirePermission('person:write')] }, addOccupationController);
}
