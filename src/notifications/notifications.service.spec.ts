import { PrismaService } from '@/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: {
    notification: {
      findMany: jest.Mock;
      create: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      notification: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getNotifications', () => {
    it('should return all notifications for a user', async () => {
      const mockNotifications = [
        { id: 1, message: 'You have a new friend request', user_uuid: 'user-uuid' },
        { id: 2, message: 'Your post was liked', user_uuid: 'user-uuid' },
      ];
      prisma.notification.findMany.mockResolvedValue(mockNotifications);

      const result = await service.getNotifications('user-uuid');

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { user_uuid: 'user-uuid' },
      });
      expect(result).toEqual(mockNotifications);
    });

    it('should return empty array when no notifications', async () => {
      prisma.notification.findMany.mockResolvedValue([]);

      const result = await service.getNotifications('user-uuid');

      expect(result).toEqual([]);
    });
  });

  describe('sendNotification', () => {
    it('should create and return a notification', async () => {
      const mockNotification = {
        id: 1,
        message: 'New notification',
        user_uuid: 'user-uuid',
      };
      prisma.notification.create.mockResolvedValue(mockNotification);

      const result = await service.sendNotification(
        'user-uuid',
        'New notification',
      );

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          message: 'New notification',
          user_uuid: 'user-uuid',
        },
      });
      expect(result).toEqual(mockNotification);
    });
  });
});
