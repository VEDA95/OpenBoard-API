import { createError } from '../../lib/error';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { createManyToManyQuery, createQuery } from '../../lib/db/queries/create';
import { updateManyToMany, updateQuery } from '../../lib/db/queries/update';
import { RoleCreate, RoleUpdate, RoleParams } from '../../schema/role';
import { parseRole, parseRoles } from '../../lib/db/parsers/role';
import { selectRolePermissionsQuery, selectRolesPermissionsQuery } from '../../lib/db/queries/user';
import type { FastifyInstance, FastifyPluginOptions, FastifyRequest } from 'fastify';
import type { DoneCallback } from '../../types/done';
import type { Role } from '../../types/user';
import type { OKResponse } from '../../types/response';
import type { RoleCreateSchema, RoleUpdateSchema, RoleParamsSchema } from '../../schema/role';
import type { QueryResult, QueryResultRow } from 'pg';

export default (fastify: FastifyInstance, _: FastifyPluginOptions, done: DoneCallback): void => {
    fastify.get('/roles', async (request: FastifyRequest, _): Promise<OKResponse<Array<Role>>> => {
        try {
            await fastify.db.query('BEGIN;');

            const rolesQuery: QueryResult = await fastify.db.query('SELECT * FROM open_board_role;');
            const permissionsQuery: QueryResult = await fastify.db.query(selectRolesPermissionsQuery);

            await fastify.db.query('COMMIT;');

            const roles: Array<Role> = parseRoles(rolesQuery.rows, permissionsQuery.rows);

            return {
                code: 200,
                count: roles.length,
                data: roles
            };

        } catch(err: any) {
            await fastify.db.query('ROLLBACK;');
            request.log.error(err);
            throw err;
        }

    });

    fastify.get('/roles/:id', {
        schema: {
            params: zodToJsonSchema(RoleParams, { errorMessages: true })
        }
    }, async (request: FastifyRequest<{Params: RoleParamsSchema}>, _): Promise<OKResponse<Role>> => {
        const { id } = request.params;

        try {
            await fastify.db.query('BEGIN;');

            const roleQuery: QueryResult = await fastify.db.query('SELECT * FROM open_board_role WHERE id = $1;', [id]);

            if(roleQuery.rowCount === 0) throw createError(404, 'The role with the id provided does not exist...');

            const roleResult: QueryResultRow = roleQuery.rows[0];
            const permissionQuery: QueryResultRow = await fastify.db.query(selectRolePermissionsQuery, [roleResult.id]);

            await fastify.db.query('COMMIT;');

            const role: Role = parseRole(roleResult, permissionQuery.rows);

            return {
                code: 200,
                data: role
            };

        } catch(err: any) {
            await fastify.db.query('ROLLBACK;');
            request.log.error(err);
            throw err;
        }
    });

    fastify.post('/roles', {
        schema: {
            body: zodToJsonSchema(RoleCreate, { errorMessages: true })
        }
    }, async (request: FastifyRequest<{Body: RoleCreateSchema}>, _): Promise<OKResponse<Role>> => {
        const { name, permissions } = request.body;

        try {
            await fastify.db.query('BEGIN;');
            await fastify.db.query(createQuery('open_board_role', ['name']), [name]);

            const roleData: QueryResult = await fastify.db.query('SELECT * FROM open_board_role WHERE name = $1;', [name]);
            const roleId: string = roleData.rows[0].id;
            let rolePermissions: QueryResult | undefined;

            if(permissions != null && permissions.length > 0) {
                const manyToManyValues: Array<string> = permissions.reduce((accumValue: Array<string>, currentValue: string): Array<string> => ([
                    ...accumValue,
                    roleId,
                    currentValue
                ]), []);

                await fastify.db.query(createManyToManyQuery('open_board_roles_permissions', 'role_id', 'permission_id', manyToManyValues.length), manyToManyValues);

                rolePermissions = await fastify.db.query(selectRolePermissionsQuery, [roleId]);
            }

            await fastify.db.query('COMMIT;');

            const role: Role = parseRole(roleData.rows[0], rolePermissions?.rows ?? []);

            return {
                code: 201,
                message: `Role: ${role.name} was created successfully!`,
                data: role
            };

        } catch(err: any) {
            await fastify.db.query('ROLLBACK;');

            if(err.severity != null && err.severity === 'ERROR') {
                if(err.code === '23505') {
                    if(err.detail.startsWith('Key (name)')) throw createError(400, 'A Role with the name provided already exists...');
                }
            }

            request.log.error(err);
            throw err;
        }
    });

    fastify.patch('/roles/:id', {
        schema: {
            params: zodToJsonSchema(RoleParams, { errorMessages: true }),
            body: zodToJsonSchema(RoleUpdate, {errorMessages: true})
        }
    }, async (request: FastifyRequest<{Params: RoleParamsSchema, Body: RoleUpdateSchema}>, _): Promise<OKResponse<Role>> => {
        const { id } = request.params;
        const { name, permissions } = request.body;

        let columns: Array<string> = [];
        let values: Array<string | boolean> = [id];

        if(name != null) {
            columns = [...columns, 'name'];
            values = [...values, name];
        }

        if(values.length === 1 && permissions == null) throw createError(400, 'Values to update must be provided...');

        try {
            await fastify.db.query('BEGIN;');

            if(values.length > 2) {
                const updateResult: QueryResult = await fastify.db.query(updateQuery('open_board_role', 'id', columns), values);

                if(updateResult.rowCount === 0) throw createError(404, 'The role with the id provided does not exist...');
            }

            if(permissions != null) {
                const permissionIdQuery: QueryResult = await fastify.db.query(`
                    SELECT permissions.id AS id
                    FROM open_board_role_permissions role_permissions
                    JOIN open_board_role_permission permissions ON permissions.id = role_permissions.permission_id
                    WHERE role_permissions.role_id = $1;
                `, [id]);
                const permissionIds: Array<string> = permissionIdQuery.rows.map((item: QueryResultRow): string => item.id);
                const permissionsToAdd: Array<string> = permissions.filter((item: string): boolean => !permissionIds.includes(item));
                const permissionsToRemove: Array<string> = permissionIds.filter((item: string): boolean => !permissions.includes(item));
                const [addPermissionsQuery, removePermissionsQuery] = updateManyToMany('open_board_role_permissions', 'role_id', 'permission_id', permissionsToAdd.length, permissionsToRemove.length);

                if(permissionsToAdd.length > 0) {
                    const addPermissionsQueryValues: Array<string> = permissionsToAdd.reduce((accumValue: Array<string>, currentValue: string): Array<string> => ([
                        ...accumValue,
                        id,
                        currentValue
                    ]), []);

                    await fastify.db.query(addPermissionsQuery, addPermissionsQueryValues);
                }

                if(permissionsToRemove.length > 0) await fastify.db.query(removePermissionsQuery, [id, ...permissionsToRemove]);
            }

            const roleData: QueryResult = await fastify.db.query('SELECT * FROM open_board_role WHERE id = $1;', [id]);
            const permissionData: QueryResult = await fastify.db.query(selectRolePermissionsQuery, [id]);
            await fastify.db.query('COMMIT;');

            const role: Role = parseRole(roleData.rows[0], permissionData.rows);

            return {
                code: 200,
                message: `Role: ${role.name} was updated successfully!`,
                data: role
            };

        } catch(err: any) {
            await fastify.db.query('ROLLBACK;');

            if(err.severity != null && err.severity === 'ERROR') {
                if(err.code === '23505') {
                    if(err.detail.startsWith('Key (name)')) throw createError(400, 'A Role with the name provided already exists...');
                }

                if(err.code === '23503') {
                    if(err.detail.startsWith('Key (permission_id)')) throw createError(400, 'Permission values must be valid Ids...');
                    if(err.detail.startsWith('Key (role_id)')) throw createError(404, 'No role with the provided id exists...');
                }
            }

            request.log.error(err);
            throw err;
        }
    });

    fastify.delete('/roles/:id', {
        schema: {
            params: zodToJsonSchema(RoleParams, { errorMessages: true })
        }
    }, async (request: FastifyRequest<{Params: RoleParamsSchema}>, _): Promise<OKResponse<null>> => {
        const { id } = request.params;

        try {
            await fastify.db.query('BEGIN;');

            const roleData: QueryResult = await fastify.db.query('SELECT name FROM open_board_role WHERE id = $1;', [id]);

            if(roleData.rowCount === 0) throw createError(404, 'The role with the id provided does not exist...');

            await fastify.db.query('DELETE FROM open_board_role WHERE id = $1;', [id]);
            await fastify.db.query('COMMIT;');

            const { name } = roleData.rows[0];

            return {
                code: 200,
                message: `Role: ${name} was deleted successfully!`,
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