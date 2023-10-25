import z from 'zod';
import build from '../src/build';
import type { FastifyInstance } from 'fastify';

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

describe('API Endpoint Test - users', (): void => {
    const server: FastifyInstance = build();

    describe('/admin/users', (): void => {
        describe('GET', (): void => {
            test('200 - OK', async (): Promise<void> => {
                const response = await server.inject({ method: 'GET', url: '/admin/users', headers: { 'content-type': 'application/json' } });

                expect(response.statusCode).toEqual(200);
                userArr.parse(JSON.parse(response.body)?.data);
            });
        });

        describe('POST', (): void => {
            test('201 - Created', async (): Promise<void> => {});
            test('400 - Error', async (): Promise<void> => {});
        });
    });

    describe('/admin/users/:id', (): void => {
        describe('GET', (): void => {
            test('200 - OK', async (): Promise<void> => {});
            test('400 - Error', async (): Promise<void> => {});
            test('404 - Not found', async (): Promise<void> => {});
        });

        describe('PATCH', (): void => {
            test('200 - OK', async (): Promise<void> => {});
            test('400 - Error', async (): Promise<void> => {});
            test('404 - Not found', async (): Promise<void> => {});
        });

        describe('DELETE', (): void => {
            test('200 - OK', async (): Promise<void> => {});
            test('400 - Error', async (): Promise<void> => {});
            test('404 - Not found', async (): Promise<void> => {});
        });
    });

    afterAll((): void => {
        server.close();
    });
});