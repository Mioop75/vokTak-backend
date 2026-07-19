import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthGuard } from '@/shared/Guards/auth.guard';
import { PrismaService } from '@/prisma.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: {
    getAllUsers: jest.Mock;
    getUser: jest.Mock;
    update: jest.Mock;
    updateInfo: jest.Mock;
    changePassword: jest.Mock;
    changeLanguage: jest.Mock;
    updateAvatar: jest.Mock;
    delete: jest.Mock;
  };
  let cacheService: {
    set: jest.Mock;
    del: jest.Mock;
  };

  beforeEach(async () => {
    usersService = {
      getAllUsers: jest.fn(),
      getUser: jest.fn(),
      update: jest.fn(),
      updateInfo: jest.fn(),
      changePassword: jest.fn(),
      changeLanguage: jest.fn(),
      updateAvatar: jest.fn(),
      delete: jest.fn(),
    };
    cacheService = {
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: usersService },
        { provide: CACHE_MANAGER, useValue: cacheService },
        { provide: PrismaService, useValue: {} },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAll', () => {
    it('should return all users except current', async () => {
      const mockUsers = [
        { uuid: 'user-1', email: 'user1@test.com' },
        { uuid: 'user-2', email: 'user2@test.com' },
      ];
      usersService.getAllUsers.mockResolvedValue(mockUsers);

      const result = await controller.getAll('current-uuid');

      expect(usersService.getAllUsers).toHaveBeenCalledWith('current-uuid');
      expect(cacheService.set).toHaveBeenCalledWith('users', mockUsers);
    });
  });

  describe('getUser', () => {
    it('should return a user by uuid', async () => {
      const mockUser = {
        uuid: 'user-uuid',
        email: 'test@test.com',
        nickname: 'testuser',
        friends: [],
      };
      usersService.getUser.mockResolvedValue(mockUser);

      const result = await controller.getUser('user-uuid');

      expect(usersService.getUser).toHaveBeenCalledWith('user-uuid');
      expect(cacheService.set).toHaveBeenCalledWith(
        'user/user-uuid',
        mockUser,
      );
    });
  });

  describe('updateUser', () => {
    it('should update user and clear cache', async () => {
      const dto = { nickname: 'updated', firstname: 'Up', lastname: 'Dated', email: 'up@test.com' };
      const mockUser = { uuid: 'user-uuid', ...dto, language: 'eng' };
      usersService.update.mockResolvedValue(mockUser);

      const result = await controller.updateUser('user-uuid', dto);

      expect(usersService.update).toHaveBeenCalledWith('user-uuid', dto);
      expect(cacheService.del).toHaveBeenCalledWith('users');
      expect(cacheService.del).toHaveBeenCalledWith('user/user-uuid');
    });
  });

  describe('updateUserInfo', () => {
    it('should update user info and clear cache', async () => {
      const dto = { currentCity: 'Moscow' };
      const mockUser = { uuid: 'user-uuid', user_info: dto };
      usersService.updateInfo.mockResolvedValue(mockUser);

      await controller.updateUserInfo('user-uuid', dto as any);

      expect(usersService.updateInfo).toHaveBeenCalledWith('user-uuid', dto);
      expect(cacheService.del).toHaveBeenCalledWith('users');
      expect(cacheService.del).toHaveBeenCalledWith('user/user-uuid');
    });
  });

  describe('changePassword', () => {
    it('should change password and clear cache', async () => {
      const dto = { oldPassword: 'old', newPassword: 'new' };
      const mockUser = { uuid: 'user-uuid' };
      usersService.changePassword.mockResolvedValue(mockUser);

      await controller.changePassword('user-uuid', dto);

      expect(usersService.changePassword).toHaveBeenCalledWith('user-uuid', dto);
      expect(cacheService.del).toHaveBeenCalled();
    });
  });

  describe('changeLanguage', () => {
    it('should change language and clear cache', async () => {
      const dto = { language: 'rus' as const };
      const mockUser = { uuid: 'user-uuid', language: 'rus' };
      usersService.changeLanguage.mockResolvedValue(mockUser);

      await controller.changeLanguage('user-uuid', dto);

      expect(usersService.changeLanguage).toHaveBeenCalledWith('user-uuid', dto);
      expect(cacheService.del).toHaveBeenCalled();
    });
  });

  describe('updateAvatar', () => {
    it('should update avatar and clear cache', async () => {
      const mockFile = {
        path: 'uploads/avatars/image.jpg',
        filename: 'image.jpg',
      };
      const mockUser = { uuid: 'user-uuid' };
      usersService.updateAvatar.mockResolvedValue(mockUser);

      await controller.updateAvatar('user-uuid', mockFile as any);

      expect(usersService.updateAvatar).toHaveBeenCalledWith('user-uuid', mockFile);
      expect(cacheService.del).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete user, session, clear cache', async () => {
      usersService.delete.mockResolvedValue({});
      const mockRes = { cookie: jest.fn() };

      const result = await controller.delete(
        'user-uuid',
        'test-sid',
        mockRes as any,
      );

      expect(mockRes.cookie).toHaveBeenCalledWith('sid', null, {
        path: '/api/',
        maxAge: -1,
      });
      expect(usersService.delete).toHaveBeenCalledWith('user-uuid', 'test-sid');
      expect(cacheService.del).toHaveBeenCalled();
      expect(result).toBe('Account was deleted');
    });
  });
});
