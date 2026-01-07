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
    // Select Chain Mocks
    const mockSelect = vi.fn();
    const mockFrom = vi.fn();
    const mockLeftJoin = vi.fn();
    const mockWhere = vi.fn();
    const mockGroupBy = vi.fn();
    const mockOrderBy = vi.fn();
    const mockLimit = vi.fn();
    const mockOffset = vi.fn();

    // Insert Chain Mocks
    const mockInsert = vi.fn();
    const mockValues = vi.fn();
    const mockReturning = vi.fn();
    const mockOnConflictDoNothing = vi.fn();
    const mockExecute = vi.fn();

    // Update Chain Mocks
    const mockUpdate = vi.fn();
    const mockSet = vi.fn();

    /**
     * Sets up the chainable query builder with default return values.
     * Call this in beforeEach to reset the chain.
     */
    const setupDbMock = () => {
        // Select Chain
        mockSelect.mockReturnValue({ from: mockFrom });
        mockFrom.mockReturnValue({
            leftJoin: mockLeftJoin,
            groupBy: mockGroupBy,
            orderBy: mockOrderBy,
        });
        mockLeftJoin.mockReturnValue({ where: mockWhere });
        mockWhere.mockReturnValue({ orderBy: mockOrderBy });
        mockGroupBy.mockReturnValue({ orderBy: mockOrderBy });
        mockOrderBy.mockReturnValue({ limit: mockLimit });
        mockLimit.mockReturnValue({ offset: mockOffset });
        mockOffset.mockResolvedValue([]);

        // Insert Chain
        mockInsert.mockReturnValue({ values: mockValues });
        mockValues.mockReturnValue({
            returning: mockReturning,
            onConflictDoNothing: mockOnConflictDoNothing
        });
        mockReturning.mockResolvedValue([]);
        mockOnConflictDoNothing.mockReturnValue({ execute: mockExecute });
        mockExecute.mockResolvedValue(undefined);

        // Update Chain
        mockUpdate.mockReturnValue({ set: mockSet });
        mockSet.mockReturnValue({ where: mockWhere });

        // Versatile Where for update chaining (thenable)
        const thenableWhere = {
            orderBy: mockOrderBy,
            then: (resolve: (value?: unknown) => void) => Promise.resolve().then(resolve)
        };
        mockWhere.mockReturnValue(thenableWhere);
    };

    return {
        mockSelect,
        mockFrom,
        mockLeftJoin,
        mockWhere,
        mockGroupBy,
        mockOrderBy,
        mockLimit,
        mockOffset,

        mockInsert,
        mockValues,
        mockReturning,
        mockOnConflictDoNothing,
        mockExecute,

        mockUpdate,
        mockSet,

        setupDbMock,
    };
}
