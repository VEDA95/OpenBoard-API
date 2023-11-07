import { z } from 'zod';

export const ExternalProvderCreate = z.object({
    name: z.string().min(1, 'A valid name is required...'),
    client_id: z.string().min(1, 'A valid Client ID is required...'),
    client_secret: z.string().min(1, 'A valid secret is required...').nullish(),
    use_pkce: z.boolean().nullish(),
    enabled: z.boolean().nullish(),
    default_login_method: z.boolean().nullish(),
    self_registration_enabled: z.boolean().nullish(),
    auth_url: z.string().min(1, 'A valid auth url is required...').url('A valid auth url is required...'),
    token_url: z.string().min(1, 'A valid token url is required...').url('A valid token url is required...'),
    userinfo_url: z.string().min(1, 'A valid userinfo url is required...').url('A valid userinfo url is required...'),
    logout_url: z.string().min(1, 'A valid logout url is required...').url('A valid logout url is required...').nullish(),
    required_email_domain: z.string().min(1, 'A valid domain name is required...').url('A valid domain name is required...').nullish(),
    roles: z.array(z.string().uuid('Role values must be valid Ids...')).nullish()
});

export const ExternalProvderUpdate = z.object({
    name: z.string().min(1, 'A valid name is required...').nullish(),
    client_id: z.string().min(1, 'A valid Client ID is required...').nullish(),
    client_secret: z.string().nullish(),
    use_pkce: z.boolean().nullish(),
    enabled: z.boolean().nullish(),
    default_login_method: z.boolean().nullish(),
    self_registration_enabled: z.boolean().nullish(),
    auth_url: z.string().min(1, 'A valid auth url is required...').url('A valid auth url is required...').nullish(),
    token_url: z.string().min(1, 'A valid token url is required...').url('A valid token url is required...').nullish(),
    userinfo_url: z.string().min(1, 'A valid userinfo url is required...').url('A valid userinfo url is required...').nullish(),
    logout_url: z.string().url('A valid logout url is required...').nullish(),
    required_email_domain: z.string().url('A valid domain name is required...').nullish(),
    roles: z.array(z.string().uuid('Role values must be valid Ids...')).nullish()
});

export const ExternalProvderParams = z.object({
    id: z.string().min(1, 'External Provider ID is required...').uuid('A valid External Provider ID is required...')
});

export type ExternalProvderCreateSchema = z.infer<typeof ExternalProvderCreate>;
export type ExternalProvderUpdateSchema = z.infer<typeof ExternalProvderUpdate>;
export type ExternalProvderParamsSchema = z.infer<typeof ExternalProvderParams>;