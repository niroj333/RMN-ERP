import { FastifyInstance } from 'fastify';
import { studentController } from './controllers.js';
import { requireFullAuth, requirePermission } from '@rmn-erp/iam';

export default async function studentRoutes(app: FastifyInstance) {
  app.post('/api/v1/students', {
    preHandler: [requireFullAuth, requirePermission('student:write')]
  }, studentController.registerStudent);

  app.get('/api/v1/students/:id', {
    preHandler: [requireFullAuth, requirePermission('student:read')]
  }, studentController.getStudent);

  app.get('/api/v1/students', {
    preHandler: [requireFullAuth, requirePermission('student:read')]
  }, studentController.searchStudents);
}
