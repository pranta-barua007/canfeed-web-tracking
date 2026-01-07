import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createComment, toggleResolveComment, getComments } from '../../../features/comments/actions';
import { revalidatePath } from 'next/cache';
import { type Comment } from '@/db/schema';

vi.mock('server-only', () => ({}));
vi.mock('next/cache');
vi.mock('../../../features/comments/services');

describe('Comments Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createComment', () => {
        it('should call service and revalidate path on success', async () => {
            const mockData = {
                content: 'Test',
                url: 'http://example.com',
                x: 0,
                y: 0,
            };
            const mockComment = {
                id: '123',
                ...mockData,
                createdAt: new Date(),
                updatedAt: new Date(),
                authorId: 'anon',
                resolved: false,
                selector: null,
                selectorFallback: null,
                deviceContext: null,
                snapshot: null
            } as unknown as Comment;

            const { createComment: createCommentService } = await import('../../../features/comments/services');
            vi.mocked(createCommentService).mockResolvedValue(mockComment);

            const result = await createComment(mockData);

            expect(createCommentService).toHaveBeenCalledWith(expect.objectContaining(mockData));
            expect(revalidatePath).toHaveBeenCalledWith('/workspace');
            expect(result).toEqual(mockComment);
        });

        it('should return null on error', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            const { createComment: createCommentService } = await import('../../../features/comments/services');
            vi.mocked(createCommentService).mockRejectedValue(new Error('Ooops'));

            const result = await createComment({
                content: 'Test',
                url: 'http://example.com',
                x: 0,
                y: 0,
            });

            expect(result).toBeNull();
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('toggleResolveComment', () => {
        it('should call service and revalidate path', async () => {
            const { updateCommentResolution } = await import('../../../features/comments/services');
            vi.mocked(updateCommentResolution).mockResolvedValue(undefined);

            const result = await toggleResolveComment('123', true);

            expect(updateCommentResolution).toHaveBeenCalledWith('123', true);
            expect(revalidatePath).toHaveBeenCalledWith('/workspace');
            expect(result).toEqual({ success: true });
        });

        it('should return success: false on error', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            const { updateCommentResolution } = await import('../../../features/comments/services');
            vi.mocked(updateCommentResolution).mockRejectedValue(new Error('Fail'));

            const result = await toggleResolveComment('123', true);

            expect(result).toEqual({ success: false });
            consoleSpy.mockRestore();
        });
    });

    describe('getComments', () => {
        it('should delegate to service', async () => {
            const { getComments: getCommentsService } = await import('../../../features/comments/services');
            const mockParams = { url: 'http://example.com' };
            const mockResult = [{ id: '1' }] as unknown as Awaited<ReturnType<typeof getCommentsService>>;

            vi.mocked(getCommentsService).mockResolvedValue(mockResult);

            const result = await getComments(mockParams);

            expect(getCommentsService).toHaveBeenCalledWith(mockParams);
            expect(result).toBe(mockResult);
        });
    });
});
