import type { Role } from './user';

export interface ExternalProvider {
    id: string;
    date_created: Date;
    date_updated: Date | null;
    name: string;
    client_id: string;
    client_secret: string | null;
    enabled: boolean;
    use_pkce: boolean;
    default_login_method: boolean;
    self_registration_enabled: boolean;
    auth_url: string;
    token_url: string;
    userinfo_url: string;
    logout_url: string | null;
    required_email_domain: string | null;
    roles: Array<Role>
}