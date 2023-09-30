import dotenv from 'dotenv';

dotenv.config();

import fastify from 'fastify';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'

const server: FastifyInstance = fastify();

server.get('/', async (request: FastifyRequest, response: FastifyReply): Promise<string> => {
    return 'Hello World!';
});

server.listen({port: process.env.PORT, host: process.env.HOST}, (err: Error | null, address: string): void => {
    if (err) {
        console.error(err);
        process.exit(1);
    }

    console.log(`Server listening on ${address}`);
});