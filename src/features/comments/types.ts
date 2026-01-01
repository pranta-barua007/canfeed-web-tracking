import { Comment } from '@/db/schema';

export type DeviceContext = {
    width: number;
    height: number;
    userAgent?: string;
};

export type GetCommentsParams = {
    url: string;
    search?: string;
    resolved?: boolean; // filter by status
    limit?: number;
    offset?: number;
    device?: string; // filter by device context (rough match)
    since?: Date; // filter by time
};

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
