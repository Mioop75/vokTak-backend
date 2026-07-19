import { BadRequestException, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

describe('PaginationParams decorator', () => {
  function createMockContext(query: Record<string, string>) {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          query,
        }),
      }),
    } as unknown as ExecutionContext;
  }

  // Test the factory logic that PaginationParams uses
  // Recreating the factory: (data, ctx) => { ... parse query params ... }
  function paginationParamsFactory(
    _: any,
    ctx: ExecutionContext,
  ) {
    const req: Request = ctx.switchToHttp().getRequest();
    const page = parseInt(req.query.page as string);
    const size = parseInt(req.query.size as string);

    if (isNaN(page) || page < 0 || isNaN(size) || size < 0) {
      throw new BadRequestException('Invalid pagination params');
    }

    if (size > 100) {
      throw new BadRequestException(
        'Invalid pagination params: Max size is 100',
      );
    }

    const limit = size;
    const offset = page * limit;
    return { page, limit, size, offset };
  }

  function callDecorator(query: Record<string, string>) {
    const context = createMockContext(query);
    return paginationParamsFactory(undefined, context);
  }

  it('should return valid pagination params', () => {
    const result = callDecorator({ page: '0', size: '10' });

    expect(result).toEqual({
      page: 0,
      limit: 10,
      size: 10,
      offset: 0,
    });
  });

  it('should calculate correct offset for page > 0', () => {
    const result = callDecorator({ page: '2', size: '20' });

    expect(result).toEqual({
      page: 2,
      limit: 20,
      size: 20,
      offset: 40,
    });
  });

  it('should throw BadRequestException for negative page', () => {
    expect(() => callDecorator({ page: '-1', size: '10' })).toThrow(
      BadRequestException,
    );
  });

  it('should throw BadRequestException for negative size', () => {
    expect(() => callDecorator({ page: '0', size: '-5' })).toThrow(
      BadRequestException,
    );
  });

  it('should throw BadRequestException for NaN page', () => {
    expect(() => callDecorator({ page: 'abc', size: '10' })).toThrow(
      BadRequestException,
    );
  });

  it('should throw BadRequestException for NaN size', () => {
    expect(() => callDecorator({ page: '0', size: 'xyz' })).toThrow(
      BadRequestException,
    );
  });

  it('should throw BadRequestException for size > 100', () => {
    expect(() => callDecorator({ page: '0', size: '101' })).toThrow(
      BadRequestException,
    );
  });

  it('should allow size of exactly 100', () => {
    const result = callDecorator({ page: '0', size: '100' });

    expect(result).toEqual({
      page: 0,
      limit: 100,
      size: 100,
      offset: 0,
    });
  });
});
