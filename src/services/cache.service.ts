import Redis from 'ioredis';
import crypto from 'crypto';

class CacheService {
    private client: Redis;
    private readonly TTL = 2592000; // 30 days

    constructor() {
        this.client = new Redis({
            host: process.env.REDIS_HOST!,
            port: parseInt(process.env.REDIS_PORT || '18245'),
            password: process.env.REDIS_PASSWORD!,
            username: process.env.REDIS_USERNAME || 'default',
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            maxRetriesPerRequest: null, // Important for BullMQ
        });

        this.client.on('connect', () => {
            console.log('✅ Redis Cloud connected');
        });

        this.client.on('error', (err) => {
            console.error('❌ Redis connection error:', err.message);
        });

        console.log('✅ Redis client initialized');
    }

    generateHash(content: string): string {
        return crypto.createHash('md5').update(content).digest('hex');
    }

    async get(key: string): Promise<any> {
        try {
            const data = await this.client.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }

    async set(key: string, value: any, ttl: number = this.TTL): Promise<void> {
        try {
            await this.client.setex(key, ttl, JSON.stringify(value));
        } catch (error) {
            console.error('Cache set error:', error);
        }
    }

    async delete(key: string): Promise<void> {
        try {
            await this.client.del(key);
        } catch (error) {
            console.error('Cache delete error:', error);
        }
    }

    async clear(): Promise<void> {
        try {
            await this.client.flushdb();
            console.log('✅ Cache cleared');
        } catch (error) {
            console.error('Cache clear error:', error);
        }
    }

    // Get the Redis client for BullMQ
    getClient(): Redis {
        return this.client;
    }
}

export default new CacheService();
