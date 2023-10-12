
export interface Permission {
    id: string;
    path: string;
}

export interface Role {
    id: string;
    name: string;
    permissions: Array<Permission>;
}

export interface User {
    id: string;
    date_created: Date;
    date_updated: Date | null;
    last_login: Date | null;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    enabled: boolean;
    dark_mode: boolean;
    thumbnail: null;
    external_provider: null;
    roles: Array<Role>;
}