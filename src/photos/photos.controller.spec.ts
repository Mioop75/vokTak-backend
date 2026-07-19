import { Test, TestingModule } from '@nestjs/testing';
import { PhotosController } from './photos.controller';
import { PhotosService } from './photos.service';
import { AuthGuard } from '@/shared/Guards/auth.guard';
import { PrismaService } from '@/prisma.service';

describe('PhotosController', () => {
  let controller: PhotosController;
  let photosService: {
    getPhotos: jest.Mock;
    getPhoto: jest.Mock;
    addPhoto: jest.Mock;
    deletePhoto: jest.Mock;
    hidePhoto: jest.Mock;
    unhidePhoto: jest.Mock;
  };

  beforeEach(async () => {
    photosService = {
      getPhotos: jest.fn(),
      getPhoto: jest.fn(),
      addPhoto: jest.fn(),
      deletePhoto: jest.fn(),
      hidePhoto: jest.fn(),
      unhidePhoto: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PhotosController],
      providers: [
        { provide: PhotosService, useValue: photosService },
        { provide: PrismaService, useValue: {} },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PhotosController>(PhotosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getPhotos', () => {
    it('should return all photos for current user', async () => {
      const mockPhotos = [
        { id: 1, name: 'photo1.jpg', image: 'uploads/1.jpg' },
        { id: 2, name: 'photo2.jpg', image: 'uploads/2.jpg' },
      ];
      photosService.getPhotos.mockResolvedValue(mockPhotos);

      const result = await controller.getPhotos('user-uuid');

      expect(photosService.getPhotos).toHaveBeenCalledWith('user-uuid');
    });
  });

  describe('getPhoto', () => {
    it('should return a photo by id', async () => {
      const mockPhoto = { id: 1, name: 'photo.jpg', image: 'uploads/photo.jpg' };
      photosService.getPhoto.mockResolvedValue(mockPhoto);

      const result = await controller.getPhoto(1);

      expect(photosService.getPhoto).toHaveBeenCalledWith(1);
    });
  });

  describe('addPhoto', () => {
    it('should add a photo', async () => {
      const mockFile = { path: 'uploads/photo.jpg', filename: 'photo.jpg' };
      const mockPhoto = { id: 1, name: 'photo.jpg', image: 'uploads/photo.jpg' };
      photosService.addPhoto.mockResolvedValue(mockPhoto);

      const result = await controller.addPhoto(
        { name: 'photo.jpg', alt: 'test', hidden: false },
        mockFile as any,
        'user-uuid',
      );

      expect(photosService.addPhoto).toHaveBeenCalledWith(
        {
          name: 'photo.jpg',
          image: 'uploads/photo.jpg',
          hidden: false,
        },
        'user-uuid',
      );
    });
  });

  describe('deletePhoto', () => {
    it('should delete a photo', async () => {
      const mockPhoto = { id: 1, name: 'photo.jpg', image: 'uploads/photo.jpg' };
      photosService.deletePhoto.mockResolvedValue(mockPhoto);

      await controller.deletePhoto(1);

      expect(photosService.deletePhoto).toHaveBeenCalledWith(1);
    });
  });

  describe('hidePhoto', () => {
    it('should hide a photo', async () => {
      photosService.hidePhoto.mockResolvedValue('Photo was hidden');

      const result = await controller.hidePhoto(1);

      expect(photosService.hidePhoto).toHaveBeenCalledWith(1);
      expect(result).toBe('Photo was hidden');
    });
  });

  describe('unhidePhoto', () => {
    it('should unhide a photo', async () => {
      photosService.unhidePhoto.mockResolvedValue('Photo was unhidden');

      const result = await controller.unhidePhoto(1);

      expect(photosService.unhidePhoto).toHaveBeenCalledWith(1);
      expect(result).toBe('Photo was unhidden');
    });
  });
});
