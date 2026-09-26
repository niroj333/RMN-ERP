import { authenticator } from 'otplib';
import { db, ForbiddenError } from '@rmn-erp/core';
import { users, sessions } from '../database/schema.js';
import { eq } from 'drizzle-orm';

export class MfaService {
  generateSecret(email: string) {
    const secret = authenticator.generateSecret();
    const uri = authenticator.keyuri(email, 'RMN ERP', secret);
    return { secret, uri };
  }

  async verifyAndEnable(userId: string, code: string, secret: string): Promise<void> {
    const isValid = authenticator.verify({ token: code, secret });
    if (!isValid) {
      throw new ForbiddenError('Invalid MFA code');
    }

    await db.update(users)
      .set({ totpSecret: secret, isMfaEnabled: true })
      .where(eq(users.id, userId));
  }

  async verifyLogin(sessionId: string, userId: string, code: string): Promise<void> {
    const userRecords = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const user = userRecords[0];

    if (!user || !user.isMfaEnabled || !user.totpSecret) {
      throw new ForbiddenError('MFA not enabled for user');
    }

    const isValid = authenticator.verify({ token: code, secret: user.totpSecret });
    if (!isValid) {
      throw new ForbiddenError('Invalid MFA code');
    }

    await db.update(sessions)
      .set({ mfaVerified: true })
      .where(eq(sessions.id, sessionId));
  }
}

export const mfaService = new MfaService();
