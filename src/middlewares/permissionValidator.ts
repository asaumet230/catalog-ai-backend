import { NextFunction, Request, Response } from 'express';

/**
 * Permission Validator Middleware
 * Validates user roles and permissions
 * Following Single Responsibility Principle (SOLID)
 *
 * @param roles - Array of allowed roles
 * @returns Middleware function
 */
export const permissionValidator = (roles: string[]) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
        //* Check if authenticatedUser exists in request body
        if (!req.body.authenticatedUser) {
            return res.status(500).json({
                ok      : false,
                message : 'Cannot validate role without token verification',
            });
        }

        const { role, name } = req.body.authenticatedUser;

        //* Validate user role is included in allowed roles
        if (!roles.includes(role)) {
            return res.status(403).json({
                ok      : false,
                message : `User: ${name} does not have the required permissions. Required roles: ${roles.join(', ')}`,
            });
        }

        next();
    }
}
