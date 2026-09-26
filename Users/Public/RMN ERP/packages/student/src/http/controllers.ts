import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { studentService } from '../services/student.service.js';
import { db } from '@rmn-erp/core';

const registerStudentSchema = z.object({
  branchId: z.string().uuid(),
  person: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    // ... other person fields
  }).passthrough()
});

export const studentController = {
  async registerStudent(request: FastifyRequest, reply: FastifyReply) {
    const data = registerStudentSchema.parse(request.body);
    
    // Extract branchIds from user permissions
    const permissions = request.user?.permissions || [];
    const allowedBranchIds = permissions
      .filter(p => p.resourceAction === 'student:write' || p.resourceAction === '*')
      .map(p => p.branchId)
      .filter(Boolean) as string[];

    const student = await studentService.registerStudent(db, data, request.user!.id, allowedBranchIds);
    reply.status(201).send(student);
  },

  async getStudent(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    
    const permissions = request.user?.permissions || [];
    const allowedBranchIds = permissions
      .filter(p => p.resourceAction === 'student:read' || p.resourceAction === '*')
      .map(p => p.branchId)
      .filter(Boolean) as string[];

    const student360 = await studentService.getStudent360(db, id, allowedBranchIds);
    reply.send(student360);
  },

  async searchStudents(request: FastifyRequest<{ Querystring: { q?: string } }>, reply: FastifyReply) {
    const query = request.query.q || '';
    
    const permissions = request.user?.permissions || [];
    const allowedBranchIds = permissions
      .filter(p => p.resourceAction === 'student:read' || p.resourceAction === '*')
      .map(p => p.branchId)
      .filter(Boolean) as string[];

    const students = await studentService.searchStudents(db, query, allowedBranchIds);
    reply.send(students);
  }
};
