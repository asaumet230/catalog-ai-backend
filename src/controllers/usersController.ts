import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { User } from '../models';
import { sendError } from '../helpers';

/**
 * Users Controller
 * Handles user CRUD operations
 * Following Single Responsibility Principle (SOLID)
 */

//* Get all users (Admin only)
export const getAllUsers = async (_: Request, res: Response): Promise<Response> => {
    try {
        const users = await User.find({ active: true });

        return res.status(200).json({
            ok      : true,
            message : 'All users',
            total   : users.length,
            users,
        });

    } catch (error) {
        console.error('Get All Users Error:', error);
        return sendError(res, error);
    }
}

//* Get user by ID
export const getUserById = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;

    try {
        const user = await User.findById({ _id: id });

        if (!user) {
            return res.status(404).json({
                ok      : false,
                message : `User with id: ${id} not found`,
            });
        }

        return res.status(200).json({
            ok      : true,
            message : 'User found',
            user,
        });

    } catch (error) {
        console.error('Get User By ID Error:', error);
        return sendError(res, error);
    }
}

//* Update user
export const updateUser = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const { authenticatedUser, password, email, role, ...rest } = req.body;

    try {
        //* Prevent email and role updates (security)
        const updateData: any = { ...rest };

        //* Only hash password if provided
        if (password) {
            const salt = bcrypt.genSaltSync(10);
            updateData.password = bcrypt.hashSync(password, salt);
        }

        //* Update user
        const updatedUser = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({
                ok      : false,
                message : `User with id: ${id} not found`,
            });
        }

        return res.status(200).json({
            ok      : true,
            message : 'User updated successfully',
            user    : updatedUser,
        });

    } catch (error) {
        console.error('Update User Error:', error);
        return sendError(res, error);
    }
}

//* Delete user (soft delete)
export const deleteUser = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;

    try {
        //* Soft delete: set active to false
        const deletedUser = await User.findByIdAndUpdate(
            id,
            { active: false },
            { new: true }
        );

        if (!deletedUser) {
            return res.status(404).json({
                ok      : false,
                message : `User with id: ${id} not found`,
            });
        }

        return res.status(200).json({
            ok      : true,
            message : 'User deleted successfully',
            user    : deletedUser,
        });

    } catch (error) {
        console.error('Delete User Error:', error);
        return sendError(res, error);
    }
}

//* Get authenticated user profile
export const getProfile = async (req: Request, res: Response): Promise<Response> => {
    const { authenticatedUser } = req.body;

    try {
        return res.status(200).json({
            ok      : true,
            message : 'User profile',
            user    : authenticatedUser,
        });

    } catch (error) {
        console.error('Get Profile Error:', error);
        return sendError(res, error);
    }
}
