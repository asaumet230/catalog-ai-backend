import { Response } from 'express';

/**
 * Send Error Helper
 * Centralized error response handler
 * Following DRY principle and Single Responsibility (SOLID)
 *
 * @param res - Express Response object
 * @param error - Error object or string
 * @returns Response with error details
 */
export const sendError = (res: Response, error: any): Response => {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ Error occurred:');
    console.error(error);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return res.status(500).json({
        ok      : false,
        message : 'Error: Contact the administrator',
        error   : process.env.NODE_ENV === 'development' ? `${error}` : undefined,
    });
}
