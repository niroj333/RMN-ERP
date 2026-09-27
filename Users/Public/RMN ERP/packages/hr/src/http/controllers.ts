import { FastifyRequest, FastifyReply } from 'fastify';
import { HRService } from '../services/hr.service.js';

export class HRController {
  constructor(private hrService: HRService) {}

  async createStaff(request: FastifyRequest, reply: FastifyReply) {
    const data = request.body;
    const staff = await this.hrService.createStaff(data);
    return reply.status(201).send(staff);
  }

  async getStaff(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    const staff = await this.hrService.getStaff(id);
    if (!staff) return reply.status(404).send({ message: 'Staff not found' });
    return reply.send(staff);
  }

  async submitLeaveRequest(request: FastifyRequest, reply: FastifyReply) {
    const data = request.body;
    const requestRecord = await this.hrService.submitLeaveRequest(data);
    return reply.status(201).send(requestRecord);
  }

  async generatePayroll(request: FastifyRequest, reply: FastifyReply) {
    const { staffId, month, year, allowances, deductions } = request.body as any;
    const payroll = await this.hrService.generatePayroll(staffId, month, year, allowances, deductions);
    return reply.status(201).send(payroll);
  }
}
