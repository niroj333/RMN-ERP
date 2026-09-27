import { FastifyRequest, FastifyReply } from "fastify";
import { FinanceService } from "../services/finance.service.js";

export class FinanceController {
  constructor(private financeService: FinanceService) {}

  generateInvoice = async (req: FastifyRequest, reply: FastifyReply) => {
    const data = req.body as any;
    const invoice = await this.financeService.generateInvoice(data);
    return reply.status(201).send({ success: true, data: invoice });
  };

  recordPayment = async (req: FastifyRequest, reply: FastifyReply) => {
    const data = req.body as any;
    const payment = await this.financeService.recordPayment(data);
    return reply.status(201).send({ success: true, data: payment });
  };
}
