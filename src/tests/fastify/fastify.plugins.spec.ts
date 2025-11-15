import { registerFastifyPlugins } from 'session';
import { join } from 'path';

// Моки для крипто-функций
jest.mock('crypto');

// Моки Fastify плагинов
jest.mock('@fastify/session', () => jest.fn());
jest.mock('@fastify/cookie', () => jest.fn());
jest.mock('@fastify/cors', () => jest.fn());
jest.mock('@fastify/static', () => ({
    __esModule: true,
    default: jest.fn(),
}));
jest.mock('@fastify/multipart', () => ({
    fastifyMultipart: jest.fn(),
}));

describe('registerFastifyPlugins', () => {
    let fastifyMock: any;
    let appMock: any;
    let mockRandomUUID: jest.Mock;

    beforeEach(async () => {
        jest.clearAllMocks();

        // Мок crypto.randomUUID
        const crypto = await import('crypto');
        mockRandomUUID = jest.fn().mockReturnValue('12345678-1234-1234-1234-123456789012');
        (crypto as any).randomUUID = mockRandomUUID;

        fastifyMock = {
            register: jest.fn(),
            addHook: jest.fn(),
        };

        appMock = {
            getHttpAdapter: jest.fn(() => ({
                getInstance: () => fastifyMock,
            })),
        };

        global.crypto = {
            randomUUID: mockRandomUUID,
        } as any;
    });

    it('should register all Fastify plugins with correct options', async () => {
        const fastifySession = require('@fastify/session');
        const fastifyCors = require('@fastify/cors');
        const fastifyCookie = require('@fastify/cookie');
        const fastifyStatic = require('@fastify/static').default; // <- важно
        const { fastifyMultipart } = require('@fastify/multipart');

        await registerFastifyPlugins(appMock as any);

        expect(fastifyMock.register).toHaveBeenCalledTimes(6);

        const registerCalls = fastifyMock.register.mock.calls;

        expect(registerCalls[0]).toEqual([
            fastifyMultipart,
            expect.objectContaining({
                limits: expect.objectContaining({
                    fieldNameSize: 1000,
                    fieldSize: 2097152,
                    fileSize: 104857600,
                    files: 5,
                    parts: 100,
                }),
            }),
        ]);

        expect(registerCalls[1]).toEqual([
            fastifyCors,
            expect.objectContaining({
                origin: expect.arrayContaining([
                    'https://dev.whirav.ru',
                    'https://whirav.ru',
                    'http://localhost:3000',
                    'http://localhost:3001',
                ]),
                credentials: true,
                methods: expect.arrayContaining(['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE']),
                allowedHeaders: expect.arrayContaining(['Content-Type', 'Authorization']),
            }),
        ]);

        expect(registerCalls[2]).toEqual([fastifyCookie]);

        expect(registerCalls[3][0]).toBe(fastifyStatic);
        expect(registerCalls[3][1]).toMatchObject({
            root: join(process.cwd(), 'uploads'),
            prefix: '/uploads/',
        });

        expect(registerCalls[4][0]).toBe(fastifyStatic);
        expect(registerCalls[4][1]).toMatchObject({
            root: join(process.cwd(), 'static'),
            prefix: '/static/',
        });

        expect(registerCalls[5][0]).toBe(fastifySession);
        expect(registerCalls[5][1]).toMatchObject({
            secret: process.env.SESSION_SECRET,
            cookieName: 'user_temp_id',
        });
    });

    it('should add onRequest hook for generating user_temp_id', async () => {
        await registerFastifyPlugins(appMock as any);

        expect(fastifyMock.addHook).toHaveBeenCalledWith('onRequest', expect.any(Function));

        const hook = fastifyMock.addHook.mock.calls[0][1];
        const sessionSaveMock = jest.fn();
        const reqMock: any = { session: { save: sessionSaveMock } };

        await hook(reqMock);

        expect(mockRandomUUID).toHaveBeenCalled();
        expect(reqMock.session.user_temp_id).toBe('12345678-1234-1234-1234-123456789012');
        expect(sessionSaveMock).toHaveBeenCalled();
    });

    it('should not generate new user_temp_id if already exists', async () => {
        await registerFastifyPlugins(appMock as any);

        const hook = fastifyMock.addHook.mock.calls[0][1];
        const sessionSaveMock = jest.fn();
        const reqMock: any = {
            session: {
                user_temp_id: 'existing-uuid',
                save: sessionSaveMock
            }
        };

        await hook(reqMock);

        expect(mockRandomUUID).not.toHaveBeenCalled();
        expect(reqMock.session.user_temp_id).toBe('existing-uuid');
        expect(sessionSaveMock).not.toHaveBeenCalled();
    });
});
