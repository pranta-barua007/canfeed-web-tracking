import { create } from 'zustand';
import { Comment } from '@/db/schema';

// Extended Interface for UI (optimistic updates etc)
export interface CommentType extends Partial<Comment> {
    id: string; // ID is mandatory
    x: number;
    y: number;
    content: string;
    selector?: string | null;
    selectorFallback?: Record<string, any> | null;
    author?: {
        name: string;
        avatar?: string;
    };
}

interface AppState {
    isCommentMode: boolean;
    toggleCommentMode: () => void;
    setCommentMode: (mode: boolean) => void;

    comments: CommentType[];
    addComment: (comment: CommentType) => void;
    appendComments: (comments: CommentType[]) => void;
    setComments: (comments: CommentType[]) => void;

    deviceScale: number;
    setDeviceScale: (scale: number) => void;

    activeCommentId: string | null;
    setActiveCommentId: (id: string | null) => void;

    toggleCommentResolve: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
    isCommentMode: false,
    toggleCommentMode: () => set((state) => ({ isCommentMode: !state.isCommentMode })),
    setCommentMode: (mode) => set({ isCommentMode: mode }),

    comments: [],
    addComment: (c) => set((state) => ({ comments: [...state.comments, c] })),
    appendComments: (cs) => set((state) => ({ comments: [...state.comments, ...cs] })), // Append new batch
    setComments: (cs) => set({ comments: cs }),

    deviceScale: 1,
    setDeviceScale: (s) => set({ deviceScale: s }),

    activeCommentId: null,
    setActiveCommentId: (id) => set({ activeCommentId: id }),

    toggleCommentResolve: (id) => set((state) => ({
        comments: state.comments.map((c) =>
            c.id === id ? { ...c, resolved: !c.resolved } : c
        ),
    })),
}));
