/**
 * CatalogAI Backend Application
 * Entry point for the Express server
 *
 * @author Andres Felipe Saumet
 * @version 1.0.0
 */

//* CRITICAL: Load environment variables FIRST, before any other imports
import dotenv from 'dotenv';
dotenv.config();

console.log('🔧 Environment variables loaded');
console.log('OpenAI Key exists:', !!process.env.OPENAI_API_KEY);
console.log('Redis Host exists:', !!process.env.REDIS_HOST);

//* Now import other modules after env is loaded
import { Server } from './models';

/**
 * Initialize and start server
 */
const server = new Server();
server.listen();

/**
 * Initialize catalog worker (after server starts)
 */
import('./workers/catalogWorker').then(() => {
    console.log('✅ Worker module loaded');
});
