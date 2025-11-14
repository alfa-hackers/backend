import { Test, TestingModule } from '@nestjs/testing';
import { UserTempController } from './user-temp.contoller';
import { AuthService } from '../auth/services/auth.service';
import { FastifyRequest } from 'fastify';
import { Logger } from '@nestjs/common';

describe('UserTempController', () => {
  let controller: UserTempController;
  let authService: Partial<AuthService>;

  beforeEach(async () => {
    authService = {
      getCurrentUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserTempController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<UserTempController>(UserTempController);
  });

  it('should return user id from AuthService if cookie exists', async () => {
    const mockRequest = {
      headers: { cookie: 'token=abc' },
      session: {},
    } as unknown as FastifyRequest;

    (authService.getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user123' });

    const result = await controller.getUserTempId(mockRequest);

    expect(result).toEqual({ userTempId: 'user123' });
    expect(authService.getCurrentUser).toHaveBeenCalledWith(mockRequest);
  });

  it('should return user_temp_id from session if no cookie', async () => {
    const mockRequest = {
      headers: {},
      session: { user_temp_id: 'temp456' },
    } as unknown as FastifyRequest;

    const result = await controller.getUserTempId(mockRequest);

    expect(result).toEqual({ userTempId: 'temp456' });
    expect(authService.getCurrentUser).not.toHaveBeenCalled();
  });

  it('should return session user_temp_id if getCurrentUser returns null', async () => {
    const mockRequest = {
      headers: { cookie: 'token=abc' },
      session: { user_temp_id: 'temp789' },
    } as unknown as FastifyRequest;

    (authService.getCurrentUser as jest.Mock).mockResolvedValue(null);

    const result = await controller.getUserTempId(mockRequest);

    expect(result).toEqual({ userTempId: 'temp789' });
  });

  it('should return null if no cookie and no session user_temp_id', async () => {
    const mockRequest = {
      headers: {},
      session: {},
    } as unknown as FastifyRequest;

    const result = await controller.getUserTempId(mockRequest);

    expect(result).toEqual({ userTempId: null });
  });

  it('should return null and log error if authService throws', async () => {
    const mockRequest = {
      headers: { cookie: 'token=abc' },
      session: {},
    } as unknown as FastifyRequest;

    const loggerSpy = jest.spyOn(Logger, 'error').mockImplementation(() => { });
    (authService.getCurrentUser as jest.Mock).mockRejectedValue(new Error('fail'));

    const result = await controller.getUserTempId(mockRequest);

    expect(result).toEqual({ userTempId: null });
    expect(loggerSpy).toHaveBeenCalled();

    loggerSpy.mockRestore();
  });
});
