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
    const mockInsert = vi.fn();
    const mockValues = vi.fn();
    const mockReturning = vi.fn();
    const mockOnConflictDoNothing = vi.fn();
    const mockExecute = vi.fn();

    const mockUpdate = vi.fn();
    const mockSet = vi.fn();
    // mockWhere is already defined and can be reused

    /**
     * Sets up the chainable query builder with default return values.
     * Call this in beforeEach to reset the chain.
     */
    const setupDbMock = () => {
        // Select Chain
        mockSelect.mockReturnValue({ from: mockFrom });
        mockFrom.mockReturnValue({ leftJoin: mockLeftJoin });
        mockLeftJoin.mockReturnValue({ where: mockWhere });
        mockWhere.mockReturnValue({ orderBy: mockOrderBy });
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
        // mockWhere already mocked above, but we need to ensure it handles promise return for update
        // We'll treat mockWhere as returning a Promise by default for update calls if it's the end of chain
        // But in select chain it returns an object. This is a potential conflict.
        // Drizzle's where() in select returns a query builder.
        // Drizzle's where() in update returns a Promise (or is thenable).

        // Let's make mockWhere versatile.
        // For strict typing we might need separate mocks, but for jest/vitest mocks we can return an object that is also thenable.
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
