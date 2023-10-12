import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import type { DoneCallback } from '../types/done';


export default (fastify: FastifyInstance, options: FastifyPluginOptions, done: DoneCallback): void => {
    done();
};