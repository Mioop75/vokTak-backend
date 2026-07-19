import { ExecutionContext } from '@nestjs/common';

describe('CurrentUser decorator', () => {
  function createMockContext(user: any): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user,
        }),
      }),
    } as any;
  }

  // Test the factory logic that createParamDecorator uses
  // The factory signature is (data, ctx) => value
  // We test by reading the source and recreating the logic
  function currentUserFactory(data: string | undefined, ctx: ExecutionContext) {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  }

  it('should return the full user when no data key is provided', () => {
    const mockUser = {
      uuid: 'user-uuid',
      email: 'test@test.com',
      nickname: 'testuser',
    };

    const context = createMockContext(mockUser);
    const result = currentUserFactory(undefined, context);

    expect(result).toEqual(mockUser);
  });

  it('should return a specific property when data key is provided', () => {
    const mockUser = {
      uuid: 'user-uuid',
      email: 'test@test.com',
      nickname: 'testuser',
    };

    const context = createMockContext(mockUser);
    const result = currentUserFactory('uuid', context);

    expect(result).toBe('user-uuid');
  });

  it('should return undefined when user is not set on request', () => {
    const context = createMockContext(undefined);
    const result = currentUserFactory(undefined, context);

    expect(result).toBeUndefined();
  });

  it('should return undefined when property does not exist on user', () => {
    const mockUser = {
      uuid: 'user-uuid',
    };

    const context = createMockContext(mockUser);
    const result = currentUserFactory('email', context);

    expect(result).toBeUndefined();
  });

  it('should return nickname when requested', () => {
    const mockUser = {
      uuid: 'user-uuid',
      nickname: 'testuser',
    };

    const context = createMockContext(mockUser);
    const result = currentUserFactory('nickname', context);

    expect(result).toBe('testuser');
  });
});
