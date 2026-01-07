import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getComments } from '../../../features/comments/services';
import { db } from '@/db';
import { createDbQueryMock } from '../../mocks/dbMock';

vi.mock('server-only', () => ({}));
vi.mock('@/db');

describe('getComments service', () => {
    const { mockSelect, mockFrom, mockLeftJoin, mockWhere, mockOrderBy, mockLimit, mockOffset, setupDbMock } = createDbQueryMock();

    beforeEach(() => {
        vi.clearAllMocks();
        setupDbMock();
        vi.mocked(db.select).mockReturnValue(mockSelect());
    });

    it('should fetch comments for a specific URL', async () => {
        const mockData = [{ id: '1', content: 'Test comment', url: 'http://test.com' }];
        mockOffset.mockResolvedValue(mockData);

        const result = await getComments({ url: 'http://test.com' });

        expect(db.select).toHaveBeenCalled();
        expect(mockFrom).toHaveBeenCalled();
        expect(mockLeftJoin).toHaveBeenCalled();
        expect(mockWhere).toHaveBeenCalled();
        expect(mockOrderBy).toHaveBeenCalled();
        expect(mockLimit).toHaveBeenCalled();
        expect(mockOffset).toHaveBeenCalled();
        expect(result).toEqual(mockData);
    });

    it('should apply resolved filter when provided', async () => {
        await getComments({ url: 'http://test.com', resolved: true });

        expect(mockWhere).toHaveBeenCalled();
    });

    it('should return empty array and log error on failure', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        mockOffset.mockRejectedValue(new Error('DB Error'));

        const result = await getComments({ url: 'http://test.com' });

        expect(result).toEqual([]);
        expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch comment:', expect.any(Error));
        consoleSpy.mockRestore();
    });
});
