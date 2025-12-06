import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { sendError } from '../helpers';

/**
 * JWT Validator Middleware
 * Validates JWT token from request headers
 * Following Single Responsibility Principle (SOLID)
 *
 * @param req - Express Request
 * @param res - Express Response
 * @param next - Express NextFunction
 * @returns Response with error or calls next()
 */
export const jwtValidator = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
    const token = req.header('x-token');

    if (!token) {
        return res.status(401).json({
            ok      : false,
            message : 'No token provided, invalid permission',
        });
    }

    try {
        const secret = process.env.SECRET_JWT_SEED || '';

      

        if (!secret) {
            throw new Error('SECRET_JWT_SEED is not defined');
        }

        const { id } = jwt.verify(token, secret) as { id: string };          

        const authenticatedUser = await User.findById({ _id: id });

        if (!authenticatedUser) {
            return res.status(401).json({
                ok      : false,
                message : 'Invalid token - User does not exist',
            });
        }

        if (!authenticatedUser.active) {
            return res.status(401).json({
                ok      : false,
                message : 'Invalid token - User is inactive',
            });
        }

        

        req.body.authenticatedUser = authenticatedUser;

        next();

    } catch (error) {
        console.error('JWT Validation Error:', error);
        return sendError(res, error);
    }
}
