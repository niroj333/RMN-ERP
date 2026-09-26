import { FastifyInstance } from 'fastify';
import { 
  loginHandler, logoutHandler, meHandler,
  mfaSetupHandler, mfaEnableHandler, mfaVerifyLoginHandler,
  stepUpInitiateHandler, stepUpVerifyHandler
} from './controllers.js';
import { requireAuth, requireFullAuth } from '../middleware/auth.js';

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/api/v1/auth/login', loginHandler);
  
  fastify.post('/api/v1/auth/logout', {
    preHandler: [requireAuth]
  }, logoutHandler);
  
  fastify.get('/api/v1/auth/me', {
    preHandler: [requireAuth]
  }, meHandler);

  fastify.post('/api/v1/auth/mfa/setup', { preHandler: [requireAuth] }, mfaSetupHandler);
  fastify.post('/api/v1/auth/mfa/enable', { preHandler: [requireAuth] }, mfaEnableHandler);
  fastify.post('/api/v1/auth/mfa/verify', { preHandler: [requireAuth] }, mfaVerifyLoginHandler);

  fastify.post('/api/v1/auth/step-up/initiate', { preHandler: [requireFullAuth] }, stepUpInitiateHandler);
  fastify.post('/api/v1/auth/step-up/verify', { preHandler: [requireFullAuth] }, stepUpVerifyHandler);
}
