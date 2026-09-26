import { eq } from 'drizzle-orm';
import { db, redis, UnauthorizedError, ForbiddenError, logger } from '@rmn-erp/core';
import { randomUUID } from 'crypto';
import { users, sessions } from '../database/schema.js';
import { passwordService } from './password.service.js';

export class AuthService {
  async login(email: string, plainPassword: string, ipAddress?: string, userAgent?: string): Promise<string> {
    const userRecords = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const user = userRecords[0];

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.status === 'LOCKED') {
      throw new ForbiddenError('Account is locked due to too many failed attempts');
    }

    if (user.status !== 'ACTIVE' && user.status !== 'PENDING') {
      throw new ForbiddenError(`Account status is ${user.status}`);
    }

    const isValidPassword = await passwordService.verify(user.passwordHash, plainPassword);

    if (!isValidPassword) {
      const newAttempts = user.failedAttempts + 1;
      
      if (newAttempts >= 5) {
        await db.update(users).set({ status: 'LOCKED', failedAttempts: newAttempts }).where(eq(users.id, user.id));
        logger.warn({ userId: user.id, event: 'iam.account.locked' }, 'Account locked due to too many failed attempts');
        throw new ForbiddenError('Account is locked due to too many failed attempts');
      } else {
        await db.update(users).set({ failedAttempts: newAttempts }).where(eq(users.id, user.id));
      }
      throw new UnauthorizedError('Invalid email or password');
    }

    // Reset failed attempts if successful
    if (user.failedAttempts > 0) {
      await db.update(users).set({ failedAttempts: 0 }).where(eq(users.id, user.id));
    }

    const mfaVerified = !user.isMfaEnabled;
    const sessionId = randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db.insert(sessions).values({
      id: sessionId,
      userId: user.id,
      userAgent: userAgent || null,
      ipAddress: ipAddress || null,
      expiresAt,
      mfaVerified
    });

    // Cache to Redis with TTL in seconds (24h)
    await redis.setex(`session:${sessionId}`, 24 * 60 * 60, JSON.stringify({ userId: user.id, mfaVerified }));

    return sessionId;
  }

  async logout(sessionId: string): Promise<void> {
    await db.update(sessions).set({ isValid: false }).where(eq(sessions.id, sessionId));
    await redis.del(`session:${sessionId}`);
  }
}

export const authService = new AuthService();
