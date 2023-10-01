import type { FastifyInstance, FastifyServerOptions, FastifyRequest, FastifyReply} from 'fastify';
import type { DoneCallback } from './types/done';

export default (fastify: FastifyInstance, options: FastifyServerOptions, done: DoneCallback): void => {
    fastify.get('/', async (request: FastifyRequest, response: FastifyReply): Promise<string> => {
        return 'Hello world!';
    });

    done();
};