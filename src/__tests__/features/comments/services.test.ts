import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getComments } from '../../../features/comments/services';
import { db } from '@/db';
import { mockQueryBuilder } from '../../mocks/db';

// Mock server-only
vi.mock('server-only', () => ({}));

// Mock server-only
vi.mock('server-only', () => ({}));

// Mock the db module
vi.mock('@/db', async () => {
    const { mockQueryBuilder } = await import('../../mocks/db');
    return {
        db: {
            select: mockQueryBuilder.select,
        },
    };
});

describe('getComments service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset chain returns to defaults (important because vi.clearAllMocks clears return values)
        // Ensure all methods return the builder for chaining
        mockQueryBuilder.select.mockReturnValue(mockQueryBuilder);
        mockQueryBuilder.from.mockReturnValue(mockQueryBuilder);
        mockQueryBuilder.leftJoin.mockReturnValue(mockQueryBuilder);
        mockQueryBuilder.where.mockReturnValue(mockQueryBuilder);
        mockQueryBuilder.orderBy.mockReturnValue(mockQueryBuilder);
        mockQueryBuilder.limit.mockReturnValue(mockQueryBuilder);
        mockQueryBuilder.offset.mockResolvedValue([]);
    });

    it('should fetch comments for a specific URL', async () => {
        const mockData = [{ id: '1', content: 'Test comment', url: 'http://test.com' }];
        // Strict typing: offset needs to return a Promise that resolves to the data
        mockQueryBuilder.offset.mockResolvedValue(mockData);

        const result = await getComments({ url: 'http://test.com' });

        expect(db.select).toHaveBeenCalled();
        expect(mockQueryBuilder.from).toHaveBeenCalled();
        expect(mockQueryBuilder.leftJoin).toHaveBeenCalled();
        expect(mockQueryBuilder.where).toHaveBeenCalled();
        expect(mockQueryBuilder.orderBy).toHaveBeenCalled();
        expect(mockQueryBuilder.limit).toHaveBeenCalled();
        expect(mockQueryBuilder.offset).toHaveBeenCalled();
        expect(result).toEqual(mockData);
    });

    it('should apply resolved filter when provided', async () => {
        await getComments({ url: 'http://test.com', resolved: true });

        // Verify where was called
        expect(mockQueryBuilder.where).toHaveBeenCalled();
        // You could also verify specifically that arguments were passed if you export schema or use sql param matchers
    });

    it('should return empty array and log error on failure', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        mockQueryBuilder.offset.mockRejectedValue(new Error('DB Error'));

        const result = await getComments({ url: 'http://test.com' });

        expect(result).toEqual([]);
        expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch comment:', expect.any(Error));
        consoleSpy.mockRestore();
    });
});
