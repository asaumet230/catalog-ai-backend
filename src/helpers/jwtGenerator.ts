import jwt from 'jsonwebtoken';

/**
 * JWT Token Generator
 * Creates JWT tokens for authentication
 * Following Single Responsibility Principle (SOLID)
 *
 * @param id - User ID to encode in token
 * @returns Promise<string> JWT token
 */
export const generateJWT = (id: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const payload = { id };

        const secret = process.env.SECRET_JWT_SEED || '';

        if (!secret) {
            reject('SECRET_JWT_SEED is not defined in environment variables');
            return;
        }

        jwt.sign(
            payload,
            secret,
            {
                expiresIn: '24h',
            },
            (error, token) => {
                if (error) {
                    console.error('Error generating JWT:', error);
                    reject('Could not generate token');
                } else {
                    resolve(token as string);
                }
            }
        );
    });
}
