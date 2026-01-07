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

describe('createComment service', () => {
    const { mockInsert, mockValues, mockReturning, setupDbMock } = createDbQueryMock();

    beforeEach(() => {
        vi.clearAllMocks();
        setupDbMock();
        vi.mocked(db.insert).mockReturnValue(mockInsert());
    });

    it('should create comment and return it', async () => {
        const mockData = {
            content: 'Test',
            url: 'http://example.com',
            x: 0,
            y: 0
        };
        const mockResult = [{ id: '1', ...mockData }];

        mockReturning.mockResolvedValue(mockResult);

        const { createComment } = await import('../../../features/comments/services');
        const result = await createComment(mockData);

        expect(db.insert).toHaveBeenCalled();
        expect(mockValues).toHaveBeenCalled();
        expect(mockReturning).toHaveBeenCalled();
        expect(result).toEqual(mockResult[0]);
    });
});

describe('updateCommentResolution service', () => {
    const { mockUpdate, mockSet, mockWhere, setupDbMock } = createDbQueryMock();

    beforeEach(() => {
        vi.clearAllMocks();
        setupDbMock();
        vi.mocked(db.update).mockReturnValue(mockUpdate());
    });

    it('should update comment resolution', async () => {
        const { updateCommentResolution } = await import('../../../features/comments/services');
        await updateCommentResolution('123', true);

        expect(db.update).toHaveBeenCalled();
        expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({ resolved: true }));
        expect(mockWhere).toHaveBeenCalled();
    });
});
