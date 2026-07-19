import { Test, TestingModule } from '@nestjs/testing';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { AuthGuard } from '@/shared/Guards/auth.guard';
import { PrismaService } from '@/prisma.service';

describe('CommentsController', () => {
  let controller: CommentsController;
  let commentsService: {
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(async () => {
    commentsService = {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentsController],
      providers: [
        { provide: CommentsService, useValue: commentsService },
        { provide: PrismaService, useValue: {} },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<CommentsController>(CommentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a comment', async () => {
      const dto = { post_uuid: 'post-uuid', message: 'Great post!' };
      commentsService.create.mockResolvedValue('Comment was added');

      const result = await controller.create('user-uuid', dto);

      expect(commentsService.create).toHaveBeenCalledWith('user-uuid', dto);
      expect(result).toBe('Comment was added');
    });
  });

  describe('update', () => {
    it('should update a comment', async () => {
      const dto = { post_uuid: 'post-uuid', message: 'Updated' };
      commentsService.update.mockResolvedValue('Comment was updated');

      const result = await controller.update(1, dto);

      expect(commentsService.update).toHaveBeenCalledWith(1, dto);
      expect(result).toBe('Comment was updated');
    });
  });

  describe('delete', () => {
    it('should delete a comment', async () => {
      commentsService.delete.mockResolvedValue('Comment was deleted');

      const result = await controller.delete(1);

      expect(commentsService.delete).toHaveBeenCalledWith(1);
      expect(result).toBe('Comment was deleted');
    });
  });
});
