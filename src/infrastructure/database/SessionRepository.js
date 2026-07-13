import prisma from './prisma.js';

export class SessionRepository {
  async deleteByUserId(userId) {
    return prisma.session.deleteMany({ where: { userId } });
  }

  async create({ userId, refreshToken, deviceId, expiresAt }) {
    return prisma.session.create({
      data: {
        userId,
        token: refreshToken,
        deviceId,
        expiresAt,
      },
    });
  }

  async findActiveSession(userId, deviceId) {
    return prisma.session.findFirst({
      where: {
        userId,
        deviceId,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
  }
}
