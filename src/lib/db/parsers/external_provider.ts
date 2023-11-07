import { parsePermissions } from './role';
import type { ExternalProvider } from '../../../types/external_provider';
import type { Permission, Role, Relation, RelationArray } from '../../../types/user';
import type { QueryRows } from '../../../types/query';
import type { QueryResultRow } from 'pg';


function parseExternalProviderRoles(roleData: QueryRows, permissionData: QueryRows): RelationArray {
    const permissions: RelationArray = parsePermissions(permissionData);

    return roleData.reduce((accumValue: RelationArray, currentValue: QueryResultRow): RelationArray => {
        const relationMatch: Relation | undefined = accumValue.find((item: Relation): boolean => item.role?.id === currentValue.id);

        if(relationMatch != null) return accumValue.map((item: Relation): Relation => {
            if(item.role?.id === relationMatch.role?.id) return {
                ...item,
                ids: [
                    ...item.ids,
                    currentValue.provider_id
                ]
            };

            return item;
        });

        return [
            ...accumValue,
            {
                role: {
                    id: currentValue.id,
                    name: currentValue.name,
                    permissions: permissions
                                    .filter((item: Relation): boolean => item.ids.includes(currentValue.id))
                                    .map((item: Relation): Permission => item.permission as Permission)
                },
                ids: [currentValue.provider_id]
            }
        ];
    }, []);
}

export function parseExtneralProvider(externalProviderData: QueryResultRow, roleData: QueryRows, permissionData: QueryRows): ExternalProvider {
    const roles: RelationArray = parseExternalProviderRoles(roleData, permissionData);

    return {
        id: externalProviderData.id,
        date_created: externalProviderData.date_created,
        date_updated: externalProviderData.date_updated,
        name: externalProviderData.name,
        client_id: externalProviderData.client_id,
        client_secret: externalProviderData.client_secret,
        use_pkce: externalProviderData.use_pkce,
        enabled: externalProviderData.enabled,
        default_login_method: externalProviderData.default_login_method,
        self_registration_enabled: externalProviderData.self_registration_enabled,
        auth_url: externalProviderData.auth_url,
        token_url: externalProviderData.token_url,
        userinfo_url: externalProviderData.userinfo_url,
        logout_url: externalProviderData.logout_url,
        required_email_domain: externalProviderData.required_email_domain,
        roles: roles.map((item: Relation): Role => item.role as Role)
    };
}

export function parseExtneralProviders(externalProviderData: QueryRows, roleData: QueryRows, permissionData: QueryRows): Array<ExternalProvider> {
    const roles: RelationArray = parseExternalProviderRoles(roleData, permissionData);

    return externalProviderData.map((item: QueryResultRow): ExternalProvider => ({
        id: item.id,
        date_created: item.date_created,
        date_updated: item.date_updated,
        name: item.name,
        client_id: item.client_id,
        client_secret: item.client_secret,
        use_pkce: item.use_pkce,
        enabled: item.enabled,
        default_login_method: item.default_login_method,
        self_registration_enabled: item.self_registration_enabled,
        auth_url: item.auth_url,
        token_url: item.token_url,
        userinfo_url: item.userinfo_url,
        logout_url: item.logout_url,
        required_email_domain: item.required_email_domain,
        roles: roles
                .filter((relation: Relation): boolean => relation.ids.includes(item.id))
                .map((relation: Relation): Role => relation.role as Role)
    }));
}