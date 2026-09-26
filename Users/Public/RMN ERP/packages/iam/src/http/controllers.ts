import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { authService } from '../services/auth.service.js';
import { authorizationService } from '../services/authorization.service.js';
import { ValidationError } from '@rmn-erp/core';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export async function loginHandler(request: FastifyRequest, reply: FastifyReply) {
  const result = loginSchema.safeParse(request.body);
  
  if (!result.success) {
    const details = result.error.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message
    }));
    throw new ValidationError('Invalid request body', details);
  }

  const { email, password } = result.data;
  const ipAddress = request.ip;
  const userAgent = request.headers['user-agent'];

  const sessionId = await authService.login(email, password, ipAddress, userAgent);

  reply.setCookie('sessionId', sessionId, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 // 24 hours
  });

  return { success: true };
}

export async function logoutHandler(request: FastifyRequest, reply: FastifyReply) {
  let sessionId = request.cookies.sessionId;
  
  if (sessionId && request.unsignCookie) {
    const unsigned = request.unsignCookie(sessionId);
    if (unsigned.valid && unsigned.value) {
      sessionId = unsigned.value;
    }
  }

  if (sessionId) {
    await authService.logout(sessionId);
  }

  reply.clearCookie('sessionId', { path: '/' });
  return { success: true };
}

import { mfaService } from '../services/mfa.service.js';
import { stepUpService } from '../services/step-up.service.js';
import { db, NotFoundError } from '@rmn-erp/core';
import { users } from '../database/schema.js';
import { eq } from 'drizzle-orm';
import { redis } from '@rmn-erp/core';

export async function meHandler(request: FastifyRequest, reply: FastifyReply) {
  // requireAuth middleware ensures request.user is present
  const userId = request.user!.id;
  const permissions = await authorizationService.getUserPermissions(userId);
  
  return {
    id: userId,
    permissions
  };
}

export async function mfaSetupHandler(request: FastifyRequest, reply: FastifyReply) {
  const userRecords = await db.select({ email: users.email }).from(users).where(eq(users.id, request.user!.id)).limit(1);
  const user = userRecords[0];
  if (!user) throw new NotFoundError('User not found');
  
  const { secret, uri } = mfaService.generateSecret(user.email);
  return { secret, uri };
}

const mfaEnableSchema = z.object({
  code: z.string(),
  secret: z.string()
});

export async function mfaEnableHandler(request: FastifyRequest, reply: FastifyReply) {
  const result = mfaEnableSchema.safeParse(request.body);
  if (!result.success) throw new ValidationError('Invalid request body', result.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })));
  
  await mfaService.verifyAndEnable(request.user!.id, result.data.code, result.data.secret);
  return { success: true };
}

const mfaVerifySchema = z.object({
  code: z.string()
});

export async function mfaVerifyLoginHandler(request: FastifyRequest, reply: FastifyReply) {
  const result = mfaVerifySchema.safeParse(request.body);
  if (!result.success) throw new ValidationError('Invalid request body', result.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })));

  let sessionId = request.cookies.sessionId;
  if (sessionId && request.unsignCookie) {
    const unsigned = request.unsignCookie(sessionId);
    if (unsigned.valid && unsigned.value) sessionId = unsigned.value;
  }
  
  await mfaService.verifyLogin(sessionId!, request.user!.id, result.data.code);
  
  const cacheKey = `session:${sessionId}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    const data = JSON.parse(cached);
    data.mfaVerified = true;
    const ttl = await redis.ttl(cacheKey);
    if (ttl > 0) {
      await redis.setex(cacheKey, ttl, JSON.stringify(data));
    }
  }

  return { success: true };
}

const stepUpInitiateSchema = z.object({
  action: z.string()
});

export async function stepUpInitiateHandler(request: FastifyRequest, reply: FastifyReply) {
  const result = stepUpInitiateSchema.safeParse(request.body);
  if (!result.success) throw new ValidationError('Invalid request body', result.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })));

  let sessionId = request.cookies.sessionId;
  if (sessionId && request.unsignCookie) {
    const unsigned = request.unsignCookie(sessionId);
    if (unsigned.valid && unsigned.value) sessionId = unsigned.value;
  }

  const challengeId = await stepUpService.initiateChallenge(request.user!.id, sessionId!, result.data.action);
  return { challengeId };
}

const stepUpVerifySchema = z.object({
  challengeId: z.string(),
  code: z.string()
});

export async function stepUpVerifyHandler(request: FastifyRequest, reply: FastifyReply) {
  const result = stepUpVerifySchema.safeParse(request.body);
  if (!result.success) throw new ValidationError('Invalid request body', result.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })));

  await stepUpService.verifyChallenge(result.data.challengeId, result.data.code);
  return { success: true };
}
