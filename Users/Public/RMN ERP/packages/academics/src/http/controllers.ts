import { FastifyRequest, FastifyReply } from 'fastify';
import { AcademicService } from '../services/academic.service';

export class AcademicController {
  constructor(private readonly academicService: AcademicService) {}

  // Academic Years
  async createAcademicYear(request: FastifyRequest, reply: FastifyReply) {
    const result = await this.academicService.createAcademicYear(request.body);
    return reply.status(201).send(result);
  }

  async getAcademicYears(request: FastifyRequest, reply: FastifyReply) {
    const result = await this.academicService.getAcademicYears();
    return reply.send(result);
  }

  async getAcademicYearById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const result = await this.academicService.getAcademicYearById(request.params.id);
    if (!result) return reply.status(404).send({ error: 'Not Found' });
    return reply.send(result);
  }

  async updateAcademicYear(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const result = await this.academicService.updateAcademicYear(request.params.id, request.body);
    return reply.send(result);
  }

  async deleteAcademicYear(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const result = await this.academicService.deleteAcademicYear(request.params.id);
    return reply.send(result);
  }

  // Programs
  async createProgram(request: FastifyRequest, reply: FastifyReply) {
    const result = await this.academicService.createProgram(request.body);
    return reply.status(201).send(result);
  }

  async getPrograms(request: FastifyRequest, reply: FastifyReply) {
    const result = await this.academicService.getPrograms();
    return reply.send(result);
  }

  async getProgramById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const result = await this.academicService.getProgramById(request.params.id);
    if (!result) return reply.status(404).send({ error: 'Not Found' });
    return reply.send(result);
  }

  async updateProgram(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const result = await this.academicService.updateProgram(request.params.id, request.body);
    return reply.send(result);
  }

  async deleteProgram(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const result = await this.academicService.deleteProgram(request.params.id);
    return reply.send(result);
  }

  // Sections
  async createSection(request: FastifyRequest, reply: FastifyReply) {
    const result = await this.academicService.createSection(request.body);
    return reply.status(201).send(result);
  }

  async getSections(request: FastifyRequest, reply: FastifyReply) {
    const result = await this.academicService.getSections();
    return reply.send(result);
  }

  async getSectionById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const result = await this.academicService.getSectionById(request.params.id);
    if (!result) return reply.status(404).send({ error: 'Not Found' });
    return reply.send(result);
  }

  async updateSection(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const result = await this.academicService.updateSection(request.params.id, request.body);
    return reply.send(result);
  }

  async deleteSection(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const result = await this.academicService.deleteSection(request.params.id);
    return reply.send(result);
  }
}
