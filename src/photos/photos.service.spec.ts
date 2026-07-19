import { PrismaService } from '@/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PhotosService } from './photos.service';

jest.mock('fs/promises', () => ({
  unlink: jest.fn().mockResolvedValue(undefined),
}));

describe('PhotosService', () => {
  let service: PhotosService;
  let prisma: {
    photo: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      photo: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PhotosService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<PhotosService>(PhotosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPhotos', () => {
    it('should return all photos for a user', async () => {
      const mockPhotos = [
        { id: 1, name: 'photo1.jpg', image: 'uploads/photo1.jpg' },
        { id: 2, name: 'photo2.jpg', image: 'uploads/photo2.jpg' },
      ];
      prisma.photo.findMany.mockResolvedValue(mockPhotos);

      const result = await service.getPhotos('user-uuid');

      expect(prisma.photo.findMany).toHaveBeenCalledWith({
        where: { user_uuid: 'user-uuid' },
      });
      expect(result).toEqual(mockPhotos);
    });
  });

  describe('getPhoto', () => {
    it('should return a photo by id', async () => {
      const mockPhoto = { id: 1, name: 'photo.jpg', image: 'uploads/photo.jpg' };
      prisma.photo.findFirst.mockResolvedValue(mockPhoto);

      const result = await service.getPhoto(1);

      expect(prisma.photo.findFirst).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockPhoto);
    });

    it('should throw NotFoundException when photo is not found', async () => {
      prisma.photo.findFirst.mockResolvedValue(null);

      await expect(service.getPhoto(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('addPhoto', () => {
    it('should create a photo', async () => {
      const dto = {
        name: 'photo.jpg',
        image: 'uploads/photo.jpg',
        hidden: false,
      };
      const mockPhoto = { id: 1, ...dto, user_uuid: 'user-uuid' };
      prisma.photo.create.mockResolvedValue(mockPhoto);

      const result = await service.addPhoto(dto, 'user-uuid');

      expect(prisma.photo.create).toHaveBeenCalledWith({
        data: { ...dto, user_uuid: 'user-uuid' },
      });
      expect(result).toEqual(mockPhoto);
    });
  });

  describe('deletePhoto', () => {
    it('should delete a photo and unlink the file', async () => {
      const mockPhoto = { id: 1, image: 'uploads/photo.jpg' };
      prisma.photo.findFirst.mockResolvedValue(mockPhoto);
      prisma.photo.delete.mockResolvedValue(mockPhoto);

      const result = await service.deletePhoto(1);

      const { unlink } = require('fs/promises');
      expect(unlink).toHaveBeenCalledWith('uploads/photo.jpg');
      expect(prisma.photo.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  describe('hidePhoto', () => {
    it('should hide a photo', async () => {
      const mockPhoto = { id: 1, name: 'photo.jpg', image: 'uploads/photo.jpg' };
      prisma.photo.findFirst.mockResolvedValue(mockPhoto);
      prisma.photo.update.mockResolvedValue({});

      const result = await service.hidePhoto(1);

      expect(prisma.photo.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { hidden: true },
      });
      expect(result).toBe('Photo was hidden');
    });

    it('should throw NotFoundException if photo not found', async () => {
      prisma.photo.findFirst.mockResolvedValue(null);

      await expect(service.hidePhoto(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('unhidePhoto', () => {
    it('should unhide a photo', async () => {
      const mockPhoto = { id: 1, name: 'photo.jpg', image: 'uploads/photo.jpg' };
      prisma.photo.findFirst.mockResolvedValue(mockPhoto);
      prisma.photo.update.mockResolvedValue({});

      const result = await service.unhidePhoto(1);

      expect(prisma.photo.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { hidden: false },
      });
      expect(result).toBe('Photo was unhidden');
    });
  });
});
