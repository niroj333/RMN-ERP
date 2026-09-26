import { db, redis, ForbiddenError, NotFoundError } from '@rmn-erp/core';
import { stepUpChallenges, users } from '../database/schema.js';
import { eq } from 'drizzle-orm';
import { authenticator } from 'otplib';

export class StepUpService {
  async initiateChallenge(userId: string, sessionId: string, action: string): Promise<string> {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    
    const result = await db.insert(stepUpChallenges).values({
      userId,
      sessionId,
      action,
      expiresAt
    }).returning({ id: stepUpChallenges.id });
    
    return result[0].id;
  }

  async verifyChallenge(challengeId: string, code: string): Promise<void> {
    const challenges = await db.select().from(stepUpChallenges).where(eq(stepUpChallenges.id, challengeId)).limit(1);
    const challenge = challenges[0];

    if (!challenge) {
      throw new NotFoundError('Challenge not found');
    }

    if (challenge.expiresAt < new Date()) {
      throw new ForbiddenError('Challenge expired');
    }

    if (challenge.verified) {
      throw new ForbiddenError('Challenge already verified');
    }

    const userRecords = await db.select().from(users).where(eq(users.id, challenge.userId)).limit(1);
    const user = userRecords[0];

    if (!user || !user.totpSecret) {
      throw new ForbiddenError('MFA not configured');
    }

    const isValid = authenticator.verify({ token: code, secret: user.totpSecret });
    if (!isValid) {
      throw new ForbiddenError('Invalid MFA code');
    }

    await db.update(stepUpChallenges)
      .set({ verified: true })
      .where(eq(stepUpChallenges.id, challengeId));

    await redis.setex(`stepup:${challenge.sessionId}:${challenge.action}`, 300, 'verified');
  }
}

export const stepUpService = new StepUpService();
