import { FastifyInstance } from 'fastify';
import { HRController } from './controllers.js';
import { HRService } from '../services/hr.service.js';

export async function hrRoutes(fastify: FastifyInstance, options: { db: any }) {
  const hrService = new HRService(options.db);
  const hrController = new HRController(hrService);
  
  fastify.post('/staff', async (request, reply) => {
    return hrController.createStaff(request, reply);
  });

  fastify.get('/staff/:id', async (request, reply) => {
    return hrController.getStaff(request as any, reply);
  });

  fastify.post('/leaves', async (request, reply) => {
    return hrController.submitLeaveRequest(request, reply);
  });

  fastify.post('/payroll/generate', async (request, reply) => {
    return hrController.generatePayroll(request, reply);
  });
}
