import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getGroupedWorkspaces } from '../../../features/dashboard/services';
import { db } from '@/db';
import { createDbQueryMock } from '../../mocks/dbMock';

vi.mock('server-only', () => ({}));
vi.mock('@/db');

describe('Dashboard Services', () => {
    const {
        mockSelect,
        mockFrom,
        mockGroupBy,
        mockOrderBy,
        setupDbMock
    } = createDbQueryMock();

    beforeEach(() => {
        vi.clearAllMocks();
        setupDbMock();
        vi.mocked(db.select).mockReturnValue(mockSelect());
    });

    describe('getGroupedWorkspaces', () => {
        it('should group and sort workspaces by activity', async () => {
            const now = new Date();
            const yesterday = new Date(now.getTime() - 86400000);

            // Mock DB response
            const mockStats = [
                {
                    url: 'https://example.com/page1',
                    lastActive: now,
                    count: 5
                },
                {
                    url: 'https://example.com/page2',
                    lastActive: yesterday,
                    count: 3
                },
                {
                    url: 'https://other.com/home',
                    lastActive: yesterday,
                    count: 10
                }
            ];

            // Setup mock chain return value. 
            // In services.ts: db.select(...).from(...).groupBy(...).orderBy(...)
            // dbMock chain: select -> from -> groupBy -> orderBy
            mockOrderBy.mockResolvedValue(mockStats as unknown);

            const result = await getGroupedWorkspaces();

            expect(db.select).toHaveBeenCalled();
            expect(mockFrom).toHaveBeenCalled();
            expect(mockGroupBy).toHaveBeenCalled();
            expect(mockOrderBy).toHaveBeenCalled();

            // Verification Logic
            expect(result).toHaveLength(2); // example.com and other.com

            const exampleGroup = result.find(g => g.domain === 'example.com');
            expect(exampleGroup).toBeDefined();
            expect(exampleGroup?.totalComments).toBe(8); // 5 + 3
            expect(exampleGroup?.pages).toHaveLength(2);
            expect(exampleGroup?.lastActive).toEqual(now); // Max of now & yesterday

            const otherGroup = result.find(g => g.domain === 'other.com');
            expect(otherGroup).toBeDefined();
            expect(otherGroup?.totalComments).toBe(10);

            // Check sorting (example.com is newer)
            expect(result[0].domain).toBe('example.com');
        });

        it('should handle invalid URLs gracefully', async () => {
            const mockStats = [
                {
                    url: 'invalid-url',
                    lastActive: new Date(),
                    count: 1
                }
            ];
            mockOrderBy.mockResolvedValue(mockStats as unknown);

            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

            const result = await getGroupedWorkspaces();

            expect(result).toHaveLength(0);
            expect(consoleSpy).toHaveBeenCalledWith('Skipping invalid URL in dashboard stats:', 'invalid-url');
            consoleSpy.mockRestore();
        });

        it('should return empty array on DB failure', async () => {
            mockOrderBy.mockRejectedValue(new Error('DB Error'));
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            const result = await getGroupedWorkspaces();

            expect(result).toEqual([]);
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });
});
