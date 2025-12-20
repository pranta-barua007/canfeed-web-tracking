"use client";

import { useEffect, useRef, useState } from "react";
import Konva from "konva";
import { Stage, Layer, Rect } from "react-konva";
import { useAppStore } from "@/store";
import { CommentMarker } from "./CommentMarker";
import { GhostMarker } from "./GhostMarker";
import { InteractionLayer } from "./InteractionLayer";
import { createComment, toggleResolveComment } from "@/features/comments/actions";
import { getUniqueSelector, getElementBySelector } from "@/lib/selector";

interface CanvasOverlayProps {
    width: number;
    height: number;
    url: string;
    scale?: number;
    iframeRef: React.RefObject<HTMLIFrameElement | null>;
}

export default function CanvasOverlay({ width, height, url, scale = 1, iframeRef }: CanvasOverlayProps) {
    const { isCommentMode, comments, addComment, toggleCommentResolve, activeCommentId, setActiveCommentId } = useAppStore();
    const stageRef = useRef<Konva.Stage>(null);
    const [newMarkerPos, setNewMarkerPos] = useState<{ x: number; y: number; selector?: string; relativeX?: number; relativeY?: number } | null>(null);
    const [scrollTop, setScrollTop] = useState(0);

    // Inspector State
    const [hoveredRect, setHoveredRect] = useState<{ x: number; y: number; width: number; height: number; selector: string } | null>(null);


    // Local state to store calculated visual positions for tracked elements
    const [trackedPositions, setTrackedPositions] = useState<Record<string, { x: number; y: number; visible: boolean }>>({});

    // Independent state for the active element highlight
    const [activeHighlightRect, setActiveHighlightRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

    // Cache for DOM elements to avoid frequent querySelector calls
    const elementCache = useRef<Map<string, Element>>(new Map());


    const activeComment = comments.find(c => c.id === activeCommentId);

    // Scroll Sync & Tracking Loop
    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;

        let animationFrameId: number;

        const handleScroll = () => {
            if (iframe.contentWindow) {
                setScrollTop(iframe.contentWindow.scrollY);
            }
        };

        const updatePositions = () => {
            if (!iframe.contentDocument) return;

            const newPositions: Record<string, { x: number; y: number; visible: boolean }> = {};

            // 1. Update Marker Positions
            comments.forEach(comment => {
                if (!comment.selector) return;

                const el = getElementBySelector(comment.selector, iframe.contentDocument!);

                if (el) {
                    const rect = el.getBoundingClientRect();
                    const offsets = comment.selectorFallback as { relativeX: number; relativeY: number } | undefined;

                    if (offsets) {
                        const visualX = rect.left + (rect.width * offsets.relativeX);
                        const visualY = rect.top + (rect.height * offsets.relativeY);
                        newPositions[comment.id] = { x: visualX, y: visualY, visible: true };
                    }
                }
            });

            // 2. Logic for Active/New Highlight (Run every frame to stick to element)
            let newHighlight: { x: number; y: number; width: number; height: number } | null = null;
            let targetSelector = activeComment?.selector;

            // Prioritize New Marker selection if active
            if (newMarkerPos && newMarkerPos.selector) {
                targetSelector = newMarkerPos.selector;
            }

            if (targetSelector) {
                const el = getElementBySelector(targetSelector, iframe.contentDocument!);
                if (el) {
                    const rect = el.getBoundingClientRect();
                    newHighlight = {
                        x: rect.left * scale,
                        y: rect.top * scale,
                        width: rect.width * scale,
                        height: rect.height * scale
                    };
                }
            }

            // 3. Update States

            // Tracked Positions
            setTrackedPositions(prev => {
                const changed = Object.keys(newPositions).some(k =>
                    !prev[k] || Math.abs(prev[k].x - newPositions[k].x) > 0.1 || Math.abs(prev[k].y - newPositions[k].y) > 0.1
                ) || Object.keys(prev).some(k => !newPositions[k] && comments.find(c => c.id === k)?.selector);

                return changed ? newPositions : prev;
            });

            // Active Highlight
            setActiveHighlightRect(prev => {
                if (!newHighlight && !prev) return null;
                if (newHighlight && prev &&
                    Math.abs(newHighlight.x - prev.x) < 0.1 &&
                    Math.abs(newHighlight.y - prev.y) < 0.1 &&
                    Math.abs(newHighlight.width - prev.width) < 0.1) return prev;
                return newHighlight;
            });

            animationFrameId = requestAnimationFrame(updatePositions);
        };

        const attach = () => {
            const win = iframe.contentWindow;
            if (win) {
                // Clear cache on new page load/attach to avoid stale references
                elementCache.current.clear();

                win.addEventListener("scroll", handleScroll);
                handleScroll();
                updatePositions();
            }
        };

        if (iframe) {
            if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
                attach();
            } else {
                iframe.addEventListener("load", attach);
            }
        }

        return () => {
            cancelAnimationFrame(animationFrameId);
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.removeEventListener("scroll", handleScroll);
                iframe.removeEventListener("load", attach);
            }
        };
    }, [url, comments, activeComment, newMarkerPos, scale, iframeRef]);

    // Inspector Hover Logic
    const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (!isCommentMode) {
            if (hoveredRect) setHoveredRect(null);
            return;
        }

        // Throttle slightly or just run? RAF is probably better normally, but let's try direct first.
        const stage = e.target.getStage();
        if (!stage) return;

        const pos = stage.getPointerPosition();
        if (pos) {
            const logicalX = pos.x / scale;
            const logicalY = pos.y / scale;

            const iframe = iframeRef.current;
            if (iframe && iframe.contentDocument) {
                try {
                    const el = iframe.contentDocument.elementFromPoint(logicalX, logicalY);
                    // Filter: Ignore body/html to focus on specific elements. 
                    // Also ignore our own markers (though they are pointer-events: none usually)
                    if (el && el !== iframe.contentDocument.body && el !== iframe.contentDocument.documentElement) {
                        const rect = el.getBoundingClientRect();
                        const selector = getUniqueSelector(el);

                        // Set highlight
                        setHoveredRect({
                            x: rect.left * scale, // Visual Coordinates of element
                            y: rect.top * scale,
                            width: rect.width * scale,
                            height: rect.height * scale,
                            selector
                        });
                        return;
                    }
                } catch (err) {
                    console.warn("Inspector error:", err);
                }
            }
        }
        setHoveredRect(null);
    };

    const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (!isCommentMode) return;

        const stage = e.target.getStage();
        if (!stage) return;

        if (e.target.getParent()?.hasName("marker-group")) return;

        const pos = stage.getPointerPosition();
        if (pos) {
            const logicalX = pos.x / scale;
            const logicalY = pos.y / scale;

            let selector: string | undefined;
            let relativeX: number | undefined;
            let relativeY: number | undefined;

            const iframe = iframeRef.current;
            if (!iframe) return;

            // Use the hovered element if available for consistency
            if (hoveredRect) {
                selector = hoveredRect.selector;
                // Recalculate relative pos based on the hovered rect
                // Logical Pos is relative to window, hoveredRect was stored in Visual coords (scaled).
                // Let's re-get standard data or use what we have.
                // Safest to re-query to get exact relative offset logic consistent.

                if (iframe?.contentDocument) {
                    const el = getElementBySelector(selector, iframe.contentDocument); // Use selector we found
                    if (el) {
                        const rect = el.getBoundingClientRect();
                        relativeX = (logicalX - rect.left) / rect.width;
                        relativeY = (logicalY - rect.top) / rect.height;
                    }
                }
            } else {
                // Fallback to direct probe (if mouse moved fast or something)
                if (iframe.contentDocument) {
                    const el = iframe.contentDocument.elementFromPoint(logicalX, logicalY);
                    if (el && el !== iframe.contentDocument.body && el !== iframe.contentDocument.documentElement) {
                        selector = getUniqueSelector(el);
                        const rect = el.getBoundingClientRect();
                        relativeX = (logicalX - rect.left) / rect.width;
                        relativeY = (logicalY - rect.top) / rect.height;
                    }
                }
            }

            setNewMarkerPos({
                x: logicalX,
                y: logicalY,
                selector,
                relativeX,
                relativeY
            });
        }
    };

    return (
        <div className="absolute inset-0 pointer-events-none">
            <Stage
                ref={stageRef}
                width={width}
                height={height}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    pointerEvents: isCommentMode ? "auto" : "none",
                    zIndex: 50,
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoveredRect(null)}
            >
                <Layer>
                    {/* Inspector Highlight (Hover) */}
                    {isCommentMode && hoveredRect && !activeComment && !newMarkerPos && (
                        <Rect
                            x={hoveredRect.x}
                            y={hoveredRect.y}
                            width={hoveredRect.width}
                            height={hoveredRect.height}
                            fill="rgba(59, 130, 246, 0.2)" // Blue tint
                            stroke="#3b82f6"
                            strokeWidth={2}
                            listening={false} // Don't block clicks
                        />
                    )}

                    {/* Active Comment / New Marker Highlight (Persistent Blue Box) */}
                    {activeHighlightRect && (
                        <Rect
                            x={activeHighlightRect.x}
                            y={activeHighlightRect.y}
                            width={activeHighlightRect.width}
                            height={activeHighlightRect.height}
                            fill="rgba(59, 130, 246, 0.1)"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            listening={false}
                        />
                    )}

                    {comments.map((comment) => {
                        if (comment.resolved) return null;

                        const ctx = comment.deviceContext as { width: number } | null;
                        const commentWidth = ctx?.width;
                        if (commentWidth && Math.abs(commentWidth - width) > 100) return null;

                        let visualX = comment.x * width;
                        let visualY = (comment.y * height) - scrollTop;

                        if (comment.selector) {
                            const tracked = trackedPositions[comment.id];
                            if (tracked && tracked.visible) {
                                visualX = tracked.x;
                                visualY = tracked.y;
                            }
                        }

                        if (visualY < -50 || visualY > height + 50) return null;

                        return (
                            <CommentMarker
                                key={comment.id}
                                x={visualX}
                                y={visualY}
                                comment={comment}
                                isActive={activeCommentId === comment.id}
                                onClick={() => setActiveCommentId(comment.id)}
                            />
                        )
                    })}

                    {newMarkerPos && (
                        <GhostMarker
                            x={newMarkerPos.x}
                            y={newMarkerPos.y}
                        />
                    )}
                </Layer>
            </Stage>

            <InteractionLayer
                activeComment={activeComment}
                newMarkerPos={newMarkerPos}
                width={width}
                height={height}
                scrollTop={scrollTop}
                url={url}
                setActiveCommentId={setActiveCommentId}
                toggleCommentResolve={toggleCommentResolve}
                toggleResolveComment={toggleResolveComment}
                addComment={addComment}
                setNewMarkerPos={setNewMarkerPos}
                createComment={createComment}
                trackedPositions={trackedPositions}
            />
        </div >
    );
}
