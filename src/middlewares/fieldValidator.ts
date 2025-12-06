import { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';

/**
 * Field Validator Middleware
 * Validates request fields using express-validator
 * Following Single Responsibility Principle (SOLID)
 *
 * @param req - Express Request
 * @param res - Express Response
 * @param next - Express NextFunction
 * @returns Response with validation errors or calls next()
 */
export const fieldValidator = (req: Request, res: Response, next: NextFunction): void | Response => {
    const errors = validationResult(req);

    

    if (!errors.isEmpty()) {
        return res.status(400).json({
            ok      : false,
            message : 'Validation errors',
            errors  : errors.array(),
        });
    }

    next();
}
