import { invoices, invoiceItems, payments } from "../database/schema.js";

export class FinanceService {
  constructor(private db: any) {}

  async generateInvoice(data: { studentId: string; dueDate: Date; items: { feeComponentId?: string; amount: number; discount: number }[] }) {
    const totalAmount = data.items.reduce((acc, item) => acc + (item.amount - item.discount), 0);
    const invoiceNumber = `INV-${Date.now()}`;

    const [invoice] = await this.db.insert(invoices).values({
      invoiceNumber,
      studentId: data.studentId,
      dueDate: data.dueDate,
      totalAmount: totalAmount.toString(),
      status: "pending"
    }).returning();

    for (const item of data.items) {
      await this.db.insert(invoiceItems).values({
        invoiceId: invoice.id,
        feeComponentId: item.feeComponentId,
        amount: item.amount.toString(),
        discount: item.discount.toString(),
      });
    }

    return invoice;
  }

  async recordPayment(data: { invoiceId: string; amount: number; method: string }) {
    const paymentNumber = `PAY-${Date.now()}`;
    const [payment] = await this.db.insert(payments).values({
      paymentNumber,
      invoiceId: data.invoiceId,
      amount: data.amount.toString(),
      method: data.method,
      status: "success"
    }).returning();

    await this.db.update(invoices)
      .set({ status: "paid" })
      .where({ id: data.invoiceId });

    return payment;
  }
}
