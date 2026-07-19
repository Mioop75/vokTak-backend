import { PrismaService } from '@/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PhotosService } from '../photos/photos.service';
import { PostsService } from './posts.service';

describe('PostsService', () => {
  let service: PostsService;
  let prisma: {
    post: {
      findMany: jest.Mock;
      findFirstOrThrow: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    like: {
      delete: jest.Mock;
    };
  };
  let photosService: {
    addPhoto: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      post: {
        findMany: jest.fn(),
        findFirstOrThrow: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      like: {
        delete: jest.fn(),
      },
    };
    photosService = {
      addPhoto: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: PrismaService, useValue: prisma },
        { provide: PhotosService, useValue: photosService },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAll', () => {
    it('should return paginated posts', async () => {
      const mockPosts = [
        { uuid: 'post-1', content: 'Hello' },
        { uuid: 'post-2', content: 'World' },
      ];
      prisma.post.findMany.mockResolvedValue(mockPosts);

      const result = await service.getAll({
        page: 0,
        limit: 10,
        size: 10,
        offset: 0,
      });

      expect(prisma.post.findMany).toHaveBeenCalledWith({
        take: 10,
        skip: 0,
        select: expect.objectContaining({ uuid: true }),
        orderBy: { created_at: 'desc' },
      });
      expect(result).toEqual({
        posts: mockPosts,
        total: 2,
        page: 0,
        size: 10,
      });
    });
  });

  describe('getOne', () => {
    it('should return a post by uuid', async () => {
      const mockPost = {
        uuid: 'post-uuid',
        content: 'Test post',
        author: { uuid: 'user-uuid' },
        comments: [],
        likes: [],
        photos: [],
      };
      prisma.post.findFirstOrThrow.mockResolvedValue(mockPost);

      const result = await service.getOne('post-uuid');

      expect(result).toEqual(mockPost);
    });

    it('should throw NotFoundException when post is not found', async () => {
      prisma.post.findFirstOrThrow.mockRejectedValue(new Error('Not found'));

      await expect(service.getOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a new post', async () => {
      const dto = {
        content: 'New post',
        hidden: false,
        photoIds: [1, 2],
      };
      const mockPost = {
        uuid: 'new-uuid',
        ...dto,
        photos: [{ id: 1 }, { id: 2 }],
      };

      prisma.post.create.mockResolvedValue(mockPost);

      const result = await service.create('user-uuid', dto);

      expect(prisma.post.create).toHaveBeenCalledWith({
        data: {
          user_uuid: 'user-uuid',
          photos: {
            connect: [{ id: 1 }, { id: 2 }],
          },
          content: 'New post',
          hidden: false,
        },
        include: { photos: true },
      });
      expect(result).toEqual(mockPost);
    });
  });

  describe('update', () => {
    it('should update a post', async () => {
      const dto = { content: 'Updated', hidden: false };
      const mockPost = { uuid: 'post-uuid', ...dto };

      prisma.post.update.mockResolvedValue(mockPost);

      const result = await service.update('user-uuid', 'post-uuid', dto as any);

      expect(prisma.post.update).toHaveBeenCalledWith({
        where: { uuid: 'post-uuid' },
        data: { user_uuid: 'user-uuid', content: 'Updated', hidden: false },
      });
      expect(result).toEqual(mockPost);
    });
  });

  describe('delete', () => {
    it('should delete a post', async () => {
      prisma.post.delete.mockResolvedValue({ uuid: 'post-uuid' });

      const result = await service.delete('post-uuid');

      expect(prisma.post.delete).toHaveBeenCalledWith({
        where: { uuid: 'post-uuid' },
      });
      expect(result).toEqual({ uuid: 'post-uuid' });
    });
  });

  describe('uploadImage', () => {
    it('should upload image via PhotosService', async () => {
      const mockFile = {
        path: 'uploads\\posts\\images\\2024\\10\\img.jpg',
        filename: 'img.jpg',
      };

      const mockPhoto = { id: 1, name: 'img.jpg', image: 'uploads/posts/images/2024/10/img.jpg' };
      photosService.addPhoto.mockResolvedValue(mockPhoto);

      const result = await service.uploadImage('user-uuid', mockFile as any);

      expect(photosService.addPhoto).toHaveBeenCalledWith(
        {
          image: 'uploads/posts/images/2024/10/img.jpg',
          name: 'img.jpg',
          hidden: false,
        },
        'user-uuid',
      );
      expect(result).toEqual(mockPhoto);
    });
  });

  describe('hidePost', () => {
    it('should set hidden to true', async () => {
      prisma.post.update.mockResolvedValue({ uuid: 'post-uuid', hidden: true });

      const result = await service.hidePost('post-uuid');

      expect(prisma.post.update).toHaveBeenCalledWith({
        where: { uuid: 'post-uuid' },
        data: { hidden: true },
      });
    });
  });

  describe('unhidePost', () => {
    it('should set hidden to false', async () => {
      prisma.post.update.mockResolvedValue({ uuid: 'post-uuid', hidden: false });

      const result = await service.unhidePost('post-uuid');

      expect(prisma.post.update).toHaveBeenCalledWith({
        where: { uuid: 'post-uuid' },
        data: { hidden: false },
      });
    });
  });

  describe('likePost', () => {
    it('should create a like on a post', async () => {
      prisma.post.update.mockResolvedValue({ uuid: 'post-uuid' });

      const result = await service.likePost('post-uuid', 'user-uuid');

      expect(prisma.post.update).toHaveBeenCalledWith({
        where: { uuid: 'post-uuid' },
        data: { likes: { create: { user_uuid: 'user-uuid' } } },
      });
    });
  });

  describe('unlikePost', () => {
    it('should delete the like', async () => {
      prisma.post.findFirst.mockResolvedValue({
        uuid: 'post-uuid',
        likes: [{ id: 1, user_uuid: 'user-uuid' }],
      });
      prisma.like.delete.mockResolvedValue({ id: 1 });

      const result = await service.unlikePost('post-uuid', 'user-uuid');

      expect(prisma.post.findFirst).toHaveBeenCalledWith({
        where: { uuid: 'post-uuid' },
        select: { likes: true },
      });
      expect(prisma.like.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });
});
