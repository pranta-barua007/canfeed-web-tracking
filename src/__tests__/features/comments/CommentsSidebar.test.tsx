import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import CommentsSidebar from '../../../features/comments/components/CommentsSidebar';
import { useAppStore } from '@/store';
import { useSearchParams } from 'next/navigation';

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
vi.mock('@/store', () => ({
    useAppStore: vi.fn(),
}));

vi.mock('next/navigation', () => ({
    useSearchParams: vi.fn(),
}));

vi.mock('react-intersection-observer', () => ({
    useInView: () => ({
        ref: vi.fn(),
        inView: true,
        entry: undefined,
    }),
}));

vi.mock('../../../features/comments/actions', () => ({
    getComments: vi.fn().mockResolvedValue([]),
    toggleResolveComment: vi.fn(),
}));

// Mock child components that might be heavy or rely on more complex state
vi.mock('../../../features/comments/components/SearchInput', () => ({
    SearchInput: () => <div data-testid="search-input" />,
}));
vi.mock('../../../features/comments/components/FilterMenu', () => ({
    FilterMenu: () => <div data-testid="filter-menu" />,
}));
vi.mock('../../../features/comments/components/CommentTabs', () => ({
    CommentTabs: ({ showResolved, onTabChange }: any) => (
        <div data-testid="comment-tabs">
            <button onClick={() => onTabChange(false)}>Active</button>
            <button onClick={() => onTabChange(true)}>Resolved</button>
        </div>
    ),
}));

describe('CommentsSidebar', () => {
    const mockStore = {
        comments: [],
        activeCommentId: null,
        setActiveCommentId: vi.fn(),
        toggleCommentResolve: vi.fn(),
        appendComments: vi.fn(),
        setComments: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useAppStore as any).mockReturnValue(mockStore);
        (useSearchParams as any).mockReturnValue({
            get: vi.fn().mockReturnValue(null),
        });
    });

    it('renders correctly with no comments', async () => {
        render(<CommentsSidebar />);
        await waitFor(() => {
            expect(screen.getByText(/Comments \(0\)/)).toBeInTheDocument();
        });
    });

    it('renders comments when they exist', async () => {
        (useAppStore as any).mockReturnValue({
            ...mockStore,
            comments: [
                { id: '1', content: 'Test comment 1', resolved: false, createdAt: new Date().toISOString() },
            ],
        });

        render(<CommentsSidebar />);
        await waitFor(() => {
            expect(screen.getByText(/Comments \(1\)/)).toBeInTheDocument();
            // Assuming CommentItem renders the content or some part of it
            expect(screen.getByText('Test comment 1')).toBeInTheDocument();
        });
    });
});
