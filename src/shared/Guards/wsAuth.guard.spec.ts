import { PrismaService } from '@/prisma.service';
import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WsAuthGuard } from './wsAuth.guard';

describe('WsAuthGuard', () => {
  let guard: WsAuthGuard;
  let prisma: {
    user: {
      findUniqueOrThrow: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUniqueOrThrow: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WsAuthGuard,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    guard = module.get<WsAuthGuard>(WsAuthGuard);
  });

  function createMockWsContext(userUuid: string | undefined): ExecutionContext {
    return {
      switchToWs: () => ({
        getClient: () => ({
          handshake: {
            query: {
              user_uuid: userUuid,
            },
          },
        }),
      }),
    } as any;
  }

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true when user exists', async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValue({
        uuid: 'valid-uuid',
        email: 'test@test.com',
      });

      const context = createMockWsContext('valid-uuid');

      const result = await guard.canActivate(context);

      expect(prisma.user.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { uuid: 'valid-uuid' },
      });
      expect(result).toBe(true);
    });

    it('should return false when user does not exist', async () => {
      prisma.user.findUniqueOrThrow.mockRejectedValue(
        new Error('Not found'),
      );

      const context = createMockWsContext('invalid-uuid');

      const result = await guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should return false when user_uuid is undefined', async () => {
      prisma.user.findUniqueOrThrow.mockRejectedValue(
        new Error('Not found'),
      );

      const context = createMockWsContext(undefined);

      const result = await guard.canActivate(context);

      expect(result).toBe(false);
    });
  });
});
