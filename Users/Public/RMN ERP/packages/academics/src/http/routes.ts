import { FastifyInstance } from 'fastify';
import { AcademicController } from './controllers';

// Dummy middleware for demonstration based on the requirement
const requireAuth = async (request: any, reply: any) => {
  // Placeholder for IAM middleware
};

export async function academicRoutes(fastify: FastifyInstance, options: { controller: AcademicController }) {
  const { controller } = options;

  // Middleware
  fastify.addHook('preHandler', requireAuth);

  // Academic Years
  fastify.post('/academic-years', controller.createAcademicYear.bind(controller));
  fastify.get('/academic-years', controller.getAcademicYears.bind(controller));
  fastify.get('/academic-years/:id', controller.getAcademicYearById.bind(controller));
  fastify.put('/academic-years/:id', controller.updateAcademicYear.bind(controller));
  fastify.delete('/academic-years/:id', controller.deleteAcademicYear.bind(controller));

  // Programs
  fastify.post('/programs', controller.createProgram.bind(controller));
  fastify.get('/programs', controller.getPrograms.bind(controller));
  fastify.get('/programs/:id', controller.getProgramById.bind(controller));
  fastify.put('/programs/:id', controller.updateProgram.bind(controller));
  fastify.delete('/programs/:id', controller.deleteProgram.bind(controller));

  // Sections
  fastify.post('/sections', controller.createSection.bind(controller));
  fastify.get('/sections', controller.getSections.bind(controller));
  fastify.get('/sections/:id', controller.getSectionById.bind(controller));
  fastify.put('/sections/:id', controller.updateSection.bind(controller));
  fastify.delete('/sections/:id', controller.deleteSection.bind(controller));
}
