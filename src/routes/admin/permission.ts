import { createError } from '../../lib/error';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { createQuery } from '../../lib/db/queries/create';
import { updateQuery } from '../../lib/db/queries/update';
import { PermissionCreate, PermissionUpdate, PermissionParams } from '../../schema/permission';
import type { FastifyInstance, FastifyPluginOptions, FastifyRequest } from 'fastify';
import type { DoneCallback } from '../../types/done';
import type { Permission } from '../../types/user';
import type { OKResponse } from '../../types/response';
import type { PermissionCreateSchema, PermissionUpdateSchema, PermissionParamsSchema } from '../../schema/permission';
import type { QueryResult } from 'pg';

export default (fastify: FastifyInstance, _: FastifyPluginOptions, done: DoneCallback): void => {
    fastify.get('/permissions', async (request: FastifyRequest, _): Promise<OKResponse<Array<Permission>>> => {
        try {
            const permissionQuery: QueryResult = await fastify.db.query('SELECT * FROM open_board_role_permission;');

            return {
                code: 200,
                count: permissionQuery.rowCount,
                data: permissionQuery.rows as Array<Permission>
            };

        } catch(err: any) {
            request.log.error(err);
            throw err;
        }

    });

    fastify.get('/permissions/:id', {
        schema: {
            params: zodToJsonSchema(PermissionParams, { errorMessages: true })
        }
    }, async (request: FastifyRequest<{Params: PermissionParamsSchema}>, _): Promise<OKResponse<Permission>> => {
        const { id } = request.params;

        try {
            const permissionQuery: QueryResult = await fastify.db.query('SELECT * FROM open_board_role_permission WHERE id = $1;', [id]);

            if(permissionQuery.rowCount === 0) throw createError(404, 'No permission with the provided id exists...');

            return {
                code: 200,
                data: permissionQuery.rows[0] as Permission
            };

        } catch(err: any) {
            request.log.error(err);
            throw err;
        }
    });

    fastify.post('/permissions', {
        schema: {
            body: zodToJsonSchema(PermissionCreate, { errorMessages: true })
        }
    }, async (request: FastifyRequest<{Body: PermissionCreateSchema}>, _): Promise<OKResponse<Permission>> => {
        const { path } = request.body;

        try {
            await fastify.db.query('BEGIN;');
            await fastify.db.query(createQuery('open_board_role_permission', ['path']), [path]);

            const permissionQuery: QueryResult = await fastify.db.query('SELECT * FROM open_board_role_permission WHERE path = $1;', [path]);

            return {
                code: 201,
                message: `Permission: ${path} was created successfully!`,
                data: permissionQuery.rows[0] as Permission
            };

        } catch(err: any) {
            await fastify.db.query('ROLLBACK;');
            request.log.error(err);
            throw err;
        }
    });

    fastify.patch('/permissions/:id', {
        schema: {
            params: zodToJsonSchema(PermissionParams, { errorMessages: true }),
            body: zodToJsonSchema(PermissionUpdate, {errorMessages: true})
        }
    }, async (request: FastifyRequest<{Params: PermissionParamsSchema, Body: PermissionUpdateSchema}>, _): Promise<OKResponse<Permission>> => {
        const { id } = request.params;
        const { path } = request.body;

        let columns: Array<string> = [];
        let values: Array<string | boolean> = [id];

        if(path != null) {
            columns = [...columns, 'path'];
            values = [...values, path];
        }

        if(values.length === 1) throw createError(400, 'Values to update must be provided...');

        try {
            await fastify.db.query('BEGIN;');

            const updateResult: QueryResult = await fastify.db.query(updateQuery('open_board_role_permission', 'id', columns), values);

            if(updateResult.rowCount === 0) throw createError(404, 'No permission with the provided id exists...');

            const permissionQuery: QueryResult = await fastify.db.query('SELECT * FROM open_board_role_permission WHERE id = $1;', [id]);
            const permission = permissionQuery.rows[0] as Permission;

            await fastify.db.query('COMMIT;');

            return {
                code: 200,
                message: `Permission: ${permission.path} has been updated successfully!`,
                data: permission
            };

        } catch(err: any) {
            await fastify.db.query('ROLLBACK;');
            request.log.error(err);
            throw err;
        }
    });

    fastify.delete('/permissions/:id', {
        schema: {
            params: zodToJsonSchema(PermissionParams, { errorMessages: true })
        }
    }, async (request: FastifyRequest<{Params: PermissionParamsSchema}>, _): Promise<OKResponse<null>> => {
        const { id } = request.params;

        try {
            await fastify.db.query('BEGIN;');

            const permissionQuery: QueryResult = await fastify.db.query('SELECT path FROM open_board_role_permission WHERE id = $1;', [id]);

            if(permissionQuery.rowCount === 0) throw createError(404, 'No permission with the provided id exists...');

            await fastify.db.query('DELETE FROM open_board_role_permission WHERE id = $1;', [id]);
            await fastify.db.query('COMMIT;');

            const { path } = permissionQuery.rows[0];

            return {
                code: 200,
                message: `Permission: ${path} has been deleted successfully...`,
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