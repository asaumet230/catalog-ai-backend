import { User, Catalog } from '../models';

/**
 * Database Validators
 * Custom validators for express-validator
 * Following Single Responsibility Principle (SOLID)
 */

/**
 * Validate if user exists by ID
 * @param id - User ID
 * @throws Error if user not found
 */
export const userExist = async (id: string): Promise<void> => {
    const user = await User.findById({ _id: id });

    if (!user) {
        throw new Error(`The user with id: ${id} does not exist`);
    }

    if (!user.active) {
        throw new Error(`The user with id: ${id} is inactive`);
    }
}

/**
 * Validate if email is already registered
 * @param email - User email
 * @throws Error if email already exists
 */
export const emailExist = async (email: string): Promise<void> => {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
        throw new Error(`The email ${email} is already registered`);
    }
}

/**
 * Validate if catalog exists by ID
 * @param id - Catalog ID
 * @throws Error if catalog not found
 */
export const catalogExist = async (id: string): Promise<void> => {
    const catalog = await Catalog.findById({ _id: id });

    if (!catalog) {
        throw new Error(`The catalog with id: ${id} does not exist`);
    }
}

/**
 * Validate if role is valid
 * @param role - User role
 * @throws Error if role is invalid
 */
export const isValidRole = (role: string): void => {
    const validRoles = ['user_role', 'admin_role'];

    if (!validRoles.includes(role)) {
        throw new Error(`Invalid role. Valid roles: ${validRoles.join(', ')}`);
    }
}
