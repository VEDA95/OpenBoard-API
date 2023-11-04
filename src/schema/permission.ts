import { z } from 'zod';

export const PermissionCreate = z.object({
    path: z.string().min(1, 'A permission path must be provided...')
});

export const PermissionUpdate = z.object({
    path: z.string().min(1, 'A permission path must be provided...').nullish()
});

export const PermissionParams = z.object({
    id: z.string().min(1, 'Permission ID must be provided...').uuid('Value must be a valid Id...')
});

export type PermissionCreateSchema = z.infer<typeof PermissionCreate>;
export type PermissionUpdateSchema = z.infer<typeof PermissionUpdate>;
export type PermissionParamsSchema = z.infer<typeof PermissionParams>;