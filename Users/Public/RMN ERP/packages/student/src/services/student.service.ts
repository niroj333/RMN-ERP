
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

export const studentService = {
  async registerStudent(dbInstance: any, data: any, creatorId: string, allowedBranchIds: string[]) {
    if (!allowedBranchIds.includes(data.branchId)) {
      throw new ForbiddenError();
    }

    return await dbInstance.transaction(async (tx: any) => {
      // Create person
      const [person] = await tx.insert(persons).values({
        ...data.person,
        createdBy: creatorId,
        updatedBy: creatorId,
      }).returning();

      // Generate Business ID
      const studentId = await numberingService.generateId(tx, 'STUDENT', data.branchId, {
        year: new Date().getFullYear().toString(),
      });

      // Insert student record
      const [student] = await tx.insert(students).values({
        personId: person.id,
        studentId,
        branchId: data.branchId,
        status: 'PROSPECT',
        createdBy: creatorId,
        updatedBy: creatorId,
      }).returning();

      // Insert outbox event
      await insertOutboxEvent(tx, {
        id: uuidv4(),
        type: 'student.registered',
        aggregateType: 'STUDENT',
        aggregateId: student.id,
        payload: student,
        correlationId: uuidv4(),
        producer: 'student-service',
      });

      return student;
    });
  },

  async getStudent360(dbInstance: any, id: string, allowedBranchIds: string[]) {
    const [student] = await dbInstance.select().from(students).where(eq(students.id, id));
    if (!student) {
      throw new Error('Student not found');
    }

    if (!allowedBranchIds.includes(student.branchId)) {
      throw new ForbiddenError();
    }

    const [person] = await dbInstance.select().from(persons).where(eq(persons.id, student.personId));

    return {
      ...student,
      person,
    };
  },

  async searchStudents(dbInstance: any, query: string, allowedBranchIds: string[]) {
    if (allowedBranchIds.length === 0) {
      return [];
    }
    // We could add query matching here if needed.
    return await dbInstance.select().from(students).where(inArray(students.branchId, allowedBranchIds));
  }
};
