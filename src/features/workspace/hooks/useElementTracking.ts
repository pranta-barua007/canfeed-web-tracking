import { useEffect, useRef, useState } from "react";
import { type CommentType } from "@/store";
import { getElementBySelector } from "@/lib/selector";

interface UseElementTrackingProps {
    comments: CommentType[];
    activeCommentId: string | null;
    newMarkerPos: { selector?: string } | null;
    scale?: number;
    iframeRef: React.RefObject<HTMLIFrameElement>;
}

export function useElementTracking({ comments, activeCommentId, newMarkerPos, scale = 1, iframeRef }: UseElementTrackingProps) {
    const [trackedPositions, setTrackedPositions] = useState<Record<string, { x: number; y: number; visible: boolean }>>({});
    const [scrollTop, setScrollTop] = useState(0);
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

                // Check cache first
                let el = elementCache.current.get(comment.selector);

                // If not in cache or detached, re-query
                if (!el || !el.isConnected) {
                    el = getElementBySelector(comment.selector, iframe.contentDocument!) || undefined;
                    if (el) {
                        elementCache.current.set(comment.selector, el);
                    } else {
                        elementCache.current.delete(comment.selector);
                    }
                }

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

            // 2. Logic for Active/New Highlight
            let newHighlight: { x: number; y: number; width: number; height: number } | null = null;
            let targetSelector = activeComment?.selector;

            if (newMarkerPos && newMarkerPos.selector) {
                targetSelector = newMarkerPos.selector;
            }

            if (targetSelector) {
                let el = elementCache.current.get(targetSelector);
                if (!el || !el.isConnected) {
                    el = getElementBySelector(targetSelector, iframe.contentDocument!) || undefined;
                    if (el) elementCache.current.set(targetSelector, el);
                }

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
            setTrackedPositions(prev => {
                const changed = Object.keys(newPositions).some(k =>
                    !prev[k] || Math.abs(prev[k].x - newPositions[k].x) > 0.1 || Math.abs(prev[k].y - newPositions[k].y) > 0.1
                ) || Object.keys(prev).some(k => !newPositions[k] && comments.find(c => c.id === k)?.selector);

                return changed ? newPositions : prev;
            });

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
    }, [comments, activeComment, newMarkerPos, scale, iframeRef]);

    return { trackedPositions, activeHighlightRect, scrollTop };
}
