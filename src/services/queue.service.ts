import { Queue } from 'bullmq';
import Redis from 'ioredis';

// Create Redis connection for BullMQ
const connection = new Redis({
    host: process.env.REDIS_HOST!,
    port: parseInt(process.env.REDIS_PORT || '18245'),
    password: process.env.REDIS_PASSWORD!,
    username: process.env.REDIS_USERNAME || 'default',
    maxRetriesPerRequest: null, // Important for BullMQ
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
});

export const catalogQueue = new Queue('catalog-generation', {
    connection,
    defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 1, // No automatic retries to avoid duplicate OpenAI calls
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
    },
});

catalogQueue.on('error', (error) => {
    console.error('❌ Queue error:', error.message);
});

connection.on('connect', () => {
    console.log('✅ BullMQ connected to Redis Cloud');
});

connection.on('error', (err) => {
    console.error('❌ BullMQ Redis error:', err.message);
});

console.log('✅ BullMQ Queue initialized');

export default catalogQueue;
