import { PrismaService } from '../prisma.service';
import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    session: {
      create: jest.Mock;
      delete: jest.Mock;
      findUniqueOrThrow: jest.Mock;
    };
    user: {
      findFirst: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      session: {
        create: jest.fn(),
        delete: jest.fn(),
        findUniqueOrThrow: jest.fn(),
      },
      user: {
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registration', () => {
    it('should create a session and return sid', async () => {
      const user_uuid = 'test-uuid';
      const mockSid = 'mock-sid-uuid';
      prisma.session.create.mockResolvedValue({ sid: mockSid });

      const result = await service.registration(user_uuid);

      expect(prisma.session.create).toHaveBeenCalledWith({
        data: { sid: expect.any(String), user_uuid },
      });
      expect(result).toBe(mockSid);
    });
  });

  describe('login', () => {
    it('should return sid when password is correct', async () => {
      const bcrypt = require('bcrypt');
      bcrypt.compare.mockResolvedValue(true);
      prisma.session.create.mockResolvedValue({ sid: 'mock-sid' });

      const result = await service.login(
        'user-uuid',
        '$2b$8$hashedpassword',
        'plainPassword',
      );

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'plainPassword',
        '$2b$8$hashedpassword',
      );
      expect(result).toBe('mock-sid');
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
      const bcrypt = require('bcrypt');
      bcrypt.compare.mockResolvedValue(false);

      await expect(
        service.login('uuid', '$2b$8$hash', 'wrongPassword'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should delete session and return success message', async () => {
      prisma.session.delete.mockResolvedValue({});

      const result = await service.logout('test-sid');

      expect(prisma.session.delete).toHaveBeenCalledWith({
        where: { sid: 'test-sid' },
      });
      expect(result).toBe('Session was deleted');
    });
  });

  describe('getMe', () => {
    it('should return user by session sid', async () => {
      const mockUser = {
        uuid: 'user-uuid',
        email: 'test@test.com',
        nickname: 'testuser',
        firstname: 'Test',
        lastname: 'User',
        language: 'eng',
        posts: [],
        comments: [],
        likes: [],
        friends: [],
        photos: [],
        avatar: null,
        user_info: null,
        chats: [],
      };

      prisma.user.findFirst.mockResolvedValue(mockUser);

      const result = await service.getMe('test-sid');

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { user_sessions: { some: { sid: 'test-sid' } } },
        select: expect.objectContaining({
          uuid: true,
          email: true,
          chats: true,
        }),
      });
      expect(result).toEqual({ user: mockUser });
    });
  });
});
