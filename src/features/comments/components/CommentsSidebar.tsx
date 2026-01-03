import { useAppStore } from "@/store";
import { type CommentType } from "../types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { useState, useEffect, useEffectEvent } from "react";
import { toggleResolveComment, getComments } from "../actions";
import { SearchInput } from "./SearchInput";
import { FilterMenu } from "./FilterMenu";
import { useSearchParams } from "next/navigation";
import { CommentTabs } from "./CommentTabs";
import { CommentEmptyState } from "./CommentEmptyState";
import { CommentItem } from "./CommentItem";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";

export default function CommentsSidebar() {
    const { comments, setActiveCommentId, activeCommentId, toggleCommentResolve, appendComments, setComments } = useAppStore();
    const [showResolved, setShowResolved] = useState(false);

    const searchParams = useSearchParams();
    const targetUrl = searchParams.get("url") || "https://example.com";
    const paramSearch = searchParams.get("search");
    const paramTime = searchParams.get("time");
    const paramDeviceFilter = searchParams.get("deviceFilter");

    // Helper to calculate since date
    const getSinceDate = (filter: string | null) => {
        if (!filter || filter === "all") return undefined;
        const now = new Date();
        if (filter === "hour") return new Date(now.getTime() - 60 * 60 * 1000);
        if (filter === "day") return new Date(now.getTime() - 24 * 60 * 60 * 1000);
        if (filter === "week") return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return undefined;
    };

    // Use the new reusable infinite scroll hook
    const { ref: sentinelRef, loading, hasMore, reset } = useInfiniteScroll({
        limit: 20,
        fetchData: async (offset) => {
            return await getComments({
                url: targetUrl,
                search: paramSearch || undefined,
                since: getSinceDate(paramTime),
                device: paramDeviceFilter || undefined,
                offset: offset,
                limit: 20
            });
        },
        onDataLoaded: (newComments, isReset) => {
            const mapped = newComments.map(c => ({
                ...c,
                author: c.author ? {
                    name: c.author.name || "Anonymous",
                    avatar: c.author.image || undefined
                } : undefined
            }));

            if (isReset) {
                setComments(mapped as unknown as CommentType[]);
            } else {
                appendComments(mapped as unknown as CommentType[]);
            }
        }
    });

    // Use useEffectEvent to break the loop. This ensures that the reset logic
    // has access to the latest 'reset' function without triggering the effect again.
    const onFilterChange = useEffectEvent(() => {
        reset();
    });

    // Reset and Fetch when filters change
    useEffect(() => {
        onFilterChange();
    }, [targetUrl, paramSearch, paramTime, paramDeviceFilter]);

    // Sort comments by createdAt descending (newest first)
    // Filter by Tab (Active vs Resolved)
    const filteredComments = comments
        .filter(c => {
            // Filter by Tab (Active vs Resolved)
            if (showResolved) {
                if (!c.resolved) return false;
            } else {
                if (c.resolved) return false;
            }
            return true;
        })
        .sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return dateB - dateA;
        });

    const handleCommentClick = (commentId: string) => {
        if (activeCommentId === commentId) {
            setActiveCommentId(null);
        } else {
            setActiveCommentId(commentId);
        }
    };

    const handleResolveToggle = async (e: React.MouseEvent, commentId: string, currentStatus: boolean) => {
        e.stopPropagation(); // Don't trigger card click
        // Optimistic update
        toggleCommentResolve(commentId);
        // Server update
        await toggleResolveComment(commentId, !currentStatus);
    };

    return (
        <div className="w-80 border-r bg-white h-full flex flex-col dark:bg-zinc-950 dark:border-zinc-800 pb-16">
            <div className="p-4 border-b font-semibold h-14 flex items-center bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-sm shrink-0 justify-between">
                <span>Comments ({comments.length})</span>
            </div>

            {/* Tabs & Search */}
            <div className="p-3 pb-0 space-y-3">
                <CommentTabs
                    showResolved={showResolved}
                    onTabChange={setShowResolved}
                />

                {/* Search & Filter */}
                <div className="flex items-center gap-2 py-3">
                    <SearchInput />
                    <FilterMenu />
                </div>
            </div>

            <ScrollArea className="flex-1 h-full w-full pb-28">
                <div className="space-y-3 p-3">
                    <CommentEmptyState
                        totalComments={comments.length}
                        filteredCount={filteredComments.length}
                        showResolved={showResolved}
                    />

                    {filteredComments.map((comment) => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            isActive={activeCommentId === comment.id}
                            onClick={() => handleCommentClick(comment.id)}
                            onResolveToggle={(e) => handleResolveToggle(e, comment.id, !!comment.resolved)}
                        />
                    ))}

                    {/* Infinite Scroll Sentinel */}
                    {comments.length > 0 && hasMore && (
                        <div ref={sentinelRef} className="py-4 flex justify-center">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : <div className="h-1" />}
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
