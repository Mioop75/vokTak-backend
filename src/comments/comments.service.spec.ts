import { PrismaService } from '@/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import { CommentsService } from './comments.service';

describe('CommentsService', () => {
  let service: CommentsService;
  let prisma: {
    comment: {
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      comment: {
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a comment and return success message', async () => {
      const dto = { post_uuid: 'post-uuid', message: 'Nice post!' };
      prisma.comment.create.mockResolvedValue({
        id: 1,
        message: 'Nice post!',
        post: { uuid: 'post-uuid' },
        author: { uuid: 'user-uuid' },
      });

      const result = await service.create('user-uuid', dto);

      expect(prisma.comment.create).toHaveBeenCalledWith({
        data: {
          post_uuid: 'post-uuid',
          message: 'Nice post!',
          user_uuid: 'user-uuid',
        },
        include: {
          post: true,
          author: true,
        },
      });
      expect(result).toBe('Comment was added');
    });
  });

  describe('update', () => {
    it('should update a comment and return success message', async () => {
      const dto = { post_uuid: 'post-uuid', message: 'Updated message' };
      prisma.comment.update.mockResolvedValue({ id: 1 });

      const result = await service.update(1, dto);

      expect(prisma.comment.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { message: 'Updated message' },
      });
      expect(result).toBe('Comment was updated');
    });
  });

  describe('delete', () => {
    it('should delete a comment and return success message', async () => {
      prisma.comment.delete.mockResolvedValue({ id: 1 });

      const result = await service.delete(1);

      expect(prisma.comment.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toBe('Comment was deleted');
    });
  });
});
