import dotenv from 'dotenv';

dotenv.config();

const isProduction: boolean = process.env.NODE_ENV === 'production';

if(isProduction) {
    dotenv.config({path: './.env.production'});

} else {
    dotenv.config({path: './.env.development'});
}

import fastify from 'fastify';
import db from './db/index';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { DBOptions } from './db/index';

const server: FastifyInstance = fastify();
console.log(process.env);
server.register<DBOptions>(db, { db_uri: process.env.DATABASE_URI });
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