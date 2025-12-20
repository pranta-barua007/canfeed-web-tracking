"use client";

interface CommentEmptyStateProps {
    totalComments: number;
    filteredCount: number;
    showResolved: boolean;
}

export function CommentEmptyState({
    totalComments,
    filteredCount,
    showResolved,
}: CommentEmptyStateProps) {
    if (totalComments === 0) {
        return (
            <div className="text-center text-sm text-muted-foreground mt-10">
                No comments yet.
                <br />
                Toggle <b>Comment Mode</b> to start.
            </div>
        );
    }

    if (filteredCount === 0) {
        return (
            <div className="text-center text-sm text-muted-foreground mt-10">
                No {showResolved ? "resolved" : "matching"} comments found.
            </div>
        );
    }

    return null;
}
