export const selectExternalProvider: string = 'SELECT * FROM open_board_external_auth_provider WHERE id = $1;';

export const selectExternalProviderRoles: string = `
    SELECT
        external_provider_roles.provider_id,
        role.*
    FROM open_board_external_provider_roles external_provider_roles
    JOIN open_board_role role ON external_provider_roles.role_id = role.id
    WHERE external_provider.provider_id = $1;
`;