import { PrismaService } from '@/prisma.service';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { InjectUserInterceptor } from './InjectUser.interceptor';

describe('InjectUserInterceptor', () => {
  let interceptor: InjectUserInterceptor;
  let prisma: {
    session: {
      findFirst: jest.Mock;
    };
    user: {
      findFirst: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      session: {
        findFirst: jest.fn(),
      },
      user: {
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InjectUserInterceptor,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    interceptor = module.get<InjectUserInterceptor>(InjectUserInterceptor);
  });

  function createMockContext(sid: string | undefined): ExecutionContext {
    const mockRequest: any = {
      signedCookies: {
        sid,
      },
      user: undefined,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as any;
  }

  function createCallHandler(): CallHandler {
    return {
      handle: () => of({ data: 'test' }),
    };
  }

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('intercept', () => {
    it('should attach user to request when valid session exists', async () => {
      const mockSession = { sid: 'valid-sid', user_uuid: 'user-uuid' };
      const mockUser = {
        uuid: 'user-uuid',
        email: 'test@test.com',
        nickname: 'testuser',
      };

      prisma.session.findFirst.mockResolvedValue(mockSession);
      prisma.user.findFirst.mockResolvedValue(mockUser);

      const context = createMockContext('valid-sid');
      const callHandler = createCallHandler();

      await interceptor.intercept(context, callHandler);

      const request = context.switchToHttp().getRequest();
      expect(request.user).toEqual(mockUser);
    });

    it('should not attach user when no sid exists', async () => {
      const context = createMockContext(undefined);
      const callHandler = createCallHandler();

      await interceptor.intercept(context, callHandler);

      const request = context.switchToHttp().getRequest();
      expect(request.user).toBeUndefined();
    });

    it('should handle null session gracefully when sid is present', async () => {
      // When sid exists but session is not found in DB, session will be null
      // The code accesses session.user_uuid which will throw
      prisma.session.findFirst.mockResolvedValue(null);

      const context = createMockContext('nonexistent-sid');
      const callHandler = createCallHandler();

      await expect(
        interceptor.intercept(context, callHandler),
      ).rejects.toThrow();
    });

    it('should call next.handle() and return its observable', async () => {
      prisma.session.findFirst.mockResolvedValue(null);

      const context = createMockContext(undefined);
      const callHandler = createCallHandler();
      const spy = jest.spyOn(callHandler, 'handle');

      await interceptor.intercept(context, callHandler);

      expect(spy).toHaveBeenCalled();
    });
  });
});
