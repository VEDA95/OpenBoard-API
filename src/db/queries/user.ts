
export const selectUsersQuery: string = `
    SELECT
        usr.id AS usr_id,
        usr.username AS usr_username,
        usr.email AS usr_email,
        usr.first_name AS usr_first_name,
        usr.last_name AS usr_last_name,
        usr.enabled AS usr_enabled,
        usr.date_created AS usr_date_created,
        usr.date_updated AS usr_date_updated,
        usr.last_login AS usr_last_login,
        usr.dark_mode AS usr_dark_mode,
        file_upload.id AS file_upload_id,
        file_upload.name AS file_upload_name,
        file_upload.date_created AS file_upload_date_created,
        file_upload.date_updated AS file_upload_date_updated,
        file_upload.file_size AS file_upload_file_size,
        file_upload.additional_details AS file_upload_additional_details,
        external_auth.id AS external_auth_id,
        external_auth.name AS external_auth_name,
        external_auth.default_login_method AS external_auth_default_login
    FROM open_board_user usr
    LEFT JOIN open_board_file_upload file_upload ON file_upload.id = usr.thumbnail
    LEFT JOIN open_board_external_auth_provider external_auth ON external_auth.id = usr.external_provider_id;
`;

export const selectUsersRolesQuery: string = `
    SELECT
        user_role.user_id,
        role.*
    FROM open_board_user_roles user_role
    JOIN open_board_role role ON role.id = user_role.role_id;
`;

export const selectRolesPermissionsQuery: string = `
    SELECT
        role_permission.role_id,
        permission.*
    FROM open_board_role_permissions role_permission
    JOIN open_board_role_permission permission ON permission.id = role_permission.permission_id;
`;

export const selectUserQuery: string = `
    SELECT
        usr.id AS usr_id,
        usr.username AS usr_username,
        usr.email AS usr_email,
        usr.first_name AS usr_first_name,
        usr.last_name AS usr_last_name,
        usr.enabled AS usr_enabled,
        usr.date_created AS usr_date_created,
        usr.date_updated AS usr_date_updated,
        usr.last_login AS usr_last_login,
        usr.dark_mode AS usr_dark_mode,
        file_upload.id AS file_upload_id,
        file_upload.name AS file_upload_name,
        file_upload.date_created AS file_upload_date_created,
        file_upload.date_updated AS file_upload_date_updated,
        file_upload.file_size AS file_upload_file_size,
        file_upload.additional_details AS file_upload_additional_details,
        external_auth.id AS external_auth_id,
        external_auth.name AS external_auth_name,
        external_auth.default_login_method AS external_auth_default_login
    FROM open_board_user usr
    LEFT JOIN open_board_file_upload file_upload ON file_upload.id = usr.thumbnail
    LEFT JOIN open_board_external_auth_provider external_auth ON external_auth.id = usr.external_provider_id
    WHERE usr.id = $1;
`;

export const selectUserRolesQuery: string = `
    SELECT
        user_role.user_id,
        role.*
    FROM open_board_user_roles user_role
    JOIN open_board_role role ON role.id = user_role.role_id
    WHERE user_role.user_id = $1;
`;

export const selectRolePermissionsQuery: string = `
    SELECT
        role_permission.role_id,
        permission.*
    FROM open_board_role_permissions role_permission
    JOIN open_board_role_permission permission ON permission.id = role_permission.permission_id
    WHERE role_permission.role_id = ANY($1);
`;