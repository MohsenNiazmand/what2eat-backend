import request from 'supertest';
import { jest } from '@jest/globals';
import app from '../src/interfaces/http/app.js';
import prisma from '../src/infrastructure/database/prisma.js';
import redisClient from '../src/infrastructure/redis/client.js';

describe('GET /health', () => {
  beforeAll(async () => {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
    if (redisClient.isOpen) {
      await redisClient.quit();
    }
  });

  it('should return 200 OK and status UP when all services are healthy', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'UP');
    expect(response.body).toHaveProperty('database', 'UP');
    expect(response.body).toHaveProperty('redis', 'UP');
  });

  it('should return 200 and status DEGRADED when database is down', async () => {
    const queryRawSpy = jest
      .spyOn(prisma, '$queryRaw')
      .mockRejectedValue(new Error('DB Error'));

    try {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'DEGRADED');
      expect(response.body).toHaveProperty('database', 'DOWN');
      expect(response.body).toHaveProperty('redis', 'UP');
    } finally {
      queryRawSpy.mockRestore();
    }
  });
});
