import { PrismaService } from '@/prisma.service';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  genSalt: jest.fn().mockResolvedValue('$2b$8$'),
  hash: jest.fn().mockResolvedValue('$2b$8$hashedpassword'),
}));

describe('UsersService', () => {
  let service: UsersService;
  let prisma: {
    user: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      findFirstOrThrow: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    session: {
      delete: jest.Mock;
    };
    user_Info: {
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findFirstOrThrow: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      session: {
        delete: jest.fn(),
      },
      user_Info: {
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllUsers', () => {
    it('should return all users except the current one', async () => {
      const mockUsers = [
        { uuid: 'user-1', email: 'user1@test.com', nickname: 'user1' },
        { uuid: 'user-2', email: 'user2@test.com', nickname: 'user2' },
      ];

      prisma.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.getAllUsers('current-uuid');

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {
          NOT: {
            uuid: 'current-uuid',
          },
        },
        select: expect.objectContaining({
          uuid: true,
          email: true,
        }),
      });
      expect(result).toEqual(mockUsers);
    });
  });

  describe('getUser', () => {
    it('should return a user by uuid', async () => {
      const mockUser = {
        uuid: 'user-uuid',
        email: 'test@test.com',
        nickname: 'testuser',
        friends: [],
        friendsOf: [],
      };

      prisma.user.findFirstOrThrow.mockResolvedValue(mockUser);

      const result = await service.getUser('user-uuid');

      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user is not found', async () => {
      prisma.user.findFirstOrThrow.mockRejectedValue(new Error('Not found'));

      await expect(service.getUser('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getUserByEmail', () => {
    it('should return a user by email', async () => {
      const mockUser = {
        uuid: 'user-uuid',
        email: 'test@test.com',
        nickname: 'testuser',
        avatar: null,
      };

      prisma.user.findFirstOrThrow.mockResolvedValue(mockUser);

      const result = await service.getUserByEmail('test@test.com');

      expect(prisma.user.findFirstOrThrow).toHaveBeenCalledWith({
        where: { email: 'test@test.com' },
        include: { avatar: true },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user is not found', async () => {
      prisma.user.findFirstOrThrow.mockRejectedValue(new Error('Not found'));

      await expect(service.getUserByEmail('nobody@test.com')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const dto = {
        email: 'new@test.com',
        nickname: 'newuser',
        firstname: 'New',
        lastname: 'User',
        password: 'password123',
      };

      const mockUser = {
        uuid: 'new-uuid',
        email: dto.email,
        nickname: dto.nickname,
        firstname: dto.firstname,
        lastname: dto.lastname,
        language: 'eng',
      };

      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser);

      const result = await service.create(dto);

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
      expect(prisma.user.create).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should throw BadRequestException if user already exists', async () => {
      const dto = {
        email: 'existing@test.com',
        nickname: 'existing',
        firstname: 'Ex',
        lastname: 'User',
        password: 'password123',
      };

      prisma.user.findFirst.mockResolvedValue({ uuid: 'existing-uuid' });

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      const dto = { nickname: 'updated', firstname: 'Updated', lastname: 'User', email: 'updated@test.com' };
      const mockUser = { uuid: 'user-uuid', ...dto, language: 'eng' };

      prisma.user.update.mockResolvedValue(mockUser);

      const result = await service.update('user-uuid', dto);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { uuid: 'user-uuid' },
        data: expect.objectContaining(dto),
        select: expect.objectContaining({ uuid: true }),
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateInfo', () => {
    it('should create user_info if it does not exist', async () => {
      const dto = { currentCity: 'Moscow', hometown: 'SPB' };
      const mockUser = { uuid: 'user-uuid', user_info: null };

      prisma.user.findFirst.mockResolvedValue(mockUser);
      prisma.user_Info.create.mockResolvedValue({});

      await service.updateInfo('user-uuid', dto);

      expect(prisma.user_Info.create).toHaveBeenCalledWith({
        data: { user_uuid: 'user-uuid', ...dto },
      });
    });

    it('should update user_info if it exists', async () => {
      const dto = { currentCity: 'Moscow' };
      const mockUser = { uuid: 'user-uuid', user_info: { id: 1 } };

      prisma.user.findFirst.mockResolvedValue(mockUser);
      prisma.user_Info.update.mockResolvedValue({});

      await service.updateInfo('user-uuid', dto);

      expect(prisma.user_Info.update).toHaveBeenCalledWith({
        where: { user_uuid: 'user-uuid' },
        data: { ...dto },
      });
    });
  });

  describe('changePassword', () => {
    it('should change password when old password is correct', async () => {
      const bcrypt = require('bcrypt');
      bcrypt.compare.mockResolvedValue(true);

      const dto = { oldPassword: 'old', newPassword: 'new' };
      prisma.user.findFirst.mockResolvedValue({
        uuid: 'user-uuid',
        password: '$2b$8$hashedold',
      });
      prisma.user.update.mockResolvedValue({ uuid: 'user-uuid' });

      const result = await service.changePassword('user-uuid', dto);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { uuid: 'user-uuid' },
        data: { password: 'new' },
      });
    });

    it('should throw UnauthorizedException when old password is wrong', async () => {
      const bcrypt = require('bcrypt');
      bcrypt.compare.mockResolvedValue(false);

      prisma.user.findFirst.mockResolvedValue({
        uuid: 'user-uuid',
        password: '$2b$8$hashedold',
      });

      await expect(
        service.changePassword('user-uuid', {
          oldPassword: 'wrong',
          newPassword: 'new',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('changeLanguage', () => {
    it('should change user language', async () => {
      prisma.user.update.mockResolvedValue({
        uuid: 'user-uuid',
        language: 'rus',
      });

      const result = await service.changeLanguage('user-uuid', {
        language: 'rus',
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { uuid: 'user-uuid' },
        data: { language: 'rus' },
      });
    });
  });

  describe('updateAvatar', () => {
    it('should update user avatar', async () => {
      const mockFile = {
        path: 'uploads\\users\\avatars\\2024\\10\\image.jpg',
        filename: 'image.jpg',
      };

      prisma.user.update.mockResolvedValue({ uuid: 'user-uuid' });

      const result = await service.updateAvatar('user-uuid', mockFile as any);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { uuid: 'user-uuid' },
        data: {
          avatar: {
            create: {
              photo: {
                create: {
                  name: 'image.jpg',
                  image: 'uploads/users/avatars/2024/10/image.jpg',
                },
              },
            },
          },
        },
      });
    });
  });

  describe('delete', () => {
    it('should delete session and user', async () => {
      prisma.session.delete.mockResolvedValue({});
      prisma.user.delete.mockResolvedValue({ uuid: 'user-uuid' });

      const result = await service.delete('user-uuid', 'test-sid');

      expect(prisma.session.delete).toHaveBeenCalledWith({
        where: { sid: 'test-sid' },
      });
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { uuid: 'user-uuid' },
      });
    });
  });
});
