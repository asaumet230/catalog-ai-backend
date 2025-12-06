import { Schema, model } from 'mongoose';
import { IUser } from '../interfaces';

const userSchema = new Schema<IUser>({
    name: {
        type      : String,
        required  : [true, 'Name is required'],
        trim      : true,
    },
    email: {
        type      : String,
        required  : [true, 'Email is required'],
        unique    : true,
        lowercase : true,
        trim      : true,
        match     : [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
        type      : String,
        required  : function(this: IUser) {
            return this.provider === 'credentials';
        },
        validate  : {
            validator: function(this: IUser, value: string): boolean {
                // Only validate password length for credentials provider
                if (this.provider === 'credentials') {
                    return Boolean(value && value.length >= 8);
                }
                // For OAuth providers, password can be empty
                return true;
            },
            message: 'Password must be at least 8 characters'
        },
    },
    avatar: {
        type      : String,
        default   : 'https://res.cloudinary.com/catalogai/image/upload/v1234567890/default-avatar.png',
    },
    role: {
        type      : String,
        enum      : ['user_role', 'admin_role'],
        default   : 'user_role',
    },
    active: {
        type      : Boolean,
        default   : true,
    },
    provider: {
        type      : String,
        enum      : ['credentials', 'google', 'github', 'facebook'],
        default   : 'credentials',
        required  : true,
    },
    providerId: {
        type      : String,
        required  : function(this: IUser) {
            return this.provider !== 'credentials';
        },
    },
}, {
    timestamps: true,
});

/**
 * Remove sensitive fields from JSON response
 * Following security best practices (SOLID: Single Responsibility)
 */
userSchema.methods.toJSON = function() {
    const { __v, password, ...user } = this.toObject();
    return user;
}

/**
 * User Model
 * Exported for use in controllers and services
 */
export const User = model<IUser>('User', userSchema);
