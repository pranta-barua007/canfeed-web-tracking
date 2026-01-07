import { vi } from 'vitest';

/**
 * Creates a reusable mock for Drizzle ORM's query builder chain.
 * Returns individual mock functions that can be customized per test.
 * 
 * @example
 * ```ts
 * const { mockSelect, mockFrom, mockOffset, setupDbMock } = createDbQueryMock();
 * 
 * beforeEach(() => {
 *   vi.clearAllMocks();
 *   setupDbMock();
 * });
 * 
 * it('test', async () => {
 *   mockOffset.mockResolvedValue([{ id: '1' }]);
 *   // ... test code
 * });
 * ```
 */
export function createDbQueryMock() {
    const mockSelect = vi.fn();
    const mockFrom = vi.fn();
    const mockLeftJoin = vi.fn();
    const mockWhere = vi.fn();
    const mockOrderBy = vi.fn();
    const mockLimit = vi.fn();
    const mockOffset = vi.fn();

    /**
     * Sets up the chainable query builder with default return values.
     * Call this in beforeEach to reset the chain.
     */
    const setupDbMock = () => {
        mockSelect.mockReturnValue({ from: mockFrom });
        mockFrom.mockReturnValue({ leftJoin: mockLeftJoin });
        mockLeftJoin.mockReturnValue({ where: mockWhere });
        mockWhere.mockReturnValue({ orderBy: mockOrderBy });
        mockOrderBy.mockReturnValue({ limit: mockLimit });
        mockLimit.mockReturnValue({ offset: mockOffset });
        mockOffset.mockResolvedValue([]);
    };

    return {
        mockSelect,
        mockFrom,
        mockLeftJoin,
        mockWhere,
        mockOrderBy,
        mockLimit,
        mockOffset,
        setupDbMock,
    };
}
