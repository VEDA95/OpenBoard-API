import fp from 'fastify-plugin';
import adminRoutes from './admin/index';
import authRoutes from './auth/index';
import type { FastifyInstance } from 'fastify';
import type { FactoryOptions } from '../types/options';
import type { DoneCallback } from '../types/done';


export default fp((fastify: FastifyInstance, options: FactoryOptions, done: DoneCallback): void => {
    const { adminPrefix, authPrefix }: FactoryOptions = options;

    fastify.register(adminRoutes, { prefix: adminPrefix });
    fastify.register(authRoutes, { prefix: authPrefix });
    done();
});