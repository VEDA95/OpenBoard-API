import fp from 'fastify-plugin';
import userRoutes from './user';
import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import type { DoneCallback } from '../../types/done';


export default fp((fastify: FastifyInstance, options: FastifyPluginOptions, done: DoneCallback): void => {
    const { prefix }: FastifyPluginOptions = options;

    fastify.register(userRoutes, { prefix: prefix });
    done();
});