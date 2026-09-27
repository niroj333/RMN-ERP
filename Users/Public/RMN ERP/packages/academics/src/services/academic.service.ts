import { eq } from 'drizzle-orm';
import { academicYears, programs, sections } from '../database/schema';

export class AcademicService {
  constructor(private readonly db: any) {}

  // Academic Years
  async createAcademicYear(data: any) {
    return await this.db.insert(academicYears).values(data).returning();
  }

  async getAcademicYears() {
    return await this.db.select().from(academicYears);
  }

  async getAcademicYearById(id: string) {
    const result = await this.db.select().from(academicYears).where(eq(academicYears.id, id));
    return result[0];
  }

  async updateAcademicYear(id: string, data: any) {
    return await this.db.update(academicYears).set(data).where(eq(academicYears.id, id)).returning();
  }

  async deleteAcademicYear(id: string) {
    return await this.db.delete(academicYears).where(eq(academicYears.id, id)).returning();
  }

  // Programs
  async createProgram(data: any) {
    return await this.db.insert(programs).values(data).returning();
  }

  async getPrograms() {
    return await this.db.select().from(programs);
  }

  async getProgramById(id: string) {
    const result = await this.db.select().from(programs).where(eq(programs.id, id));
    return result[0];
  }

  async updateProgram(id: string, data: any) {
    return await this.db.update(programs).set(data).where(eq(programs.id, id)).returning();
  }

  async deleteProgram(id: string) {
    return await this.db.delete(programs).where(eq(programs.id, id)).returning();
  }

  // Sections
  async createSection(data: any) {
    return await this.db.insert(sections).values(data).returning();
  }

  async getSections() {
    return await this.db.select().from(sections);
  }

  async getSectionById(id: string) {
    const result = await this.db.select().from(sections).where(eq(sections.id, id));
    return result[0];
  }

  async updateSection(id: string, data: any) {
    return await this.db.update(sections).set(data).where(eq(sections.id, id)).returning();
  }

  async deleteSection(id: string) {
    return await this.db.delete(sections).where(eq(sections.id, id)).returning();
  }
}
