import mongoose from 'mongoose';

/**
 * Database Connection Options
 * Optimized for production use
 */
const dataBaseOptions = {
    socketTimeoutMS: 30000,
    serverSelectionTimeoutMS: 5000,
}

/**
 * Database Connection Function
 * Establishes connection to MongoDB
 * Following Dependency Inversion Principle (SOLID)
 *
 * @returns Promise<void>
 */
export const dbConnection = async (): Promise<void> => {
    try {
        const dbUri = process.env.DB_CNN || '';

        if (!dbUri) {
            throw new Error('DB_CNN environment variable is not defined');
        }

        await mongoose.connect(dbUri, dataBaseOptions);

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ MongoDB Database Online');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    } catch (error) {
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('❌ Error connecting to MongoDB:', error);
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        process.exit(1);
    }
}
