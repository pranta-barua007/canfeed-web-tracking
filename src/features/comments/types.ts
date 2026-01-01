import { Comment } from '@/db/schema';

export interface DeviceContext {
    width: number;
    height: number;
    breakpoint?: string;
    userAgent?: string;
}

// Extended Interface for UI (optimistic updates etc)
export interface CommentType extends Partial<Comment> {
    id: string; // ID is mandatory
    x: number;
    y: number;
    content: string;
    selector?: string | null;
    selectorFallback?: Record<string, unknown> | null;
    author?: {
        name: string;
        avatar?: string;
    };
}
