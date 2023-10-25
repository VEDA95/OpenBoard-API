import fp from 'fastify-plugin';
import adminRoutes from './admin/index';
import type { FastifyInstance } from 'fastify';
import type { FactoryOptions } from '../types/options';
import type { DoneCallback } from '../types/done';


export default fp((fastify: FastifyInstance, options: FactoryOptions, done: DoneCallback): void => {
    const { adminPrefix }: FactoryOptions = options;

    fastify.register(adminRoutes, {prefix: adminPrefix});
    done();
});