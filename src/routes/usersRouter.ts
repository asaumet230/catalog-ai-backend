import { Router } from 'express';
import { check } from 'express-validator';
import { getAllUsers, getUserById, updateUser, deleteUser, getProfile } from '../controllers';
import { fieldValidator, jwtValidator, permissionValidator } from '../middlewares';
import { userExist } from '../helpers';

/**
 * Users Router
 * Handles user CRUD operations
 */
export const usersRouter = Router();

//* Get all users (Admin only)
usersRouter.get('/', [
    jwtValidator,
    permissionValidator(['admin_role']),
], getAllUsers);

//* Get authenticated user profile
usersRouter.get('/profile', [
    jwtValidator,
], getProfile);

//* Get user by ID
usersRouter.get('/:id', [
    jwtValidator,
    check('id', 'Invalid ID').isMongoId(),
    check('id').custom(userExist),
    fieldValidator,
], getUserById);

//* Update user
usersRouter.put('/:id', [
    jwtValidator,
    check('id', 'Invalid ID').isMongoId(),
    check('id').custom(userExist),
    fieldValidator,
], updateUser);

//* Delete user (Admin only)
usersRouter.delete('/:id', [
    jwtValidator,
    permissionValidator(['admin_role']),
    check('id', 'Invalid ID').isMongoId(),
    check('id').custom(userExist),
    fieldValidator,
], deleteUser);
