import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '../generated/prisma';
import { JWTPayload, AuthUser } from './types';

const prisma = new PrismaClient();

const JWT_SECRET = process.env['JWT_SECRET'] || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env['JWT_REFRESH_SECRET'] || 'your-refresh-secret-key';
const JWT_SALT_ROUNDS = process.env['JWT_SALT_ROUNDS'] ? parseInt(process.env['JWT_SALT_ROUNDS']) : 12;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export class AuthUtils {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, JWT_SALT_ROUNDS);
  }

  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  static generateAccessToken(payload: Omit<JWTPayload, 'type'>): string {
    return jwt.sign(
      { ...payload, type: 'access' as const },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
  }

  static generateRefreshToken(payload: Omit<JWTPayload, 'type'>): string {
    return jwt.sign(
      { ...payload, type: 'refresh' as const },
      JWT_REFRESH_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );
  }

  static verifyToken(token: string, isRefresh = false): JWTPayload {
    const secret = isRefresh ? JWT_REFRESH_SECRET : JWT_SECRET;
    return jwt.verify(token, secret) as JWTPayload;
  }

  static async createSession(userId: number, refreshToken: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.session.create({
      data: {
        userId,
        token: refreshToken,
        expiresAt,
      },
    });
  }

  static async validateSession(refreshToken: string): Promise<boolean> {
    const session = await prisma.session.findUnique({
      where: { token: refreshToken },
    });

    if (!session) return false;
    if (session.expiresAt < new Date()) {
      await prisma.session.delete({ where: { id: session.id } });
      return false;
    }

    return true;
  }

  static async deleteSession(refreshToken: string): Promise<void> {
    await prisma.session.deleteMany({
      where: { token: refreshToken },
    });
  }

  static async getUserById(userId: number): Promise<AuthUser | null> {
    return prisma.user.findUnique({
      where: { id: userId },
    });
  }

  static async getUserByEmail(email: string): Promise<AuthUser | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }
}