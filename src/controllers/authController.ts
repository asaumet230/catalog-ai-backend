import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { User } from '../models';
import { generateJWT, sendError } from '../helpers';
import { IUser } from '../interfaces';


//* Register new user
export const register = async (req: Request, res: Response): Promise<Response> => {
    const { name, email, password } = req.body as IUser;

    try {
        //* Check if user already exists
        const userExists = await User.findOne({ email: email.toLowerCase() });

        if (userExists) {
            return res.status(400).json({
                ok      : false,
                message : `The email ${email} is already registered`,
            });
        }

        //* Hash password
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);

        //* Create new user
        const newUser = new User({
            name,
            email     : email.toLowerCase(),
            password  : hashedPassword,
            provider  : 'credentials',
        });

        //* Save user to database
        await newUser.save({ validateBeforeSave: true });

        //* Generate JWT token
        const token = await generateJWT(newUser.id);

        return res.status(201).json({
            ok      : true,
            message : 'User registered successfully',
            user    : newUser,
            token,
        });

    } catch (error) {
        console.error('Register Error:', error);
        return sendError(res, error);
    }
}

//* Login user with credentials
export const login = async (req: Request, res: Response): Promise<Response> => {
    const { email, password } = req.body;

    try {
        //* Check if user exists
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(400).json({
                ok      : false,
                message : 'Invalid credentials - Email not found',
            });
        }

        //* Validate user is active
        if (!user.active) {
            return res.status(400).json({
                ok      : false,
                message : 'User is inactive - Contact administrator',
            });
        }

        //* Validate provider is credentials
        if (user.provider !== 'credentials') {
            return res.status(400).json({
                ok      : false,
                message : `This account uses ${user.provider} authentication`,
            });
        }

        //* Validate password
        const validPassword = bcrypt.compareSync(password, user.password);

        if (!validPassword) {
            return res.status(400).json({
                ok      : false,
                message : 'Invalid credentials - Incorrect password',
            });
        }

        //* Generate JWT token
        const token = await generateJWT(user.id);

        return res.status(200).json({
            ok      : true,
            message : 'Login successful',
            user,
            token,
        });

    } catch (error) {
        console.error('Login Error:', error);
        return sendError(res, error);
    }
}

//* Renew JWT token
export const renewToken = async (req: Request, res: Response): Promise<Response> => {
    const { authenticatedUser } = req.body;

    try {
        //* Generate new JWT token
        const token = await generateJWT(authenticatedUser.id);

        return res.status(200).json({
            ok      : true,
            message : 'Token renewed successfully',
            user    : authenticatedUser,
            token,
        });

    } catch (error) {
        console.error('Renew Token Error:', error);
        return sendError(res, error);
    }
}

//* Sync user from OAuth providers (for NextAuth integration)
export const syncOAuthUser = async (req: Request, res: Response): Promise<Response> => {
    const { email, name, image, provider, providerId } = req.body;

    try {
        //* Check if user exists
        let user = await User.findOne({ email: email.toLowerCase() });

        if (user) {
            //* Update existing user
            user.name = name || user.name;
            user.avatar = image || user.avatar;
            user.provider = provider || user.provider;
            user.providerId = providerId || user.providerId;

            await user.save();
        } else {
            //* Create new user from OAuth
            user = new User({
                name,
                email     : email.toLowerCase(),
                avatar    : image,
                provider,
                providerId,
                password  : '', //* No password for OAuth users
            });

            await user.save({ validateBeforeSave: false });
        }

        //* Generate JWT token
        const token = await generateJWT(user.id);

        return res.status(200).json({
            ok      : true,
            message : 'User synced successfully',
            user,
            token,
        });

    } catch (error) {
        console.error('Sync OAuth User Error:', error);
        return sendError(res, error);
    }
}
