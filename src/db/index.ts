import { Pool } from 'pg';
import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyPluginOptions, FastifyPluginAsync } from 'fastify';
import type { PoolClient } from 'pg';

export interface DBOptions extends FastifyPluginOptions {
    db_uri: string;
    connection_max?: number;
}

const pluginCallback: FastifyPluginAsync<DBOptions> = async (fastify: FastifyInstance, options: DBOptions): Promise<void> => {
    const pool: Pool = new Pool({connectionString: options.db_uri, max: options.connection_max ?? 10});

    pool.on('error', (err: Error): void => {
        console.error('Unexpected error on idle client', err);
        process.exit(-1);
    });

    try {
        const client: PoolClient = await pool.connect();

        fastify.decorate('pool', pool);
        fastify.decorate('db', client);

    } catch(err: any) {
        if(err != null) {
            console.error('Unexpected error when connecting to database', err);
            process.exit(1);
        }
    }
};

export default fp(pluginCallback);