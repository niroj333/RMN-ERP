import { eq, inArray } from 'drizzle-orm';
import { students } from '../database/schema.js';
import { persons } from '@rmn-erp/person';
import { numberingService } from '@rmn-erp/master-data';
import { insertOutboxEvent } from '@rmn-erp/events';
import { v4 as uuidv4 } from 'uuid';

export class ForbiddenError extends Error {
  constructor(message = 'Forbidden: You do not have access to this branch.') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

function hasBranchAccess(allowedBranchIds: string[], branchId: string): boolean {
  return allowedBranchIds.includes('*') || allowedBranchIds.includes(branchId);
}

export const studentService = {
  async registerStudent(dbInstance: any, data: any, creatorId: string, allowedBranchIds: string[]) {
    if (!hasBranchAccess(allowedBranchIds, data.branchId)) {
      throw new ForbiddenError();
    }

    return await dbInstance.transaction(async (tx: any) => {
      const [person] = await tx.insert(persons).values({
        ...data.person,
        createdBy: creatorId,
        updatedBy: creatorId,
      }).returning();

      const studentId = await numberingService.generateId(tx, 'STUDENT', data.branchId, {
        year: new Date().getFullYear().toString(),
      });

      const [student] = await tx.insert(students).values({
        personId: person.id, studentId, branchId: data.branchId,
        status: 'PROSPECT', createdBy: creatorId, updatedBy: creatorId,
      }).returning();

      await insertOutboxEvent(tx, {
        id: uuidv4(), type: 'student.registered', aggregateType: 'STUDENT',
        aggregateId: student.id, payload: student, correlationId: uuidv4(),
        producer: 'student-service',
      });

      return student;
    });
  },

  async getStudent360(dbInstance: any, id: string, allowedBranchIds: string[]) {
    const [student] = await dbInstance.select().from(students).where(eq(students.id, id));
    if (!student) throw new Error('Student not found');
    if (!hasBranchAccess(allowedBranchIds, student.branchId)) throw new ForbiddenError();
    const [person] = await dbInstance.select().from(persons).where(eq(persons.id, student.personId));
    return { ...student, person };
  },

  async searchStudents(dbInstance: any, query: string, allowedBranchIds: string[]) {
    if (allowedBranchIds.includes('*')) {
      return await dbInstance.select().from(students);
    }
    if (allowedBranchIds.length === 0) return [];
    return await dbInstance.select().from(students).where(inArray(students.branchId, allowedBranchIds));
  }
};
