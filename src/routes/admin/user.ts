import { createError } from '../../lib/error';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { AdminUserCreate, AdminUserUpdate, UserParams } from '../../schema/user';
import { parseUsers, parseUser } from '../../lib/db/parsers/user';
import { hashPassword } from '../../lib/auth/password';
import { createQuery, createManyToManyQuery } from '../../lib/db/queries/create';
import { selectUsersQuery, selectUsersRolesQuery, selectRolesPermissionsQuery, selectUserQuery, selectUserRolesQuery, selectRolePermissionsQuery } from '../../lib/db/queries/user';
import type { FastifyInstance, FastifyPluginOptions, FastifyRequest } from 'fastify';
import type { DoneCallback } from '../../types/done';
import type { User } from '../../types/user';
import type { OKResponse } from '../../types/response';
import type { AdminUserCreateSchema, AdminUserUpdateSchema, UserParamsSchema} from '../../schema/user';
import type { QueryResult, QueryResultRow } from 'pg';

export default (fastify: FastifyInstance, _: FastifyPluginOptions, done: DoneCallback): void => {
    fastify.get('/users', async (request: FastifyRequest, _): Promise<OKResponse<Array<User>>> => {
        try {
            await fastify.db.query('BEGIN;');

            const users_query: QueryResult = await fastify.db.query(selectUsersQuery);
            const user_roles_query: QueryResult = await fastify.db.query(selectUsersRolesQuery);
            const role_permissions_query: QueryResult = await fastify.db.query(selectRolesPermissionsQuery);

            await fastify.db.query('COMMIT;');

            const users: Array<User> = parseUsers(users_query.rows, user_roles_query.rows, role_permissions_query.rows);

            return {
                code: 200,
                count: users.length,
                data: users
            };

        } catch(err: any) {
            await fastify.db.query('ROLLBACK;');
            request.log.error(err);
            throw err;
        }

    });

    fastify.get('/users/:id', {
        schema: {
            params: zodToJsonSchema(UserParams, {errorMessages: true})
        }
    }, async (request: FastifyRequest<{Params: UserParamsSchema}>, _): Promise<OKResponse<User>> => {
        const { id } = request.params;

        try {
            await fastify.db.query('BEGIN;');

            const user_query: QueryResult = await fastify.db.query(selectUserQuery, [id]);
            const user_roles_query: QueryResult = await fastify.db.query(selectUserRolesQuery, [id]);
            const role_permissions_query: QueryResult = await fastify.db.query(selectRolePermissionsQuery, [user_roles_query.rows.map((item: QueryResultRow): string => item.id)]);

            await fastify.db.query('COMMIT;');

            const user: User = parseUser(user_query.rows[0], user_roles_query.rows, role_permissions_query.rows);

            return {
                code: 200,
                data: user
            };

        } catch(err: any) {
            await fastify.db.query('ROLLBACK;');
            request.log.error(err);
            throw err;
        }
    });

    fastify.post('/users', {
        schema: {
            body: zodToJsonSchema(AdminUserCreate, {errorMessages: true})
        }
    }, async (request: FastifyRequest<{Body: AdminUserCreateSchema}>, _): Promise<OKResponse<User>> => {
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
        let columns: Array<string> = ['username', 'email', 'hashed_password'];
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

        try {

            let user_roles: QueryResult | undefined;
            let role_permissions: QueryResult | undefined;

            await fastify.db.query('BEGIN;');
            await fastify.db.query(createQuery('open_board_user', columns), values);

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
                const user_roles_insert_values: Array<string> = roles.reduce((accumValue: Array<string>, currentValue: string): Array<string> => ([
                    ...accumValue,
                    usr_id,
                    currentValue
                ]), []);

                await fastify.db.query(createManyToManyQuery('open_board_user_roles', 'user_id', 'role_id', user_roles_insert_values.length), user_roles_insert_values);

                user_roles = await fastify.db.query(selectUserRolesQuery, [usr_id]);
                role_permissions = await fastify.db.query(selectRolePermissionsQuery, [user_roles.rows.map((item: QueryResultRow): string => item.id)]);
            }

            await fastify.db.query('COMMIT;');

            const user: User = parseUser(user_query.rows[0], user_roles?.rows ?? [], role_permissions?.rows ?? []);

            return {
                code: 201,
                message: `User: ${user.username} was successfully created!`,
                data: user
            };

        } catch(err: any) {
            await fastify.db.query('ROLLBACK;');

            if(err.severity != null && err.severity === 'ERROR') {
                if(err.code === '23505') {
                    if(err.detail.startsWith('Key (email)')) throw createError(400, 'A user with the email provided already exists....');
                    if(err.detail.startsWith('Key (username)')) throw createError(400, 'A user with the username provided already exists....');
                }

                if(err.code === '23503') {
                    if(err.detail.startsWith('Key (role_id)')) throw createError(400, 'Role values must be valid Ids...');
                }
            }

            request.log.error(err);
            throw err;
        }
    });

    fastify.patch('/users/:id', {
        schema: {
            params: zodToJsonSchema(UserParams, {errorMessages: true}),
            body: zodToJsonSchema(AdminUserUpdate, {errorMessages: true})
        }
    }, async (request: FastifyRequest<{Body: AdminUserUpdateSchema}>, _): Promise<OKResponse<null>> => {
        return {
            code: 200,
            data: null
        };
    });

    fastify.delete('/users/:id', async (request: FastifyRequest<{Body: AdminUserUpdateSchema}>, _): Promise<OKResponse<null>> => {
        return {
            code: 200,
            data: null
        };
    });

    done();
};