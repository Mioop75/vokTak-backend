import { PrismaService } from '@/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import { ChatGateway } from './chat.gateway';

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let prisma: {
    message: {
      findMany: jest.Mock;
      create: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      message: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);
    gateway.server = { emit: jest.fn() } as any;
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('getMessages', () => {
    it('should return messages for a chat', async () => {
      const mockMessages = [
        {
          id: 1,
          message: 'Hello',
          user: { uuid: 'user-uuid', avatar: null },
        },
        {
          id: 2,
          message: 'Hi there!',
          user: { uuid: 'other-uuid', avatar: null },
        },
      ];
      prisma.message.findMany.mockResolvedValue(mockMessages);

      const result = await gateway.getMessages({ chat_id: 1 });

      expect(prisma.message.findMany).toHaveBeenCalledWith({
        where: { chat_id: 1 },
        include: {
          user: {
            include: {
              avatar: true,
            },
          },
        },
      });
      expect(result).toEqual(mockMessages);
    });
  });

  describe('sendMessage', () => {
    it('should create a message and emit it', async () => {
      const data = {
        user_uuid: 'user-uuid',
        chat_id: 1,
        message: 'Hello!',
      };

      const mockMessage = {
        id: 1,
        ...data,
        user: {
          uuid: 'user-uuid',
          avatar: { photo: null },
        },
      };

      prisma.message.create.mockResolvedValue(mockMessage);

      const result = await gateway.sendMessage(data);

      expect(prisma.message.create).toHaveBeenCalledWith({
        data: {
          user_uuid: 'user-uuid',
          chat_id: 1,
          message: 'Hello!',
        },
        include: {
          user: {
            include: {
              avatar: {
                include: {
                  photo: true,
                },
              },
            },
          },
        },
      });

      expect(gateway.server.emit).toHaveBeenCalledWith(
        'create_message',
        mockMessage,
      );
      expect(result).toEqual(mockMessage);
    });
  });
});
