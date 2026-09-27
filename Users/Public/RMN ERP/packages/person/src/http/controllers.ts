import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { personService } from '../services/person.service.js';
import { relationshipService } from '../services/relationship.service.js';
import { occupationService } from '../services/occupation.service.js';
import { db } from '@rmn-erp/core';
import { contactMethods, addresses } from '../database/schema.js';

export const searchPersonsController = async (req: FastifyRequest, reply: FastifyReply) => {
  const schema = z.object({ query: z.string().optional() });
  const { query } = schema.parse(req.query);
  if (query) {
    const persons = await personService.searchPersons(query);
    return reply.send(persons);
  }
  return reply.send([]);
};

export const createPersonController = async (req: FastifyRequest, reply: FastifyReply) => {
  const schema = z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    dateOfBirth: z.string().optional(),
    gender: z.string().optional(),
  }).passthrough();
  const data = schema.parse(req.body);
  const person = await personService.createPerson({ ...data, createdBy: req.user?.id, updatedBy: req.user?.id });
  return reply.send(person);
};

export const getPersonController = async (req: FastifyRequest, reply: FastifyReply) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
  const person = await personService.getPersonById(id);
  if (!person) return reply.status(404).send({ error: 'Not found' });
  return reply.send(person);
};

export const addContactController = async (req: FastifyRequest, reply: FastifyReply) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
  const data = z.object({
    type: z.enum(['EMAIL', 'PHONE']),
    value: z.string(),
    isPrimary: z.boolean().optional(),
  }).parse(req.body);
  const [contact] = await db.insert(contactMethods).values({ personId: id, ...data }).returning();
  return reply.send(contact);
};

export const addAddressController = async (req: FastifyRequest, reply: FastifyReply) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
  const data = z.object({
    type: z.enum(['HOME', 'MAILING', 'EMPLOYER']),
    line1: z.string().optional(),
    line2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional(),
  }).parse(req.body);
  const [address] = await db.insert(addresses).values({ personId: id, ...data }).returning();
  return reply.send(address);
};

export const addRelationshipController = async (req: FastifyRequest, reply: FastifyReply) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
  const data = z.object({
    personBId: z.string().uuid(),
    relationshipType: z.enum(['PARENT', 'CHILD', 'SPOUSE', 'EMERGENCY_CONTACT']),
  }).parse(req.body);
  const rel = await relationshipService.createRelationship(id, data.personBId, data.relationshipType);
  return reply.send(rel);
};

export const addOccupationController = async (req: FastifyRequest, reply: FastifyReply) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
  const data = z.object({
    employerName: z.string(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }).passthrough().parse(req.body);
  const occ = await occupationService.addOccupation(id, data);
  return reply.send(occ);
};
