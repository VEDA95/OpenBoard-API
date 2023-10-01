import type { FastifyServerOptions } from 'fastify';

export interface FactoryOptions extends FastifyServerOptions {
    apiPrefix: string;
    authPrefix: string;
    adminPrefix: string;
}