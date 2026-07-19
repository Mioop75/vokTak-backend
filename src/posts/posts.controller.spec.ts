import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { AuthGuard } from '@/shared/Guards/auth.guard';
import { PrismaService } from '@/prisma.service';

describe('PostsController', () => {
  let controller: PostsController;
  let postsService: {
    getAll: jest.Mock;
    getOne: jest.Mock;
    create: jest.Mock;
    uploadImage: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    hidePost: jest.Mock;
    unhidePost: jest.Mock;
    likePost: jest.Mock;
    unlikePost: jest.Mock;
  };
  let cacheService: {
    set: jest.Mock;
    del: jest.Mock;
  };

  beforeEach(async () => {
    postsService = {
      getAll: jest.fn(),
      getOne: jest.fn(),
      create: jest.fn(),
      uploadImage: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      hidePost: jest.fn(),
      unhidePost: jest.fn(),
      likePost: jest.fn(),
      unlikePost: jest.fn(),
    };
    cacheService = {
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [
        { provide: PostsService, useValue: postsService },
        { provide: CACHE_MANAGER, useValue: cacheService },
        { provide: PrismaService, useValue: {} },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PostsController>(PostsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAll', () => {
    it('should return paginated posts', async () => {
      const mockResult = {
        posts: [
          { uuid: 'post-1', content: 'Hello' },
          { uuid: 'post-2', content: 'World' },
        ],
        total: 2,
        page: 0,
        size: 10,
      };
      postsService.getAll.mockResolvedValue(mockResult);

      const result = await controller.getAll({
        page: 0,
        limit: 10,
        size: 10,
        offset: 0,
      });

      expect(postsService.getAll).toHaveBeenCalledWith({
        page: 0,
        limit: 10,
        size: 10,
        offset: 0,
      });
      expect(cacheService.set).toHaveBeenCalledWith('posts', mockResult.posts);
    });
  });

  describe('getOne', () => {
    it('should return a post by uuid', async () => {
      const mockPost = {
        uuid: 'post-uuid',
        content: 'Test',
        author: {},
        comments: [],
        likes: [],
        photos: [],
      };
      postsService.getOne.mockResolvedValue(mockPost);

      const result = await controller.getOne('post-uuid');

      expect(postsService.getOne).toHaveBeenCalledWith('post-uuid');
      expect(cacheService.set).toHaveBeenCalledWith('post/post-uuid', mockPost);
    });
  });

  describe('create', () => {
    it('should create a post', async () => {
      const dto = { content: 'New post', hidden: false, photoIds: [] };
      const mockPost = { uuid: 'new-uuid', ...dto };
      postsService.create.mockResolvedValue(mockPost);

      const result = await controller.create('user-uuid', dto);

      expect(postsService.create).toHaveBeenCalledWith('user-uuid', dto);
    });
  });

  describe('uploadImage', () => {
    it('should upload image', async () => {
      const mockFile = { path: 'uploads/img.jpg', filename: 'img.jpg' };
      const mockPhoto = { id: 1, name: 'img.jpg', image: 'uploads/img.jpg' };
      postsService.uploadImage.mockResolvedValue(mockPhoto);

      const result = await controller.uploadImage('user-uuid', mockFile as any);

      expect(postsService.uploadImage).toHaveBeenCalledWith(
        'user-uuid',
        mockFile,
      );
    });
  });

  describe('update', () => {
    it('should update post and clear cache', async () => {
      const dto = { content: 'Updated', hidden: false };
      const mockPost = { uuid: 'post-uuid', ...dto };
      postsService.update.mockResolvedValue(mockPost);

      const result = await controller.update('user-uuid', 'post-uuid', dto as any);

      expect(postsService.update).toHaveBeenCalledWith(
        'user-uuid',
        'post-uuid',
        dto,
      );
      expect(cacheService.del).toHaveBeenCalledWith('posts');
      expect(cacheService.del).toHaveBeenCalledWith('post/post-uuid');
    });
  });

  describe('delete', () => {
    it('should delete post and clear cache', async () => {
      postsService.delete.mockResolvedValue({ uuid: 'post-uuid' });

      const result = await controller.delete('post-uuid');

      expect(postsService.delete).toHaveBeenCalledWith('post-uuid');
      expect(cacheService.del).toHaveBeenCalledWith('posts');
      expect(cacheService.del).toHaveBeenCalledWith('post/post-uuid');
    });
  });

  describe('hidePost', () => {
    it('should hide a post', async () => {
      postsService.hidePost.mockResolvedValue({
        uuid: 'post-uuid',
        hidden: true,
      });

      const result = await controller.hidePost('post-uuid');

      expect(postsService.hidePost).toHaveBeenCalledWith('post-uuid');
    });
  });

  describe('unhidePost', () => {
    it('should unhide a post', async () => {
      postsService.unhidePost.mockResolvedValue({
        uuid: 'post-uuid',
        hidden: false,
      });

      const result = await controller.unhidePost('post-uuid');

      expect(postsService.unhidePost).toHaveBeenCalledWith('post-uuid');
    });
  });

  describe('likePost', () => {
    it('should like a post', async () => {
      postsService.likePost.mockResolvedValue({ uuid: 'post-uuid' });

      const result = await controller.likePost('post-uuid', 'user-uuid');

      expect(postsService.likePost).toHaveBeenCalledWith('post-uuid', 'user-uuid');
    });
  });

  describe('unlikePost', () => {
    it('should unlike a post', async () => {
      postsService.unlikePost.mockResolvedValue({ id: 1 });

      const result = await controller.unlikePost('post-uuid', 'user-uuid');

      expect(postsService.unlikePost).toHaveBeenCalledWith(
        'post-uuid',
        'user-uuid',
      );
    });
  });
});
