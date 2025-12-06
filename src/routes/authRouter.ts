import { Router } from 'express';
import { check } from 'express-validator';
import { register, login, renewToken, syncOAuthUser } from '../controllers';
import { fieldValidator, jwtValidator } from '../middlewares';
import { emailExist } from '../helpers';

/**
 * Auth Router
 * Handles authentication routes
 */
export const authRouter = Router();

//* Register new user
authRouter.post('/register', [
    check('name', 'Name is required').notEmpty(),
    check('email', 'Email is required').isEmail(),
    check('email').custom(emailExist),
    check('password', 'Password is required').notEmpty(),
    check('password', 'Password must be at least 8 characters').isLength({ min: 8 }),
    fieldValidator,
], register);

//* Login with credentials
authRouter.post('/login', [
    check('email', 'Email is required').isEmail(),
    check('password', 'Password is required').notEmpty(),
    fieldValidator,
], login);

//* Renew JWT token
authRouter.get('/renew', [
    jwtValidator,
], renewToken);

//* Sync OAuth user (for NextAuth integration)
authRouter.post('/sync-oauth', [
    check('email', 'Email is required').isEmail(),
    check('name', 'Name is required').notEmpty(),
    check('provider', 'Provider is required').notEmpty(),
    check('provider', 'Invalid provider').isIn(['google', 'github', 'facebook']),
    fieldValidator,
], syncOAuthUser);
