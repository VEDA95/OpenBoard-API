import { z } from 'zod';

export const RoleCreate = z.object({
    name: z.string().min(1, 'A role name must be provided...'),
    permissions: z.array(z.string().uuid('Permission values must be valid Ids...')).nullish()
});

export const RoleUpdate = z.object({
    name: z.string().min(1, 'A role name must be provided...').nullish(),
    permissions: z.array(z.string().uuid('Permission values must be valid Ids...')).nullish()
});

export const RoleParams = z.object({
    id: z.string().min(1, 'Role ID must be provided...').uuid('Value must be a valid Id...')
});

export type RoleCreateSchema = z.infer<typeof RoleCreate>;
export type RoleUpdateSchema = z.infer<typeof RoleUpdate>;
export type RoleParamsSchema = z.infer<typeof RoleParams>;