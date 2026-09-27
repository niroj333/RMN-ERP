import { eq } from 'drizzle-orm';
import { staff, leaveRequests, payroll, designations } from '../database/schema.js';

export class HRService {
  constructor(private db: any) {}

  async createStaff(data: any) {
    const result = await this.db.insert(staff).values(data).returning();
    return result[0];
  }

  async getStaff(id: string) {
    const result = await this.db.select().from(staff).where(eq(staff.id, id));
    return result[0];
  }

  async submitLeaveRequest(data: any) {
    const result = await this.db.insert(leaveRequests).values({
      ...data,
      status: 'pending'
    }).returning();
    return result[0];
  }

  async updateLeaveRequestStatus(id: string, status: string, updatedBy: string) {
    const result = await this.db.update(leaveRequests)
      .set({ status, updatedBy, updatedAt: new Date() })
      .where(eq(leaveRequests.id, id))
      .returning();
    return result[0];
  }

  async generatePayroll(staffId: string, month: number, year: number, allowances: number, deductions: number) {
    const staffRecords = await this.db.select().from(staff)
        .leftJoin(designations, eq(staff.designationId, designations.id))
        .where(eq(staff.id, staffId));
        
    if (!staffRecords || staffRecords.length === 0) {
      throw new Error('Staff not found');
    }
    
    const staffRecord = staffRecords[0];
    if (!staffRecord.designations) {
      throw new Error('Staff designation not found');
    }

    const baseSalary = parseFloat(staffRecord.designations.baseSalary);
    const netSalary = baseSalary + allowances - deductions;

    const result = await this.db.insert(payroll).values({
      staffId,
      month,
      year,
      baseSalary: baseSalary.toString(),
      allowances: allowances.toString(),
      deductions: deductions.toString(),
      netSalary: netSalary.toString()
    }).returning();

    return result[0];
  }
}
