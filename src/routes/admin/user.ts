import { zodToJsonSchema } from 'zod-to-json-schema';
import { AdminUserCreate, AdminUserUpdate, UserParams } from '../../schema/user';
import { parseUsers, parseUser } from '../../db/parsers/user';
import { hashPassword } from '../../auth/password';
import type { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply} from 'fastify';
import type { DoneCallback } from '../types/done';
import type { Role, User } from '../types/user';
import type { OKResponse } from '../types/response';
import type { AdminUserCreateSchema, AdminUserUpdateSchema, UserParamsSchema} from '../../schema/user';
import type { QueryResult, QueryResultRow } from 'pg';

export default (fastify: FastifyInstance, options: FastifyPluginOptions, done: DoneCallback): void => {
    fastify.get('/users', async (request: FastifyRequest, response: FastifyReply): Promise<OKResponse<Array<User>>> => {
        try {
            await fastify.db.query('BEGIN;');

            const users_query: QueryResult = await fastify.db.query(`
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
            `);
            const user_roles_query: QueryResult = await fastify.db.query(`
                SELECT
                    user_role.user_id,
                    role.*
                FROM open_board_user_roles user_role
                JOIN open_board_role role ON role.id = user_role.role_id;
            `);
            const role_permissions_query: QueryResult = await fastify.db.query(`
                SELECT
                    role_permission.role_id,
                    permission.*
                FROM open_board_role_permissions role_permission
                JOIN open_board_role_permission permission ON permission.id = role_permission.permission_id;
            `);


            await fastify.db.query('COMMIT;');

            const users: Array<User> = parseUsers(users_query.rows, user_roles_query.rows, role_permissions_query.rows);

            return {
                code: 200,
                count: users.length,
                data: users
            };

        } catch(err: any) {
            request.log.error(err.message);
            throw err;
        }

    });

    fastify.get('/users/:id', {
        schema: {
            params: zodToJsonSchema(UserParams, {errorMessages: true})
        }
    }, async (request: FastifyRequest<{Params: UserParamsSchema}>, response: FastifyReply): Promise<OKResponse<User>> => {
        const { id } = request.params;

        try {
            await fastify.db.query('BEGIN;');

            const user_query: QueryResult = await fastify.db.query(`
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
            `, [id]);
            const user_roles_query: QueryResult = await fastify.db.query(`
                SELECT
                    user_role.user_id,
                    role.*
                FROM open_board_user_roles user_role
                JOIN open_board_role role ON role.id = user_role.role_id
                WHERE user_role.user_id = $1;
            `, [id]);
            const role_permissions_query: QueryResult = await fastify.db.query(`
                SELECT
                    role_permission.role_id,
                    permission.*
                FROM open_board_role_permissions role_permission
                JOIN open_board_role_permission permission ON permission.id = role_permission.permission_id
                WHERE role_permission.role_id = ANY($1);
            `, [user_roles_query.rows.map((item: QueryResultRow): string => item.id)]);


            await fastify.db.query('COMMIT;');

            const user: User = parseUser(user_query.rows[0], user_roles_query.rows, role_permissions_query.rows);

            return {
                code: 200,
                data: user
            };

        } catch(err: any) {
            request.log.error(err.message);
            throw err;
        }
    });

    fastify.post('/users', {
        schema: {
            body: zodToJsonSchema(AdminUserCreate, {errorMessages: true})
        }
    }, async (request: FastifyRequest<{Body: AdminUserCreateSchema}>, response: FastifyReply): Promise<OKResponse<User>> => {
        const {
            username,
            email,
            first_name,
            last_name,
            password,
            enabled,
            reset_password_on_login,
            email_verified,
            external_provider_id,
            roles
        } = request.body;
        let columns: Array<string> = ['username', 'email', 'password'];
        let values: Array<string | boolean> = [username, email, await hashPassword(password)];

        if(first_name != null) {
            columns = [...columns, 'first_name'];
            values = [...values, first_name];
        }

        if(last_name != null) {
            columns = [...columns, 'last_name'];
            values = [...values, last_name];
        }

        if(enabled != null) {
            columns = [...columns, 'enabled'];
            values = [...values, enabled];
        }

        if(reset_password_on_login != null) {
            columns = [...columns, 'reset_password_on_login'];
            values = [...values, reset_password_on_login];
        }

        if(email_verified != null) {
            columns = [...columns, 'email_verified'];
            values = [...values, email_verified];
        }

        if(external_provider_id != null) {
            columns = [...columns, 'external_provider_id'];
            values = [...values, external_provider_id];
        }

        const sql_value_indexes: Array<string> = columns.map((item: string, index: number): string => `$${index + 1}`);

        try {

            let user_roles: QueryResult | undefined;
            let role_permissions: QueryResult | undefined;

            await fastify.db.query('BEGIN;');
            await fastify.db.query(`
                INSERT INTO open_board_user (${columns.join(', ')}) VALUES (${sql_value_indexes.join(', ')});
            `, values);

            const user_query: QueryResult = await fastify.db.query(`
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
                WHERE usr.username = $1;
            `, [username]);
            const usr_id: string = user_query.rows[0].usr_id;

            if(roles != null && roles.length > 0) {
                const user_roles_insert_values: Array<Array<string>> = roles.map((item: string): Array<string> => ([usr_id, item]));
                let values_incrementor: number = 0;

                await fastify.db.query(`
                    INSERT INTO open_board_user_roles (user_id, role_id)
                    VALUES
                        ${user_roles_insert_values.map((item: Array<string>, index: number): string => {
                            const index1: number = index + values_incrementor + 1;
                            const index2: number = index + values_incrementor + 2;
                            let value_template_str: string = `($${index1}, $${index2})`;

                            if(index === user_roles_insert_values.length - 1) {
                                value_template_str += ';';
                            } else {
                                value_template_str += ', ';
                            }

                            ++values_incrementor

                            return value_template_str;
                        })}
                `, user_roles_insert_values);

                user_roles = await fastify.db.query(`
                    SELECT
                        user_role.user_id,
                        role.*
                    FROM open_board_user_roles user_role
                    JOIN open_board_role role ON role.id = user_role.role_id
                    WHERE user_role.user_id = $1;
                `, [usr_id]);
                role_permissions = await fastify.db.query(`
                    SELECT
                        role_permission.role_id,
                        permission.*
                    FROM open_board_role_permissions role_permission
                    JOIN open_board_role_permission permission ON permission.id = role_permission.permission_id
                    WHERE role_permission.role_id = ANY($1);
                `, [user_roles.rows.map((item: QueryResultRow): string => item.id)]);
            }

            await fastify.db.query('COMMIT;');

            const user: User = parseUser(user_query.rows[0], user_roles?.rows ?? [], role_permissions?.rows ?? []);

            return {
                code: 200,
                message: `User: <user> was successfully created!`,
                data: user
            };

        } catch(err: any) {
            request.log.error(err.message);
            throw err;
        }
    });

    fastify.patch('/users/:id', {
        schema: {
            body: zodToJsonSchema(AdminUserUpdate, {errorMessages: true})
        }
    }, async (request: FastifyRequest<{Body: AdminUserUpdateSchema}>, response: FastifyReply): Promise<string> => {
        return ``;
    });

    fastify.delete('/users/:id', async (request: FastifyRequest<{Body: AdminUserUpdateSchema}>, response: FastifyReply): Promise<string> => {
        return ``;
    });

    done();
};