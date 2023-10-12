import dotenv from 'dotenv';

dotenv.config();

const isProduction: boolean = process.env.NODE_ENV === 'production';

if(isProduction) {
    dotenv.config({path: './.env.production'});

} else {
    dotenv.config({path: './.env.development'});
}

import fastify from 'fastify';
import ajvErrors from 'ajv-errors';
import routeFactory from './routes/index';
import errorHandler from './error';
import envLoggerConfig from './logs';
import db from './db/index';
import type { FastifyInstance } from 'fastify';
import type { DBOptions } from './db/index';

const server: FastifyInstance = fastify({
    ignoreTrailingSlash: true,
    ajv: {
        customOptions: {
            allErrors: true,
        },
        plugins: [ajvErrors]
    },
    logger: isProduction ? envLoggerConfig.production : envLoggerConfig.development,
});

server.setErrorHandler(errorHandler);
server.register<DBOptions>(db, { db_uri: process.env.DATABASE_URI });
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