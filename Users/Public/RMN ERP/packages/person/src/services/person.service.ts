import { db } from '@rmn-erp/core';
import { eq, ilike, or } from 'drizzle-orm';
import { persons } from '../database/schema.js';

export const personService = {
  async createPerson(data: any) {
    const [person] = await db.insert(persons).values(data).returning();
    return person;
  },

  async getPersonById(id: string) {
    const [person] = await db.select().from(persons).where(eq(persons.id, id));
    return person;
  },

  async updatePerson(id: string, data: any) {
    const [person] = await db.update(persons)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(persons.id, id))
      .returning();
    return person;
  },

  async searchPersons(query: string) {
    const term = `%${query}%`;
    return await db.select().from(persons).where(
      or(
        ilike(persons.firstName, term),
        ilike(persons.lastName, term)
      )
    );
  }
};
