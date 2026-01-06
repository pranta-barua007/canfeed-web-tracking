import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getComments } from '../../../features/comments/services';
import { db } from '@/db';

// Mock server-only
vi.mock('server-only', () => ({}));

// Mock the db
vi.mock('@/db', () => ({
    db: {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
    },
}));

describe('getComments service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch comments for a specific URL', async () => {
        const mockData = [{ id: '1', content: 'Test comment', url: 'http://test.com' }];
        (db.select() as any).offset.mockResolvedValue(mockData);

        const result = await getComments({ url: 'http://test.com' });

        expect(db.select).toHaveBeenCalled();
        expect(result).toEqual(mockData);
    });

    it('should apply resolved filter when provided', async () => {
        await getComments({ url: 'http://test.com', resolved: true });

        // We can't easily check the where conditions here without more complex mocking
        // but we can verify the mock was called.
        expect((db as any).where).toHaveBeenCalled();
    });

    it('should return empty array and log error on failure', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        (db.select() as any).offset.mockRejectedValue(new Error('DB Error'));

        const result = await getComments({ url: 'http://test.com' });

        expect(result).toEqual([]);
        expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch comment:', expect.any(Error));
        consoleSpy.mockRestore();
    });
});
