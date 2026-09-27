import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { studentService } from '../services/student.service.js';
import { db } from '@rmn-erp/core';

const registerStudentSchema = z.object({
  branchId: z.string().uuid(),
  person: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
  }).passthrough()
});

function getAllowedBranchIds(permissions: any[], action: string): string[] {
  const isGlobal = permissions.some(p => p.scope === 'GLOBAL');
  if (isGlobal) return ['*'];
  return permissions
    .filter(p => p.resourceAction === action || p.resourceAction === '*')
    .map(p => p.branchId)
    .filter(Boolean) as string[];
}

export const studentController = {
  async registerStudent(request: FastifyRequest, reply: FastifyReply) {
    const data = registerStudentSchema.parse(request.body);
    const permissions = request.user?.permissions || [];
    const allowedBranchIds = getAllowedBranchIds(permissions, 'student:write');
    const student = await studentService.registerStudent(db, data, request.user!.id, allowedBranchIds);
    reply.status(201).send(student);
  },

  async getStudent(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    const permissions = request.user?.permissions || [];
    const allowedBranchIds = getAllowedBranchIds(permissions, 'student:read');
    const student360 = await studentService.getStudent360(db, id, allowedBranchIds);
    reply.send(student360);
  },

  async searchStudents(request: FastifyRequest<{ Querystring: { q?: string } }>, reply: FastifyReply) {
    const query = (request.query as any).q || '';
    const permissions = request.user?.permissions || [];
    const allowedBranchIds = getAllowedBranchIds(permissions, 'student:read');
    const students = await studentService.searchStudents(db, query, allowedBranchIds);
    reply.send(students);
  }
};
