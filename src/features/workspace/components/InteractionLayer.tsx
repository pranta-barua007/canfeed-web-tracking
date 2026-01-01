"use client";

import { CommentPopover } from "./CommentPopover";
import { type CommentType, type DeviceContext } from "@/features/comments/types";

interface InteractionLayerProps {
    activeComment: CommentType | undefined;
    newMarkerPos: { x: number; y: number; selector?: string; relativeX?: number; relativeY?: number } | null;
    width: number;
    height: number;
    scrollTop: number;
    url: string;
    setActiveCommentId: (id: string | null) => void;
    toggleCommentResolve: (id: string) => void;
    toggleResolveComment: (id: string, resolved: boolean) => Promise<{ success: boolean }>;
    addComment: (comment: CommentType) => void;
    setNewMarkerPos: (pos: { x: number; y: number } | null) => void;
    createComment: (params: {
        content: string;
        url: string;
        x: number;
        y: number;
        selector?: string;
        selectorFallback?: Record<string, unknown> | null;
        authorId?: string;
        deviceContext?: DeviceContext;
    }) => void;
    trackedPositions?: Record<string, { x: number; y: number; visible: boolean }>;
}

export function InteractionLayer({
    activeComment,
    newMarkerPos,
    width,
    height,
    scrollTop,
    url,
    setActiveCommentId,
    toggleCommentResolve,
    toggleResolveComment,
    addComment,
    setNewMarkerPos,
    createComment,
    trackedPositions,
}: InteractionLayerProps) {

    // Calculate popover position for active comment
    let activeX = 0;
    let activeY = 0;

    if (activeComment) {
        if (activeComment.selector && trackedPositions && trackedPositions[activeComment.id]) {
            activeX = trackedPositions[activeComment.id].x;
            activeY = trackedPositions[activeComment.id].y;
        } else {
            activeX = activeComment.x * width;
            activeY = (activeComment.y * height) - scrollTop;
        }
    }

    return (
        <div className="absolute inset-0 pointer-events-none z-[60]">
            {activeComment && (
                <div className="pointer-events-auto">
                    <CommentPopover
                        x={activeX}
                        y={activeY}
                        comment={activeComment}
                        onClose={() => setActiveCommentId(null)}
                        onResolve={async () => {
                            toggleCommentResolve(activeComment.id);
                            setActiveCommentId(null);
                            await toggleResolveComment(activeComment.id, true);
                        }}
                    />
                </div>
            )}

            {newMarkerPos && (
                <div className="pointer-events-auto">
                    <CommentPopover
                        x={newMarkerPos.x}
                        y={newMarkerPos.y}
                        isNew
                        onClose={() => setNewMarkerPos(null)}
                        onSave={(content) => {
                            const newId = crypto.randomUUID();
                            const wrapper = {
                                id: newId,
                                x: newMarkerPos.x / width,
                                y: (newMarkerPos.y + scrollTop) / height,
                                content,
                                resolved: false,
                                author: { name: "Me" },
                                url: url,
                                deviceContext: { width, height },
                                createdAt: new Date(),
                                selector: newMarkerPos.selector,
                                selectorFallback: newMarkerPos.relativeX ? {
                                    relativeX: newMarkerPos.relativeX,
                                    relativeY: newMarkerPos.relativeY
                                } : null
                            };
                            addComment(wrapper);
                            setNewMarkerPos(null);

                            createComment({
                                content,
                                url,
                                x: newMarkerPos.x / width,
                                y: (newMarkerPos.y + scrollTop) / height,
                                selector: newMarkerPos.selector,
                                selectorFallback: newMarkerPos.relativeX ? {
                                    relativeX: newMarkerPos.relativeX,
                                    relativeY: newMarkerPos.relativeY
                                } : null,
                                authorId: "anon",
                                deviceContext: { width, height },
                            });
                        }}
                    />
                </div>
            )}
        </div>
    );
}
