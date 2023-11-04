import { createError } from '../../lib/error';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { PublicUserCreate, PublicUserUpdate, UserParams } from '../../schema/user';
import { parseUsers, parseUser } from '../../lib/db/parsers/user';
import { hashPassword } from '../../lib/auth/password';
import { createQuery } from '../../lib/db/queries/create';
import { updateQuery } from '../../lib/db/queries/update';
import { selectUsersQuery, selectUsersRolesQuery, selectRolesPermissionsQuery, selectUserQuery, selectUserRolesQuery, selectRolePermissionsQuery } from '../../lib/db/queries/user';
import type { FastifyInstance, FastifyPluginOptions, FastifyRequest } from 'fastify';
import type { DoneCallback } from '../../types/done';
import type { User } from '../../types/user';
import type { OKResponse } from '../../types/response';
import type { PublicUserCreateSchema, PublicUserUpdateSchema, UserParamsSchema} from '../../schema/user';
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

            if(user_query.rowCount === 0) throw createError(404, 'No user with the provided id exists...');

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
            body: zodToJsonSchema(PublicUserCreate, {errorMessages: true})
        }
    }, async (request: FastifyRequest<{Body: PublicUserCreateSchema}>, _): Promise<OKResponse<User>> => {
        const {
            username,
            email,
            first_name,
            last_name,
            password,
            confirm_password
        } = request.body;

        if(confirm_password !== password) throw createError(400, 'Both passwords provided must be the same...');

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

    fastify.patch('/users/me', {
        schema: {
            body: zodToJsonSchema(PublicUserUpdate, {errorMessages: true})
        }
    }, async (request: FastifyRequest<{Body: PublicUserUpdateSchema}>, _): Promise<OKResponse<User>> => {
        const {
            username,
            email,
            first_name,
            last_name
        } = request.body;
        let columns: Array<string> = ['date_updated'];
        let values: Array<string | boolean | Date> = ['', new Date()];

        if(username != null && username.length > 0) {
            columns = [...columns, 'username'];
            values = [...values, username];
        }

        if(email != null && email.length > 0) {
            columns = [...columns, 'email'];
            values = [...values, email];
        }

        if(first_name != null && first_name.length > 0) {
            columns = [...columns, 'first_name'];
            values = [...values, first_name];
        }

        if(last_name != null && last_name.length > 0) {
            columns = [...columns, 'last_name'];
            values = [...values, last_name];
        }

        if(values.length === 2) {
            throw createError(400, 'Values to update must be provided...');
        }

        try {
            await fastify.db.query('BEGIN;');

            if(values.length > 2) {
               const updateResult: QueryResult = await fastify.db.query(updateQuery('open_board_user', 'id', columns), values);

               if(updateResult.rowCount === 0) throw createError(404, 'No user with the provided id exists...');
            }

            const userQuery: QueryResult = await fastify.db.query(selectUserQuery, []);
            const userRoles: QueryResult = await fastify.db.query(selectUserRolesQuery, []);
            const rolePermissions: QueryResult = await fastify.db.query(selectRolePermissionsQuery, [userRoles.rows.map((item: QueryResultRow): string => item.id)]);
            const user: User = parseUser(userQuery.rows[0], userRoles.rows, rolePermissions.rows);

            await fastify.db.query('COMMIT;');

            return {
                code: 200,
                message: `User: ${user.username} has been updated successfully...`,
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

    fastify.delete('/users/me', async (request: FastifyRequest, _): Promise<OKResponse<null>> => {
        try {
            await fastify.db.query('BEGIN;');

            const usernameQuery: QueryResult = await fastify.db.query('SELECT username FROM open_board_user WHERE id = $1;', []);

            if(usernameQuery.rowCount === 0) throw createError(404, 'No user with the provided id exists...')

            await fastify.db.query('DELETE FROM open_board_user WHERE id = $1;', []);
            await fastify.db.query('COMMIT;');

            const { username } = usernameQuery.rows[0];

            return {
                code: 200,
                message: `User: ${username} was successfully deleted!`,
                data: null
            };

        } catch(err: any) {
            await fastify.db.query('ROLLBACK;');
            request.log.error(err);
            throw err;
        }
    });

    done();
};