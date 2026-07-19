import { PrismaService } from '@/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';

describe('ChatService', () => {
  let service: ChatService;
  let prisma: {
    chat: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      chat: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAll', () => {
    it('should return all chats for a user', async () => {
      const mockChats = [
        { id: 1, name: 'Chat 1', messages: [], users: [] },
        { id: 2, name: 'Chat 2', messages: [], users: [] },
      ];
      prisma.chat.findMany.mockResolvedValue(mockChats);

      const result = await service.getAll('user-uuid');

      expect(prisma.chat.findMany).toHaveBeenCalledWith({
        where: { users: { some: { uuid: 'user-uuid' } } },
        include: {
          messages: true,
          users: true,
        },
      });
      expect(result).toEqual(mockChats);
    });
  });

  describe('getOne', () => {
    it('should return a chat by id with messages and users', async () => {
      const mockChat = {
        id: 1,
        name: 'Chat 1',
        messages: [
          {
            id: 1,
            message: 'Hello',
            user: { uuid: 'user-uuid', avatar: null },
          },
        ],
        users: [{ uuid: 'user-uuid' }],
      };
      prisma.chat.findFirst.mockResolvedValue(mockChat);

      const result = await service.getOne(1);

      expect(prisma.chat.findFirst).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          messages: {
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
          },
          users: true,
        },
      });
      expect(result).toEqual(mockChat);
    });
  });

  describe('create', () => {
    it('should create a chat with an initial message', async () => {
      const dto = {
        name: 'New Chat',
        receiver_uuids: ['receiver-uuid-1', 'receiver-uuid-2'],
        message: 'Hey everyone!',
      };
      const mockChat = { id: 1, name: 'New Chat' };
      prisma.chat.create.mockResolvedValue(mockChat);

      const result = await service.create('user-uuid', dto);

      expect(prisma.chat.create).toHaveBeenCalledWith({
        data: {
          name: 'New Chat',
          messages: {
            create: {
              message: 'Hey everyone!',
              user_uuid: 'user-uuid',
            },
          },
          users: {
            connect: [
              { uuid: 'user-uuid' },
              { uuid: 'receiver-uuid-1' },
              { uuid: 'receiver-uuid-2' },
            ],
          },
        },
      });
      expect(result).toEqual(mockChat);
    });
  });

  describe('delete', () => {
    it('should delete a chat', async () => {
      prisma.chat.delete.mockResolvedValue({ id: 1 });

      const result = await service.delete(1);

      expect(prisma.chat.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual({ id: 1 });
    });
  });
});
