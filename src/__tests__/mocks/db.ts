import { vi } from 'vitest';

export type QueryBuilderMock = {
    select: ReturnType<typeof vi.fn>;
    from: ReturnType<typeof vi.fn>;
    leftJoin: ReturnType<typeof vi.fn>;
    where: ReturnType<typeof vi.fn>;
    orderBy: ReturnType<typeof vi.fn>;
    limit: ReturnType<typeof vi.fn>;
    offset: ReturnType<typeof vi.fn>;
};

export const createMockQueryBuilder = () => {
    const select = vi.fn();
    const from = vi.fn();
    const leftJoin = vi.fn();
    const where = vi.fn();
    const orderBy = vi.fn();
    const limit = vi.fn();
    const offset = vi.fn();

    const builder: QueryBuilderMock = {
        select,
        from,
        leftJoin,
        where,
        orderBy,
        limit,
        offset,
    };

    // Setup default chain behavior
    select.mockReturnValue(builder);
    from.mockReturnValue(builder);
    leftJoin.mockReturnValue(builder);
    where.mockReturnValue(builder);
    orderBy.mockReturnValue(builder);
    limit.mockReturnValue(builder);
    offset.mockResolvedValue([]);

    return builder;
};

// Singleton instance for simple tests
export const mockQueryBuilder = createMockQueryBuilder();
