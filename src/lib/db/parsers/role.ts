import type { Permission, Role, Relation, RelationArray } from '../../../types/user';
import type { QueryRows } from '../../../types/query';
import type { QueryResultRow } from 'pg';

export function parsePermissions(permissionData: QueryRows): RelationArray {
    return permissionData.reduce((accumValue: RelationArray, currentValue: QueryResultRow): RelationArray => {
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
}

export function parseRole(roleData: QueryResultRow, permissionData: QueryRows): Role {
    const permissions: RelationArray = parsePermissions(permissionData);

    return {
        id: roleData.id,
        name: roleData.name,
        permissions: permissions
                        .filter((item: Relation): boolean => item.ids.includes(roleData.id))
                        .map((item: Relation): Permission => item.permission as Permission)
    };
}

export function parseRoles(roleData: QueryRows, permissionData: QueryRows): Array<Role> {
    const permissions: RelationArray = parsePermissions(permissionData);

    return roleData.reduce((accumValue: Array<Role>, currentValue: QueryResultRow): Array<Role> => {
        const relationMatch: Role | undefined = accumValue.find((item: Role): boolean => item.id === currentValue.id);

        if(relationMatch != null) return accumValue;

        return [
            ...accumValue,
            {
                id: currentValue.id,
                name: currentValue.name,
                permissions: permissions
                                .filter((item: Relation): boolean => item.ids.includes(currentValue.id))
                                .map((item: Relation): Permission => item.permission as Permission)
            }
        ];
    }, []);
}