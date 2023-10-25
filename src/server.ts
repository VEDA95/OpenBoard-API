import build from './lib/build';
import type { FastifyInstance } from 'fastify';

const server: FastifyInstance = build();

server.listen({port: process.env.PORT!, host: process.env.HOST!}, (err: Error | null, address: string): void => {
    if (err) {
        server.log.error(err);
        process.exit(1);
    }

    console.log(`Server listening on ${address}`);
});