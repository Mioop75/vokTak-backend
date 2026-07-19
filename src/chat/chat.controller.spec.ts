import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { AuthGuard } from '@/shared/Guards/auth.guard';
import { PrismaService } from '@/prisma.service';

describe('ChatController', () => {
  let controller: ChatController;
  let chatService: {
    getAll: jest.Mock;
    getOne: jest.Mock;
    create: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(async () => {
    chatService = {
      getAll: jest.fn(),
      getOne: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        { provide: ChatService, useValue: chatService },
        { provide: PrismaService, useValue: {} },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ChatController>(ChatController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAll', () => {
    it('should return all chats for current user', async () => {
      const mockChats = [
        { id: 1, name: 'Chat 1', messages: [], users: [] },
      ];
      chatService.getAll.mockResolvedValue(mockChats);

      const result = await controller.getAll('user-uuid');

      expect(chatService.getAll).toHaveBeenCalledWith('user-uuid');
    });
  });

  describe('getOne', () => {
    it('should return a chat by id', async () => {
      const mockChat = {
        id: 1,
        name: 'Chat 1',
        messages: [],
        users: [],
      };
      chatService.getOne.mockResolvedValue(mockChat);

      const result = await controller.getOne(1);

      expect(chatService.getOne).toHaveBeenCalledWith(1);
    });
  });

  describe('create', () => {
    it('should create a chat', async () => {
      const dto = {
        name: 'New Chat',
        receiver_uuids: ['receiver-uuid'],
        message: 'Hello!',
      };
      const mockChat = { id: 1, name: 'New Chat' };
      chatService.create.mockResolvedValue(mockChat);

      const result = await controller.create('user-uuid', dto);

      expect(chatService.create).toHaveBeenCalledWith('user-uuid', dto);
      expect(result).toEqual(mockChat);
    });
  });

  describe('delete', () => {
    it('should delete a chat', async () => {
      chatService.delete.mockResolvedValue({ id: 1 });

      const result = await controller.delete(1);

      expect(chatService.delete).toHaveBeenCalledWith(1);
      expect(result).toEqual({ id: 1 });
    });
  });
});
