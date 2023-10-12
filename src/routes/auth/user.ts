import { zodToJsonSchema } from 'zod-to-json-schema';
import type { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply} from 'fastify';
import type { DoneCallback } from '../types/done';

export default (fastify: FastifyInstance, options: FastifyPluginOptions, done: DoneCallback): void => {
    fastify.get('/', async (request: FastifyRequest, response: FastifyReply): Promise<string> => {
        return 'Hello World!';
    });

    fastify.post('/', {
        schema: {
            body: zodToJsonSchema(helloWorldSchema, {errorMessages: true})
        }
    }, async (request: FastifyRequest<{Body: HelloWorldSchema}>, response: FastifyReply): Promise<string> => {
        return `Hello, ${request.body.name}!`;
    });

    done();
};