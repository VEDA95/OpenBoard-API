import z from 'zod';
import build from '../src/lib/build';
import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import type { OKResponse, ErrorResponse } from '../src/types/response';
import type { User } from '../src/types/user'

const permission = z.object({
    id: z.string().uuid(),
    path: z.string()
});
const role = z.object({
    id: z.string().uuid(),
    name: z.string(),
    permissions: z.array(permission)
});
const user = z.object({
    id: z.string().uuid(),
    date_created: z.string().datetime(),
    date_updated: z.string().datetime().nullish(),
    last_login: z.string().datetime().nullish(),
    username: z.string(),
    email: z.string().email(),
    first_name: z.string().nullish(),
    last_name: z.string().nullish(),
    enabled: z.boolean(),
    dark_mode: z.boolean(),
    thumbnail: z.null(),
    external_provider: z.null(),
    roles: z.array(role)
});
const userArr = z.array(user);
const testUser = {
    username: 'brod',
    email: 'bender@example.com',
    password: 'test12345',
    first_name: 'Bender',
    last_name: 'Rodreguez',
    email_verified: true
};

describe('API Endpoint Test - users', (): void => {
    let user_id: string;
    const server: FastifyInstance = build();

    describe('/admin/users', (): void => {
        describe('GET', (): void => {
            test('200 - OK', async (): Promise<void> => {
                const response = await server.inject({ method: 'GET', url: '/admin/users', headers: { 'content-type': 'application/json' } });
                const jsonPayload: OKResponse<Array<User>> = JSON.parse(response.body);

                expect(response.statusCode).toEqual(200);
                console.log(response.headers);
                expect(response.headers['content-type']).toEqual('application/json; charset=utf-8');
                expect(jsonPayload.code).toEqual(200);
                expect(jsonPayload.count).toBeGreaterThanOrEqual(1);
                userArr.parse(jsonPayload.data);
            });
        });

        describe('POST', (): void => {
            test('201 - Created', async (): Promise<void> => {
                const response = await server.inject({
                    method: 'POST',
                    url: '/admin/users',
                    headers: { 'content-type': 'application/json' },
                    body: testUser
                });
                const jsonPayload: OKResponse<User> = JSON.parse(response.body);

                expect(response.statusCode).toEqual(201);
                expect(response.headers['content-type']).toEqual('application/json; charset=utf-8');
                expect(jsonPayload.code).toEqual(201);
                expect(jsonPayload.message).toEqual(`User: brod was successfully created!`);
                user.parse(jsonPayload.data);

                user_id = jsonPayload.data.id;
            });

            test('400 - Error', async (): Promise<void> => {
                const response = await server.inject({
                    method: 'POST',
                    url: '/admin/users',
                    headers: { 'content-type': 'application/json' },
                    body: {
                        username: 'zebend',
                        email: 'ze',
                        password: 'test12345',
                        first_name: 'Bender',
                        last_name: 'Rodreguez',
                        email_verified: true
                    }
                });
                const jsonPayload: ErrorResponse = JSON.parse(response.body);

                expect(response.statusCode).toEqual(400);
                expect(response.headers['content-type']).toEqual('application/json; charset=utf-8');
                expect(jsonPayload.code).toEqual(400);
                expect(jsonPayload.error).toEqual('A valid email address is required...');
            });
        });
    });

    describe('/admin/users/:id', (): void => {
        describe('GET', (): void => {
            test('200 - OK', async (): Promise<void> => {
                if(user_id == null) throw Error('Unable to run this test until POST test passes...');

                const response = await server.inject({ method: 'GET', url: `/admin/users/${user_id}`, headers: { 'content-type': 'application/json' } });
                const jsonPayload: OKResponse<User> = JSON.parse(response.body);

                expect(response.statusCode).toEqual(200);
                expect(response.headers['content-type']).toEqual('application/json; charset=utf-8');
                expect(jsonPayload.code).toEqual(200);
                user.parse(jsonPayload.data);
            });

            test('400 - Error', async (): Promise<void> => {
                const response = await server.inject({ method: 'GET', url: `/admin/users/%20`, headers: { 'content-type': 'application/json' } });
                const jsonPayload: ErrorResponse = JSON.parse(response.body);

                expect(response.statusCode).toEqual(400);
                expect(response.headers['content-type']).toEqual('application/json; charset=utf-8');
                expect(jsonPayload.code).toEqual(400);
                expect(jsonPayload.error).toEqual('User ID must be provided...');
            });

            test('404 - Not found', async (): Promise<void> => {
                const randomID: string = randomUUID();
                const response = await server.inject({ method: 'GET', url: `/admin/users/${randomID}`, headers: { 'content-type': 'application/json' } });
                const jsonPayload: ErrorResponse = JSON.parse(response.body);

                expect(response.statusCode).toEqual(404);
                expect(response.headers['content-type']).toEqual('application/json; charset=utf-8');
                expect(jsonPayload.code).toEqual(404);
                expect(jsonPayload.error).toEqual('No user found...');
            });
        });

        describe('PATCH', (): void => {
            test('200 - OK', async (): Promise<void> => {
                if(user_id == null) throw Error('Unable to run this test until POST test passes...');

                const response = await server.inject({
                    method: 'PATCH',
                    url: `/admin/users/${user_id}`,
                    headers: { 'content-type': 'application/json' },
                    body: {
                        first_name: 'Fry'
                    }
                });
                const jsonPayload: OKResponse<User> = JSON.parse(response.body);

                expect(response.statusCode).toEqual(200);
                expect(response.headers['content-type']).toEqual('application/json; charset=utf-8');
                expect(jsonPayload.code).toEqual(200);
                user.parse(jsonPayload.data);
                expect(jsonPayload.data).not.toEqual(testUser);
            });

            test('400 - Error', async (): Promise<void> => {
                if(user_id == null) throw Error('Unable to run this test until POST test passes...');

                const response = await server.inject({
                    method: 'PATCH',
                    url: `/admin/users/${user_id}`,
                    headers: { 'content-type': 'application/json' },
                    body: {
                        username: ''
                    }
                });
                const jsonPayload: ErrorResponse = JSON.parse(response.body);

                expect(response.statusCode).toEqual(400);
                expect(response.headers['content-type']).toEqual('application/json; charset=utf-8');
                expect(jsonPayload.code).toEqual(400);
                expect(jsonPayload.error).toEqual('A valid username is required...');
            });

            test('404 - Not found', async (): Promise<void> => {
                if(user_id == null) throw Error('Unable to run this test until POST test passes...');

                const randomID: string = randomUUID();
                const response = await server.inject({
                    method: 'PATCH',
                    url: `/admin/users/${randomID}`,
                    headers: { 'content-type': 'application/json' },
                    body: {
                        first_name: 'Fry'
                    }
                });
                const jsonPayload: ErrorResponse = JSON.parse(response.body);

                expect(response.statusCode).toEqual(404);
                expect(response.headers['content-type']).toEqual('application/json; charset=utf-8');
                expect(jsonPayload.code).toEqual(404);
                expect(jsonPayload.error).toEqual('No user found...');
            });
        });

        describe('DELETE', (): void => {
            test('200 - OK', async (): Promise<void> => {
                if(user_id == null) throw Error('Unable to run this test until POST test passes...');

                const response = await server.inject({ method: 'DELETE', url: `/admin/users/${user_id}`, headers: { 'content-type': 'application/json' } });
                const jsonPayload: OKResponse<null> = JSON.parse(response.body);

                expect(response.statusCode).toEqual(200);
                expect(response.headers['content-type']).toEqual('application/json; charset=utf-8');
                expect(jsonPayload.code).toEqual(200);
                expect(jsonPayload.message).toEqual('User has been deleted successfully...');
                expect(jsonPayload.data).toEqual(null);
            });

            test('400 - Error', async (): Promise<void> => {
                const response = await server.inject({ method: 'DELETE', url: `/admin/users/%20`, headers: { 'content-type': 'application/json' }});
                const jsonPayload: ErrorResponse = JSON.parse(response.body);

                expect(response.statusCode).toEqual(400);
                expect(response.headers['content-type']).toEqual('application/json; charset=utf-8');
                expect(jsonPayload.code).toEqual(400);
                expect(jsonPayload.error).toEqual('User ID must be provided...');
            });

            test('404 - Not found', async (): Promise<void> => {
                const randomID: string = randomUUID();
                const response = await server.inject({ method: 'DELETE', url: `/admin/users/${randomID}`, headers: { 'content-type': 'application/json' } });
                const jsonPayload: ErrorResponse = JSON.parse(response.body);

                expect(response.statusCode).toEqual(404);
                expect(response.headers['content-type']).toEqual('application/json; charset=utf-8');
                expect(jsonPayload.code).toEqual(404);
                expect(jsonPayload.error).toEqual('No user found...');
            });
        });
    });

    afterAll((): void => {
        server.close();
    });
});