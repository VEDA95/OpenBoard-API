import type { Pool, PoolClient } from 'pg';

declare module 'fastify' {
    interface FastifyInstance {
        pool: Pool;
        db: PoolClient;
    }
}