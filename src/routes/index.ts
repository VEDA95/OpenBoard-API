import helloRoutes from './hello';
import type { FastifyInstance } from 'fastify';
import type { FactoryOptions } from './types/options';
import type { DoneCallback } from './types/done';


export default (fastify: FastifyInstance, options: FactoryOptions, done: DoneCallback): void => {
    const { apiPrefix }: FactoryOptions = options;

    fastify.register(helloRoutes, {prefix: apiPrefix});
    done();
};