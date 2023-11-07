import { createError } from '../../lib/error';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { ExternalProvderCreate, ExternalProvderUpdate, ExternalProvderParams } from '../../schema/external_provider';
import { createQuery, createManyToManyQuery } from '../../lib/db/queries/create';
import { updateQuery, updateManyToMany } from '../../lib/db/queries/update';
import { selectExternalProvider, selectExternalProviderRoles } from '../../lib/db/queries/external_provider';
import { selectRolePermissionsQuery } from '../../lib/db/queries/user';
import { parseExtneralProviders, parseExtneralProvider } from '../../lib/db/parsers/external_provider';
import type { FastifyInstance, FastifyPluginOptions, FastifyRequest } from 'fastify';
import type { DoneCallback } from '../../types/done';
import type { ExternalProvider } from '../../types/external_provider';
import type { OKResponse } from '../../types/response';
import type { ExternalProvderCreateSchema, ExternalProvderUpdateSchema, ExternalProvderParamsSchema } from '../../schema/external_provider';
import type { QueryResult, QueryResultRow } from 'pg';

export default (fastify: FastifyInstance, _: FastifyPluginOptions, done: DoneCallback): void => {
    fastify.get('/external_providers', async (request: FastifyRequest, _): Promise<OKResponse<Array<ExternalProvider>>> => {
        try {
            const externalProvidersQuery: QueryResult = await fastify.db.query('SELECT * FROM open_board_external_auth_provider;');
            const externalProviderRolesQuery: QueryResult = await fastify.db.query(`
                SELECT
                    external_provider_roles.provider_id,
                    role.*
                FROM open_board_external_provider_roles external_provider_roles
                JOIN open_board_role role ON external_provider_roles.role_id = role.id;
            `);
            const rolePermissionsQuery: QueryResult = await fastify.db.query(selectRolePermissionsQuery, [externalProviderRolesQuery.rows.map((item: QueryResultRow): string => item.id)]);
            const externalProviders: Array<ExternalProvider> = parseExtneralProviders(externalProvidersQuery.rows, externalProviderRolesQuery.rows, rolePermissionsQuery.rows);

            return {
                code: 200,
                count: externalProviders.length,
                data: externalProviders
            };

        } catch(err: any) {
            request.log.error(err);
            throw err;
        }
    });

    fastify.get('/external_providers/:id', {
        schema: {
            params: zodToJsonSchema(ExternalProvderParams, { errorMessages: true })
        }
    }, async (request: FastifyRequest<{ Params: ExternalProvderParamsSchema }>, _): Promise<OKResponse<ExternalProvider>> => {
        const { id } = request.params;

        try {
            const externalProviderQuery: QueryResult = await fastify.db.query(selectExternalProvider, [id]);

            if(externalProviderQuery.rowCount === 0) throw createError(404, 'No External Authentications Providers with the provided ID exist..');

            const externalProviderRolesQuery: QueryResult = await fastify.db.query(selectExternalProviderRoles, [id]);
            const rolePermissionsQuery: QueryResult = await fastify.db.query(selectRolePermissionsQuery, [externalProviderRolesQuery.rows.map((item: QueryResultRow): string => item.id)]);
            const externalProvider: ExternalProvider = parseExtneralProvider(externalProviderQuery.rows[0], externalProviderRolesQuery.rows, rolePermissionsQuery.rows);

            return {
                code: 200,
                data: externalProvider
            };

        } catch(err: any) {
            request.log.error(err);
            throw err;
        }
    });

    fastify.post('/external_providers', {
        schema: {
            body: zodToJsonSchema(ExternalProvderCreate, { errorMessages: true })
        }
    }, async (request: FastifyRequest<{ Body: ExternalProvderCreateSchema }>, _): Promise<OKResponse<ExternalProvider>> => {
        const {
            name,
            client_id,
            client_secret,
            use_pkce,
            enabled,
            default_login_method,
            self_registration_enabled,
            auth_url,
            token_url,
            userinfo_url,
            logout_url,
            required_email_domain,
            roles
        } = request.body;
        let columns: Array<string> = ['name', 'client_id', 'auth_url', 'token_url', 'userinfo_url'];
        let values: Array<string | boolean> = [name, client_id, auth_url, token_url, userinfo_url];

        if(client_secret != null) {
            columns = [...columns, 'client_secret'];
            values = [...values, client_secret];
        }

        if(use_pkce != null) {
            columns = [...columns, 'use_pkce'];
            values = [...values, use_pkce];
        }

        if(enabled != null) {
            columns = [...columns, 'enabled'];
            values = [...values, enabled];
        }

        if(default_login_method != null) {
            columns = [...columns, 'default_login_method'];
            values = [...values, default_login_method];
        }

        if(self_registration_enabled != null) {
            columns = [...columns, 'self_registration_enabled'];
            values = [...values, self_registration_enabled];
        }

        if(logout_url != null) {
            columns = [...columns, 'logout_url'];
            values = [...values, logout_url];
        }

        if(required_email_domain != null) {
            columns = [...columns, 'required_email_domain'];
            values = [...values, required_email_domain];
        }

        try {
            await fastify.db.query('BEGIN;');
            await fastify.db.query(createQuery('open_board_external_auth_provider', columns), values);

            const externalProviderQuery: QueryResult = await fastify.db.query('SELECT * FROM open_board_external_auth_provider WHERE name = $1;', [name]);
            const externalProviderID: string = externalProviderQuery.rows[0].id;

            if(roles != null && roles.length > 0) {
                const manyToManyValues: Array<string> = roles.reduce((accumValue: Array<string>, currentValue: string): Array<string> => ([
                    ...accumValue,
                    externalProviderID,
                    currentValue
                ]), []);

                await fastify.db.query(createManyToManyQuery('open_board_external_provider_roles', 'provider_id', 'role_id', manyToManyValues.length), manyToManyValues);
            }

            const externalProviderRolesQuery: QueryResult = await fastify.db.query(selectExternalProviderRoles, [externalProviderID]);
            const rolePermissionsQuery: QueryResult = await fastify.db.query(selectRolePermissionsQuery, [externalProviderRolesQuery.rows.map((item: QueryResultRow): string => item.id)]);

            await fastify.db.query('COMMIT;');

            const externalProvider: ExternalProvider = parseExtneralProvider(externalProviderQuery.rows[0], externalProviderRolesQuery.rows, rolePermissionsQuery.rows);

            return {
                code: 201,
                message: `External Provider: ${name} was created successfully...`,
                data: externalProvider
            };

        } catch(err: any) {
            await fastify.db.query('ROLLBACK;');
            request.log.error(err);
            throw err;
        }
    });

    fastify.patch('/external_providers/:id', {
        schema: {
            params: zodToJsonSchema(ExternalProvderParams, { errorMessages: true }),
            body: zodToJsonSchema(ExternalProvderUpdate, { errorMessages: true })
        }
    }, async (request: FastifyRequest<{ Params: ExternalProvderParamsSchema, Body: ExternalProvderUpdateSchema }>, _): Promise<OKResponse<ExternalProvider>> => {
        const {
            name,
            client_id,
            client_secret,
            use_pkce,
            enabled,
            default_login_method,
            self_registration_enabled,
            auth_url,
            token_url,
            userinfo_url,
            logout_url,
            required_email_domain,
            roles
        } = request.body;
        const { id } = request.params;
        let columns: Array<string> = ['date_updated'];
        let values: Array<string | boolean | Date | null> = [id, new Date()];

        if(name != null) {
            columns = [...columns, 'name'];
            values = [...values, name];
        }

        if(client_id != null) {
            columns = [...columns, 'client_id'];
            values = [...values, client_id];
        }

        if(client_secret != null) {
            columns = [...columns, 'client_secret'];
            values = [...values, client_secret.length > 0 ? client_secret : null];
        }

        if(use_pkce != null) {
            columns = [...columns, 'use_pkce'];
            values = [...values, use_pkce];
        }

        if(enabled != null) {
            columns = [...columns, 'enabled'];
            values = [...values, enabled];
        }

        if(default_login_method != null) {
            columns = [...columns, 'default_login_method'];
            values = [...values, default_login_method];
        }

        if(self_registration_enabled != null) {
            columns = [...columns, 'self_registration_enabled'];
            values = [...values, self_registration_enabled];
        }

        if(auth_url != null) {
            columns = [...columns, 'auth_url'];
            values = [...values, auth_url];
        }

        if(token_url != null) {
            columns = [...columns, 'token_url'];
            values = [...values, token_url];
        }

        if(userinfo_url != null) {
            columns = [...columns, 'userinfo_url'];
            values = [...values, userinfo_url];
        }

        if(logout_url != null) {
            columns = [...columns, 'logout_url'];
            values = [...values, logout_url.length > 0 ? logout_url : null];
        }

        if(required_email_domain != null) {
            columns = [...columns, 'required_email_domain'];
            values = [...values, required_email_domain.length > 0 ? required_email_domain : null];
        }

        if(values.length === 2 && roles == null) throw createError(400, 'Values to update must be provided...');

        try {
            await fastify.db.query('BEGIN;');

            if(values.length > 2) {
                const updateResult: QueryResult = await fastify.db.query(updateQuery('open_board_external_auth_provider', 'id', columns), values);

                if(updateResult.rowCount === 0) throw createError(404, 'No External Authentications Providers with the provided ID exist..');
            }

            if(roles != null) {
                const selectExternalProviderRolesQuery: QueryResult = await fastify.db.query(`
                    SELECT role_id
                    FROM open_board_external_provider_roles
                    WHERE provider_id = $1;
                `, [id]);
                const currentProviderRoles: Array<string> = selectExternalProviderRolesQuery.rows.map((item: QueryResultRow): string => item.role_id);
                const addExternalProviderRoles: Array<string> = roles.filter((item: string): boolean => !currentProviderRoles.includes(item));
                const removeExternalProviderRoles: Array<string> = currentProviderRoles.filter((item: string): boolean => !roles.includes(item));
                const [addProviderRolesQuery, removeProviderRolesQuery] = updateManyToMany('open_board_external_provider_roles', 'provider_id', 'role_id', addExternalProviderRoles.length, removeExternalProviderRoles.length);

                if(addExternalProviderRoles.length > 0) {
                    const addProviderRolesQueryValues: Array<string> = addExternalProviderRoles.reduce((accumValue: Array<string>, currentValue: string): Array<string> => ([
                        ...accumValue,
                        id,
                        currentValue
                    ]), []);

                    await fastify.db.query(addProviderRolesQuery, addProviderRolesQueryValues);
                }

                if(removeExternalProviderRoles.length > 0) await fastify.db.query(removeProviderRolesQuery, [id, ...removeExternalProviderRoles]);
            }

            const externalProviderQuery: QueryResult = await fastify.db.query(selectExternalProvider, [id]);
            const externalProviderRolesQuery: QueryResult = await fastify.db.query(selectExternalProviderRoles, [id]);
            const rolePermissionsQuery: QueryResult = await fastify.db.query(selectRolePermissionsQuery, [externalProviderRolesQuery.rows.map((item: QueryResultRow): string => item.id)]);

            await fastify.db.query('COMMIT;');

            const externalProvider: ExternalProvider = parseExtneralProvider(externalProviderQuery.rows[0], externalProviderRolesQuery.rows, rolePermissionsQuery.rows);

            return {
                code: 200,
                message: `External Provider: ${externalProvider.name} was updated successfully!`,
                data: externalProvider
            };

        } catch(err: any) {
            await fastify.db.query('ROLLBACK;');
            request.log.error(err);
            throw err;
        }
    });

    fastify.delete('/external_providers/:id', {
        schema: {
            params: zodToJsonSchema(ExternalProvderParams, { errorMessages: true })
        }
    }, async (request: FastifyRequest<{ Params: ExternalProvderParamsSchema }>, _): Promise<OKResponse<null>> => {
        const { id } = request.params;

        try {
            const providerNameQuery: QueryResult = await fastify.db.query('SELECT name FROM open_board_external_auth_provider WHERE id = $1;', [id]);

            if(providerNameQuery.rowCount === 0) throw createError(404, 'No External Authentications Providers with the provided ID exist..');

            const providerName: string = providerNameQuery.rows[0].name;

            await fastify.db.query('DELETE FROM open_board_external_auth_provider WHERE id = $1;');

            return {
                code: 200,
                message: `External Provider: ${providerName} was deleted successfully!`,
                data: null
            };

        } catch(err: any) {
            request.log.error(err);
            throw err;
        }
    });

    done();
};