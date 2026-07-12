import express from 'express';
import prisma from '../../../infrastructure/database/prisma.js';
import redisClient from '../../../infrastructure/redis/client.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const healthCheck = {
    status: 'UP',
    timestamp: new Date().toISOString(),
    database: 'DOWN',
    redis: 'DOWN',
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    healthCheck.database = 'UP';
  } catch (error) {
    healthCheck.status = 'DEGRADED';
    healthCheck.database = 'DOWN';
  }

  try {
    const ping = await redisClient.ping();
    if (ping === 'PONG') {
      healthCheck.redis = 'UP';
    }
  } catch (error) {
    healthCheck.status = 'DEGRADED';
    healthCheck.redis = 'DOWN';
  }

  res.status(healthCheck.status === 'UP' || healthCheck.status === 'DEGRADED' ? 200 : 503).json(healthCheck);
});

export default router;
