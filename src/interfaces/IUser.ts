import { Document } from 'mongoose';

/**
 * Interface for User document
 * Extends Mongoose Document for type safety
 */
export interface IUser extends Document {
    name            : string;
    email           : string;
    password        : string;
    avatar?         : string;
    role            : 'user_role' | 'admin_role';
    active          : boolean;
    provider        : 'credentials' | 'google' | 'github' | 'facebook';
    providerId?     : string;
    createdAt       : Date;
    updatedAt       : Date;
}
