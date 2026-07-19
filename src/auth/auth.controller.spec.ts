import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma.service';
import { AuthGuard } from '../shared/Guards/auth.guard';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    registration: jest.Mock;
    login: jest.Mock;
    logout: jest.Mock;
    getMe: jest.Mock;
  };
  let usersService: {
    create: jest.Mock;
    getUserByEmail: jest.Mock;
  };
  let configService: {
    get: jest.Mock;
  };

  beforeEach(async () => {
    authService = {
      registration: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
      getMe: jest.fn(),
    };
    usersService = {
      create: jest.fn(),
      getUserByEmail: jest.fn(),
    };
    configService = {
      get: jest.fn().mockReturnValue('localhost'),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: UsersService, useValue: usersService },
        { provide: ConfigService, useValue: configService },
        { provide: PrismaService, useValue: {} },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('registration (sign-up)', () => {
    it('should create user, create session, set cookie, return user', async () => {
      const dto = {
        email: 'test@test.com',
        nickname: 'testuser',
        firstname: 'Test',
        lastname: 'User',
        password: 'password123',
      };

      const mockUser = {
        uuid: 'user-uuid',
        email: dto.email,
        nickname: dto.nickname,
        firstname: dto.firstname,
        lastname: dto.lastname,
        language: 'eng',
      };

      usersService.create.mockResolvedValue(mockUser);
      authService.registration.mockResolvedValue('session-sid');

      const mockRes = {
        cookie: jest.fn(),
      };

      const result = await controller.registration(dto, mockRes as any);

      expect(usersService.create).toHaveBeenCalledWith(dto);
      expect(authService.registration).toHaveBeenCalledWith('user-uuid');
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'sid',
        'session-sid',
        expect.objectContaining({
          path: '/api/',
          signed: true,
          httpOnly: true,
          secure: true,
        }),
      );
      expect(result).toEqual(
        expect.objectContaining({
          uuid: 'user-uuid',
          email: dto.email,
        }),
      );
    });
  });

  describe('login (sign-in)', () => {
    it('should authenticate user, set cookie, return user', async () => {
      const dto = { email: 'test@test.com', password: 'password123' };

      const mockUser = {
        uuid: 'user-uuid',
        email: dto.email,
        nickname: 'testuser',
        firstname: 'Test',
        lastname: 'User',
        password: '$2b$8$hashedpassword',
        language: 'eng',
      };

      usersService.getUserByEmail.mockResolvedValue(mockUser);
      authService.login.mockResolvedValue('session-sid');

      const mockRes = {
        cookie: jest.fn(),
      };

      const result = await controller.login(dto, mockRes as any);

      expect(usersService.getUserByEmail).toHaveBeenCalledWith(dto.email);
      expect(authService.login).toHaveBeenCalledWith(
        'user-uuid',
        mockUser.password,
        dto.password,
      );
      expect(mockRes.cookie).toHaveBeenCalled();
      expect(result).toEqual(
        expect.objectContaining({
          uuid: 'user-uuid',
          email: dto.email,
        }),
      );
    });
  });

  describe('logout', () => {
    it('should logout user, clear cookie', async () => {
      authService.logout.mockResolvedValue('Session was deleted');

      const mockRes = {
        cookie: jest.fn(),
      };

      const result = await controller.logout('test-sid', mockRes as any);

      expect(authService.logout).toHaveBeenCalledWith('test-sid');
      expect(mockRes.cookie).toHaveBeenCalledWith('sid', null, {
        path: '/api/',
        maxAge: -1,
      });
      expect(result).toBe('Session was deleted');
    });
  });

  describe('getMe', () => {
    it('should return current user', async () => {
      const mockUser = {
        uuid: 'user-uuid',
        email: 'test@test.com',
        nickname: 'testuser',
        firstname: 'Test',
        lastname: 'User',
        language: 'eng',
      };

      authService.getMe.mockResolvedValue({ user: mockUser });

      const result = await controller.getMe('test-sid');

      expect(authService.getMe).toHaveBeenCalledWith('test-sid');
      expect(result).toEqual(
        expect.objectContaining({
          uuid: 'user-uuid',
          email: 'test@test.com',
        }),
      );
    });
  });
});
