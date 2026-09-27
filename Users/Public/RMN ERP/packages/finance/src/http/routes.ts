import { FastifyInstance } from "fastify";
import { z } from "zod";
import { FinanceController } from "./controllers.js";
import { FinanceService } from "../services/finance.service.js";

export async function financeRoutes(fastify: FastifyInstance, options: { db: any, requireAuth?: any }) {
  const financeService = new FinanceService(options.db);
  const financeController = new FinanceController(financeService);
  
  // Provide a fallback if requireAuth is not passed
  const requireAuth = options.requireAuth || (async (request: any, reply: any) => {});

  fastify.post(
    "/invoices",
    {
      preHandler: [requireAuth],
      schema: {
        body: z.object({
          studentId: z.string().uuid(),
          dueDate: z.string().datetime(),
          items: z.array(z.object({
            feeComponentId: z.string().uuid().optional(),
            amount: z.number(),
            discount: z.number()
          }))
        })
      }
    },
    financeController.generateInvoice
  );

  fastify.post(
    "/payments",
    {
      preHandler: [requireAuth],
      schema: {
        body: z.object({
          invoiceId: z.string().uuid(),
          amount: z.number(),
          method: z.string()
        })
      }
    },
    financeController.recordPayment
  );
}
