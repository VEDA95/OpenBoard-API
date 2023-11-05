import type { User, Permission, Role, Relation, RelationArray } from '../../../types/user';
import type { QueryRows } from '../../../types/query';
import type { QueryResultRow } from 'pg';

export function parseUserRoles(role_data: QueryRows, permission_data: QueryRows): RelationArray {
    const permissions: RelationArray = permission_data.reduce((accumValue: RelationArray, currentValue: QueryResultRow): RelationArray => {
        const relationMatch: Relation | undefined = accumValue.find((item: Relation): boolean => item.permission?.id === currentValue.id);

        if(relationMatch != null) return accumValue.map((item: Relation): Relation => {
            if(item.permission?.id === relationMatch.permission?.id) return {
                ...item,
                ids: [
                    ...item.ids,
                    currentValue.role_id
                ]
            };

            return item;
        });

        return [
            ...accumValue,
            {
                permission: {
                    id: currentValue.id,
                    path: currentValue.path
                },
                ids: [currentValue.role_id]
            }
        ];
    }, []);

    return role_data.reduce((accumValue: RelationArray, currentValue: QueryResultRow): RelationArray => {
        const relationMatch: Relation | undefined = accumValue.find((item: Relation): boolean => item.role?.id === currentValue.id);

        if(relationMatch != null) return accumValue.map((item: Relation): Relation => {
            if(item.role?.id === relationMatch.role?.id) return {
                ...item,
                ids: [
                    ...item.ids,
                    currentValue.user_id
                ]
            };

            return item;
        });

        const role: Role = {
            id: currentValue.id,
            name: currentValue.name,
            permissions: permissions
                            .filter((item: Relation): boolean => item.ids.includes(currentValue.id))
                            .map((item: Relation): Permission => item.permission as Permission)
        };

        return [
            ...accumValue,
            {
                role: role,
                ids: [currentValue.user_id]
            }
        ];
    }, []);
}

export function parseUsers(user_data: QueryRows, role_data: QueryRows, permission_data: QueryRows): Array<User> {
    const roles: RelationArray = parseUserRoles(role_data, permission_data);

    return user_data.map((item: QueryResultRow): User => ({
        id: item.usr_id,
        date_created: item.usr_date_created,
        date_updated: item.usr_date_updated,
        last_login: item.usr_last_login,
        username: item.usr_username,
        email: item.usr_email,
        first_name: item.usr_first_name,
        last_name: item.usr_last_name,
        enabled: item.usr_enabled,
        dark_mode: item.usr_dark_mode,
        external_provider: null,
        thumbnail: null,
        roles: roles
                .filter((roleRelation: Relation): boolean => roleRelation.ids.includes(item.usr_id))
                .map((roleRelation: Relation): Role => roleRelation.role as Role)
    }));
}

export function parseUser(user_data: QueryResultRow, role_data: QueryRows, permission_data: QueryRows): User {
    const roles: RelationArray = parseUserRoles(role_data, permission_data);

    return {
        id: user_data.usr_id,
        date_created: user_data.usr_date_created,
        date_updated: user_data.usr_date_updated,
        last_login: user_data.usr_last_login,
        username: user_data.usr_username,
        email: user_data.usr_email,
        first_name: user_data.usr_first_name,
        last_name: user_data.usr_last_name,
        enabled: user_data.usr_enabled,
        dark_mode: user_data.usr_dark_mode,
        external_provider: null,
        thumbnail: null,
        roles: roles
                .filter((roleRelation: Relation): boolean => roleRelation.ids.includes(user_data.usr_id))
                .map((roleRelation: Relation): Role => roleRelation.role as Role)
    }
}