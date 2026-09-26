import { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import { db, redis, UnauthorizedError, ForbiddenError } from '@rmn-erp/core';
import { sessions } from '../database/schema.js';
import { authorizationService } from '../services/authorization.service.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      mfaVerified?: boolean;
      permissions?: Array<{ resourceAction: string; scope: string; branchId?: string | null }>;
    };
  }
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  let sessionId = request.cookies.sessionId;

  // Handle signed cookies if fastify-cookie is configured with a secret
  if (sessionId && request.unsignCookie) {
    const unsigned = request.unsignCookie(sessionId);
    if (unsigned.valid && unsigned.value) {
      sessionId = unsigned.value;
    }
  }

  if (!sessionId) {
    throw new UnauthorizedError('Missing session cookie');
  }

  const cacheKey = `session:${sessionId}`;
  let userId: string | null = null;
  let mfaVerified = false;

  const cachedSession = await redis.get(cacheKey);
  
  if (cachedSession) {
    const data = JSON.parse(cachedSession);
    userId = data.userId;
    mfaVerified = data.mfaVerified ?? false;
  } else {
    const sessionRecords = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
    const session = sessionRecords[0];

    if (!session || !session.isValid || session.expiresAt < new Date()) {
      throw new UnauthorizedError('Invalid or expired session');
    }

    userId = session.userId;
    mfaVerified = session.mfaVerified;
    
    // Restore to Redis with remaining TTL
    const ttl = Math.floor((session.expiresAt.getTime() - Date.now()) / 1000);
    if (ttl > 0) {
      await redis.setex(cacheKey, ttl, JSON.stringify({ userId, mfaVerified }));
    } else {
      throw new UnauthorizedError('Session expired');
    }
  }

  if (!userId) {
    throw new UnauthorizedError('Invalid session data');
  }

  request.user = { id: userId, mfaVerified };
}

export async function requireFullAuth(request: FastifyRequest, reply: FastifyReply) {
  await requireAuth(request, reply);
  if (!request.user!.mfaVerified) {
    throw new ForbiddenError('MFA_REQUIRED');
  }
}

export function requireStepUp(action: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await requireFullAuth(request, reply);
    
    let sessionId = request.cookies.sessionId;
    if (sessionId && request.unsignCookie) {
      const unsigned = request.unsignCookie(sessionId);
      if (unsigned.valid && unsigned.value) sessionId = unsigned.value;
    }

    const key = `stepup:${sessionId}:${action}`;
    const exists = await redis.get(key);
    
    if (!exists) {
      const err = new ForbiddenError('STEP_UP_REQUIRED');
      (err as any).details = { challengeAction: action };
      throw err;
    }
  };
}

export function requirePermission(action: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      throw new UnauthorizedError('Not authenticated');
    }

    if (!request.user.permissions) {
      request.user.permissions = await authorizationService.getUserPermissions(request.user.id);
    }

    const hasPermission = request.user.permissions.some(p => p.resourceAction === action);
    
    if (!hasPermission) {
      throw new ForbiddenError(`Missing required permission: ${action}`);
    }
  };
}
