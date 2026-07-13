import prisma from '../database/prisma.js';

export class UserRepository {
  async findByMobile(mobile) {
    return prisma.user.findUnique({ where: { mobile } });
  }

  async create(mobile) {
    return prisma.user.create({ data: { mobile } });
  }
}
