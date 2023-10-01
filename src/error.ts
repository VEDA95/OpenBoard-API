import type { FastifyError, FastifyRequest, FastifyReply } from 'fastify';

export interface ErrorResponse {
    code: number;
    error?: string;
    errors?: Array<string>;
}

export interface HandlerError extends Error {
    statusCode?: number;
}

export function createError(code: number, message?: string): HandlerError {
    let err: HandlerError = new Error();

    err.statusCode = code;
    if(message != null) err.message = message;

    return err;
}

export default async function(err: FastifyError, request: FastifyRequest, response: FastifyReply): Promise<ErrorResponse> {
    response.status(err.statusCode as number);

    if(err.statusCode === 400) return {
        code: 400,
        error: err.message ?? 'Bad Request provided...'
    };

    if(err.statusCode === 401) return {
        code: 401,
        error: 'Authentication Required...'
    };

    if(err.statusCode === 403) return {
        code: 401,
        error: 'Insufficient Permissions...'
    };

    if(err.statusCode === 404) return {
        code: 404,
        error: err.message ?? 'Not Found...'
    };

    if(err.statusCode === 406) {
        return {
            code: 406,
            error: err.message ?? 'Invalid Data...'
        };
    }

    if(err.statusCode === 415) return {
        code: 415,
        error: 'The media type of the provided content is not supported...'
    };

    console.error(err);

    return {
        code: 500,
        error: 'Internal Server error...'
    };
}