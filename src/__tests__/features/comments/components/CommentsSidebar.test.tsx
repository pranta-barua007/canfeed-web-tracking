import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import CommentsSidebar from '../../../../features/comments/components/CommentsSidebar';
import { useAppStore, type AppState } from '@/store';
import { useSearchParams, type ReadonlyURLSearchParams } from 'next/navigation';
import * as actions from '../../../../features/comments/actions';

// Mock server-only to allow importing server actions in client tests
vi.mock('server-only', () => ({}));

vi.hoisted(() => {
    if (typeof window !== 'undefined') {
        Object.defineProperty(window, 'IntersectionObserver', {
            writable: true,
            configurable: true,
            value: vi.fn().mockImplementation(() => ({
                observe: vi.fn(),
                unobserve: vi.fn(),
                disconnect: vi.fn(),
            })),
        });
    }
});


// Mock the modules
vi.mock('@/store');
vi.mock('next/navigation');
vi.mock('react-intersection-observer', () => ({
    useInView: () => ({
        ref: vi.fn(),
        inView: true,
        entry: undefined,
    }),
}));

vi.mock('../../../../features/comments/actions');

// Mock child components that might be heavy or rely on more complex state
vi.mock('../../../../features/comments/components/SearchInput', () => ({
    SearchInput: () => <div data-testid="search-input" />,
}));
vi.mock('../../../../features/comments/components/FilterMenu', () => ({
    FilterMenu: () => <div data-testid="filter-menu" />,
}));
vi.mock('../../../../features/comments/components/CommentTabs', () => ({
    CommentTabs: ({ onTabChange }: { showResolved: boolean; onTabChange: (v: boolean) => void }) => (
        <div data-testid="comment-tabs">
            <button onClick={() => onTabChange(false)}>Active</button>
            <button onClick={() => onTabChange(true)}>Resolved</button>
        </div>
    ),
}));

// Create mocked versions of functions for type safety
const mockedUseAppStore = vi.mocked(useAppStore);
const mockedUseSearchParams = vi.mocked(useSearchParams);
const mockedGetComments = vi.mocked(actions.getComments);

describe('CommentsSidebar', () => {
    // Partial mock of the store state
    const mockStore: Partial<AppState> = {
        comments: [],
        activeCommentId: null,
        setActiveCommentId: vi.fn(),
        toggleCommentResolve: vi.fn(),
        appendComments: vi.fn(),
        setComments: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockedUseAppStore.mockReturnValue(mockStore as AppState);
        mockedUseSearchParams.mockReturnValue({
            get: vi.fn().mockReturnValue(null),
        } as unknown as ReadonlyURLSearchParams);
        mockedGetComments.mockResolvedValue([]);
    });

    it('renders correctly with no comments', async () => {
        render(<CommentsSidebar />);
        await waitFor(() => {
            expect(screen.getByText(/Comments \(0\)/)).toBeInTheDocument();
        });
    });

    it('renders comments when they exist', async () => {
        mockedUseAppStore.mockReturnValue({
            ...mockStore,
            comments: [
                { id: '1', content: 'Test comment 1', resolved: false, createdAt: new Date().toISOString() },
            ],
        } as unknown as AppState);

        render(<CommentsSidebar />);
        await waitFor(() => {
            expect(screen.getByText(/Comments \(1\)/)).toBeInTheDocument();
            // Assuming CommentItem renders the content or some part of it
            expect(screen.getByText('Test comment 1')).toBeInTheDocument();
        });
    });
});
