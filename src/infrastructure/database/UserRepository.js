import prisma from '../database/prisma.js';

export class UserRepository {
  async findByMobile(mobile) {
    return prisma.user.findUnique({ where: { mobile } });
  }

  async findById(id) {
    return prisma.user.findUnique({ where: { id } });
  }

  async create(mobile) {
    return prisma.user.create({ data: { mobile } });
  }

  async updateName(id, name) {
    return prisma.user.update({
      where: { id },
      data: { name },
    });
  }
}
