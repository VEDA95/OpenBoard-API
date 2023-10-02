import zodToJsonSchema from 'zod-to-json-schema';
import { helloWorldSchema } from '../schema/hello';
import type { FastifyInstance, FastifyServerOptions, FastifyRequest, FastifyReply} from 'fastify';
import type { DoneCallback } from './types/done';
import type { HelloWorldSchema } from '../schema/hello';

export default (fastify: FastifyInstance, options: FastifyServerOptions, done: DoneCallback): void => {
    fastify.get('/', async (request: FastifyRequest, response: FastifyReply): Promise<string> => {
        return 'Hello World!';
    });

    fastify.post('/', {
        schema: {
            body: zodToJsonSchema(helloWorldSchema, {name: 'HelloWorld'}).definitions?.HelloWorld
        }
    }, async (request: FastifyRequest<{Body: HelloWorldSchema}>, response: FastifyReply): Promise<string> => {
        return `Hello, ${request.body.name}`;
    });

    done();
};