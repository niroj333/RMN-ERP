import argon2 from 'argon2';

export class PasswordService {
  async hash(plain: string): Promise<string> {
    return argon2.hash(plain);
  }

  async verify(hash: string, plain: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain);
    } catch (err) {
      return false;
    }
  }
}

export const passwordService = new PasswordService();
