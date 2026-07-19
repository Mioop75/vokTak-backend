import { Test, TestingModule } from '@nestjs/testing';
import { FriendsController } from './friends.controller';
import { FriendsService } from './friends.service';
import { AuthGuard } from '@/shared/Guards/auth.guard';
import { PrismaService } from '@/prisma.service';

describe('FriendsController', () => {
  let controller: FriendsController;
  let friendsService: {
    getListFriends: jest.Mock;
    getFriend: jest.Mock;
    addFriend: jest.Mock;
    confirmFriend: jest.Mock;
    cancelFriend: jest.Mock;
    removeFriend: jest.Mock;
  };

  beforeEach(async () => {
    friendsService = {
      getListFriends: jest.fn(),
      getFriend: jest.fn(),
      addFriend: jest.fn(),
      confirmFriend: jest.fn(),
      cancelFriend: jest.fn(),
      removeFriend: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FriendsController],
      providers: [
        { provide: FriendsService, useValue: friendsService },
        { provide: PrismaService, useValue: {} },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<FriendsController>(FriendsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getFriendsList', () => {
    it('should return list of friends', async () => {
      const mockFriends = [
        { id: 1, confirmed: true, user: {}, userOf: {} },
      ];
      friendsService.getListFriends.mockResolvedValue(mockFriends);

      const result = await controller.getFriendsList('user-uuid');

      expect(friendsService.getListFriends).toHaveBeenCalledWith('user-uuid');
    });
  });

  describe('getFriend', () => {
    it('should return a friend info', async () => {
      const mockFriend = {
        id: 1,
        user_uuid: 'target-uuid',
        userOf_uuid: 'current-uuid',
        confirmed: true,
      };
      friendsService.getFriend.mockResolvedValue(mockFriend);

      const result = await controller.getFriend('current-uuid', 'target-uuid');

      expect(friendsService.getFriend).toHaveBeenCalledWith(
        'current-uuid',
        'target-uuid',
      );
    });
  });

  describe('confirmFriend', () => {
    it('should confirm a friend request', async () => {
      friendsService.confirmFriend.mockResolvedValue('The friend was confirmed');

      const result = await controller.confirmFriend(1);

      expect(friendsService.confirmFriend).toHaveBeenCalledWith(1);
      expect(result).toBe('The friend was confirmed');
    });
  });

  describe('cancelFriend', () => {
    it('should cancel a friend request', async () => {
      friendsService.cancelFriend.mockResolvedValue('The friend was canceled');

      const result = await controller.cancelFriend(1);

      expect(friendsService.cancelFriend).toHaveBeenCalledWith(1);
      expect(result).toBe('The friend was canceled');
    });
  });

  describe('addFriend', () => {
    it('should add a friend', async () => {
      friendsService.addFriend.mockResolvedValue(
        'The user was added to your list of friends',
      );

      const result = await controller.addFriend('user-uuid', {
        user_uuid: 'target-uuid',
      });

      expect(friendsService.addFriend).toHaveBeenCalledWith(
        'user-uuid',
        'target-uuid',
      );
      expect(result).toBe('The user was added to your list of friends');
    });
  });

  describe('removeFriendFromListFriends', () => {
    it('should remove a friend', async () => {
      friendsService.removeFriend.mockResolvedValue(
        'User was removed from the list of friends',
      );

      const result = await controller.removeFriendFromListFriends(1);

      expect(friendsService.removeFriend).toHaveBeenCalledWith(1);
      expect(result).toBe('User was removed from the list of friends');
    });
  });
});
