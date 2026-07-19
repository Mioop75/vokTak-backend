import { PrismaService } from '@/prisma.service';
import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let prisma: {
    session: {
      findUniqueOrThrow: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      session: {
        findUniqueOrThrow: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
  });

  function createMockContext(signedCookie: string | undefined): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          signedCookies: {
            sid: signedCookie,
          },
        }),
      }),
    } as any;
  }

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true when session exists', async () => {
      prisma.session.findUniqueOrThrow.mockResolvedValue({
        sid: 'valid-sid',
        user_uuid: 'user-uuid',
      });

      const context = createMockContext('valid-sid');

      const result = await guard.canActivate(context);

      expect(prisma.session.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { sid: 'valid-sid' },
      });
      expect(result).toBe(true);
    });

    it('should return false when session does not exist', async () => {
      prisma.session.findUniqueOrThrow.mockRejectedValue(
        new Error('Not found'),
      );

      const context = createMockContext('invalid-sid');

      const result = await guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should return false when sid is undefined', async () => {
      prisma.session.findUniqueOrThrow.mockRejectedValue(
        new Error('Not found'),
      );

      const context = createMockContext(undefined);

      const result = await guard.canActivate(context);

      expect(result).toBe(false);
    });
  });
});
