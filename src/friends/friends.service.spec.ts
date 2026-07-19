import { PrismaService } from '@/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FriendsService } from './friends.service';

describe('FriendsService', () => {
  let service: FriendsService;
  let prisma: {
    user: {
      findFirst: jest.Mock;
    };
    friend: {
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findFirst: jest.fn(),
      },
      friend: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FriendsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<FriendsService>(FriendsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getListFriends', () => {
    it('should return confirmed friends and pending from current user', async () => {
      const mockFriends = {
        friends: [
          { id: 1, confirmed: true, user_uuid: 'user-uuid', userOf_uuid: 'friend-uuid', user: {}, userOf: {} },
          { id: 2, confirmed: false, user_uuid: 'user-uuid', userOf_uuid: 'pending-uuid', user: {}, userOf: {} },
        ],
        friendsOf: [
          { id: 3, confirmed: true, user_uuid: 'other-uuid', userOf_uuid: 'user-uuid', user: {}, userOf: {} },
        ],
      };
      prisma.user.findFirst.mockResolvedValue(mockFriends);

      const result = await service.getListFriends('user-uuid');

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { uuid: 'user-uuid' },
        include: {
          friends: {
            where: { OR: [{ user_uuid: 'user-uuid' }, { userOf_uuid: 'user-uuid' }] },
            include: {
              user: { include: { avatar: true } },
              userOf: { include: { avatar: true } },
            },
          },
          friendsOf: {
            where: { OR: [{ user_uuid: 'user-uuid' }, { userOf_uuid: 'user-uuid' }] },
            include: {
              user: { include: { avatar: true } },
              userOf: { include: { avatar: true } },
            },
          },
        },
      });
      // Should include confirmed friends + pending from current user
      expect(result.length).toBe(3);
    });

    it('should filter out unconfirmed friend requests from others', async () => {
      const mockFriends = {
        friends: [
          { id: 1, confirmed: false, user_uuid: 'other-uuid', userOf_uuid: 'user-uuid', user: {}, userOf: {} },
        ],
        friendsOf: [],
      };
      prisma.user.findFirst.mockResolvedValue(mockFriends);

      const result = await service.getListFriends('user-uuid');

      // Should be filtered out: not confirmed AND not from current user
      expect(result.length).toBe(0);
    });
  });

  describe('getFriend', () => {
    it('should return a friend relationship', async () => {
      const mockFriend = {
        id: 1,
        user_uuid: 'target-uuid',
        userOf_uuid: 'current-uuid',
        confirmed: true,
      };
      prisma.friend.findFirst.mockResolvedValue(mockFriend);

      const result = await service.getFriend('current-uuid', 'target-uuid');

      expect(prisma.friend.findFirst).toHaveBeenCalledWith({
        where: { userOf_uuid: 'current-uuid', user_uuid: 'target-uuid' },
      });
      expect(result).toEqual(mockFriend);
    });

    it('should return empty object if no friend relationship', async () => {
      prisma.friend.findFirst.mockResolvedValue(null);

      const result = await service.getFriend('current-uuid', 'nobody');

      expect(result).toEqual({});
    });
  });

  describe('addFriend', () => {
    it('should add a user to friends list', async () => {
      prisma.user.findFirst.mockResolvedValue({ uuid: 'current-uuid' });
      prisma.friend.create.mockResolvedValue({
        id: 1,
        user_uuid: 'target-uuid',
        userOf_uuid: 'current-uuid',
      });

      const result = await service.addFriend('current-uuid', 'target-uuid');

      expect(prisma.friend.create).toHaveBeenCalledWith({
        data: { userOf_uuid: 'current-uuid', user_uuid: 'target-uuid' },
      });
      expect(result).toBe('The user was added to your list of friends');
    });

    it('should throw BadRequestException when adding yourself', async () => {
      prisma.user.findFirst.mockResolvedValue({ uuid: 'current-uuid' });

      await expect(
        service.addFriend('current-uuid', 'current-uuid'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('confirmFriend', () => {
    it('should confirm a friend request', async () => {
      prisma.friend.update.mockResolvedValue({ id: 1, confirmed: true });

      const result = await service.confirmFriend(1);

      expect(prisma.friend.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { confirmed: true },
      });
      expect(result).toBe('The friend was confirmed');
    });
  });

  describe('cancelFriend', () => {
    it('should cancel a friend request', async () => {
      prisma.friend.delete.mockResolvedValue({ id: 1 });

      const result = await service.cancelFriend(1);

      expect(prisma.friend.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toBe('The friend was canceled');
    });
  });

  describe('removeFriend', () => {
    it('should remove a friend from the list', async () => {
      prisma.friend.delete.mockResolvedValue({ id: 1 });

      const result = await service.removeFriend(1);

      expect(prisma.friend.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toBe('User was removed from the list of friends');
    });
  });
});
