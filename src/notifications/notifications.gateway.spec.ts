import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';

describe('NotificationsGateway', () => {
  let gateway: NotificationsGateway;
  let notificationsService: {
    getNotifications: jest.Mock;
    sendNotification: jest.Mock;
  };

  beforeEach(async () => {
    notificationsService = {
      getNotifications: jest.fn(),
      sendNotification: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsGateway,
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    gateway = module.get<NotificationsGateway>(NotificationsGateway);
    gateway.server = { emit: jest.fn() } as any;
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('getNotifications', () => {
    it('should return notifications for a user', async () => {
      const mockNotifications = [
        { id: 1, message: 'New notification', user_uuid: 'user-uuid' },
      ];
      notificationsService.getNotifications.mockResolvedValue(
        mockNotifications,
      );

      const result = await gateway.getNotifications('user-uuid');

      expect(notificationsService.getNotifications).toHaveBeenCalledWith(
        'user-uuid',
      );
      expect(result).toEqual(mockNotifications);
    });
  });

  describe('sendNotification', () => {
    it('should create and emit a notification', async () => {
      const data = {
        user_uuid: 'user-uuid',
        message: 'You have a new message',
      };

      const mockNotification = {
        id: 1,
        ...data,
      };
      notificationsService.sendNotification.mockResolvedValue(
        mockNotification,
      );

      const result = await gateway.sendNotification(data);

      expect(notificationsService.sendNotification).toHaveBeenCalledWith(
        'user-uuid',
        'You have a new message',
      );
      expect(gateway.server.emit).toHaveBeenCalledWith(
        'sendNotification',
        mockNotification,
      );
      expect(result).toEqual(mockNotification);
    });
  });
});
