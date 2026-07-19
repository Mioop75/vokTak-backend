import { PrismaService } from '@/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import { RolesService } from './roles.service';

describe('RolesService', () => {
  let service: RolesService;
  let prisma: {
    role: {
      findMany: jest.Mock;
      createMany: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      role: {
        findMany: jest.fn(),
        createMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createRoles', () => {
    it('should create roles if none exist', async () => {
      prisma.role.findMany.mockResolvedValue([]);
      prisma.role.createMany.mockResolvedValue({ count: 2 });

      const result = await service.createRoles();

      expect(prisma.role.findMany).toHaveBeenCalled();
      expect(prisma.role.createMany).toHaveBeenCalledWith({
        data: [{ name: 'User' }, { name: 'Admin' }],
        skipDuplicates: true,
      });
    });

    it('should not create roles if they already exist', async () => {
      prisma.role.findMany.mockResolvedValue([
        { id: 1, name: 'User' },
        { id: 2, name: 'Admin' },
      ]);

      const result = await service.createRoles();

      expect(prisma.role.findMany).toHaveBeenCalled();
      expect(prisma.role.createMany).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe('onModuleInit', () => {
    it('should call createRoles on module init', async () => {
      prisma.role.findMany.mockResolvedValue([]);

      await service.onModuleInit();

      expect(prisma.role.createMany).toHaveBeenCalled();
    });
  });
});
