import dotenv from 'dotenv';

dotenv.config();

import fastify from 'fastify';
import routeFactory from './routes/index';
import errorHandler from './error';
import type { FastifyInstance } from 'fastify';

const server: FastifyInstance = fastify();

server.setErrorHandler(errorHandler);
server.register(routeFactory, {
    apiPrefix: '/api',
    authPrefix: '/auth',
    adminPrefix: '/admin'
});

server.listen({port: process.env.PORT, host: process.env.HOST}, (err: Error | null, address: string): void => {
    if (err) {
        server.log.error(err);
        process.exit(1);
    }

    console.log(`Server listening on ${address}`);
});