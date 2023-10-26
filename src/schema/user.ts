import { z } from 'zod';

const UserCreate = z.object({
    username: z.string().min(1, 'A valid username is required...'),
    email: z.string().min(1, 'A valid email address is required...').email('A valid email address is required...'),
    password: z.string().min(8, 'Password must be at least 8 characters long...').max(24, 'The max length of the password can only be 24 characters...'),
    first_name: z.string().min(1, 'Provide a first name that is not empty..').nullish(),
    last_name: z.string().min(1, 'Provide a last name that is not empty..').nullish(),
});

const UserUpdate = z.object({
    username: z.string().min(1, 'A valid username is required...').nullish(),
    email: z.string().min(1, 'A valid email address is required...').email('A valid email address is required...').nullish(),
    first_name: z.string().min(1, 'Provide a first name that is not empty..').nullish(),
    last_name: z.string().min(1, 'Provide a last name that is not empty..').nullish(),
});

export const AdminUserCreate = UserCreate.extend({
    enabled: z.boolean().nullish(),
    email_verified: z.boolean().nullish(),
    reset_password_on_login: z.boolean().nullish(),
    external_provider_id: z.string().nullish(),
    roles: z.array(z.string().uuid('Values must be valid Ids...')).nullish()
});

export const AdminUserUpdate = UserUpdate.extend({
    password: z.string().min(8, 'Password must be at least 8 characters long...').max(24, 'The max length of the password can only be 24 characters...').nullish(),
    enabled: z.boolean().nullish(),
    email_verified: z.boolean().nullish(),
    reset_password_on_login: z.boolean().nullish(),
    external_provider_id: z.string().nullish(),
    roles: z.array(z.string().uuid('Values must be valid Ids...')).nullish()
});

export const PublicUserCreate = UserCreate.extend({
    confirm_password: z.string().min(1, 'Please retype your password...')
});

export const PublicUserUpdate = UserUpdate.extend({
    thumbnail_id: z.string().uuid('A valid Id for thumbnails is required...').nullish()
});

export const PublicUserPasswordReset = z.object({
    password: z.string().min(8, 'Passwords must be at least 8 characters long...').max(24, 'The max length of a password can only be 24 characters...'),
    confirm_password: z.string().min(1, 'Please retype your password...')
});

export const UserParams = z.object({
    id: z.string().min(1, 'User ID must be provided...').uuid('Value must be a valid Id...')
});

export type AdminUserCreateSchema = z.infer<typeof AdminUserCreate>;
export type AdminUserUpdateSchema = z.infer<typeof AdminUserUpdate>;
export type PublicUserCreateSchema = z.infer<typeof PublicUserCreate>;
export type PublicUserUpdateSchema = z.infer<typeof PublicUserUpdate>;
export type UserParamsSchema = z.infer<typeof UserParams>;