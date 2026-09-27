import { FastifyRequest, FastifyReply } from 'fastify';
import { PropertyService } from '../services/property.service.js';

export class PropertyController {
  constructor(private propertyService: PropertyService) {}

  createFieldDefinition = async (req: FastifyRequest, reply: FastifyReply) => {
    const data = req.body as any;
    const userId = (req.user as any)?.id;
    const result = await this.propertyService.createFieldDefinition(data, userId);
    return reply.status(201).send(result);
  }

  getFieldDefinitions = async (req: FastifyRequest, reply: FastifyReply) => {
    const { entityType } = req.params as { entityType: string };
    const result = await this.propertyService.getFieldDefinitions(entityType);
    return reply.send(result);
  }

  getFieldValues = async (req: FastifyRequest, reply: FastifyReply) => {
    const { entityType, entityId } = req.params as { entityType: string, entityId: string };
    const result = await this.propertyService.getFieldValues(entityType, entityId);
    return reply.send(result);
  }

  setFieldValues = async (req: FastifyRequest, reply: FastifyReply) => {
    const { entityType, entityId } = req.params as { entityType: string, entityId: string };
    const values = req.body as Record<string, any>;
    const userId = (req.user as any)?.id;
    await this.propertyService.setFieldValues(entityType, entityId, values, userId);
    return reply.status(204).send();
  }
}
