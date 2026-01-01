import { useState } from "react";
import Konva from "konva";
import { getUniqueSelector, getElementBySelector } from "@/lib/selector";
import { type CommentType } from '@/features/comments/types';

interface MarkerPos {
    x: number;
    y: number;
    selector?: string;
    relativeX?: number;
    relativeY?: number;
}

interface UseCanvasInteractionProps {
    isCommentMode: boolean;
    scale?: number;
    activeComment: CommentType | undefined;
    newMarkerPos: MarkerPos | null;
    setNewMarkerPos: (pos: MarkerPos | null) => void;
    iframeRef: React.RefObject<HTMLIFrameElement | null>;
}

export function useCanvasInteraction({
    isCommentMode,
    scale = 1,
    setNewMarkerPos,
    iframeRef
}: UseCanvasInteractionProps) {
    const [hoveredRect, setHoveredRect] = useState<{ x: number; y: number; width: number; height: number; selector: string } | null>(null);

    const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (!isCommentMode) {
            if (hoveredRect) setHoveredRect(null);
            return;
        }

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
                    if (el && el !== iframe.contentDocument.body && el !== iframe.contentDocument.documentElement) {
                        const rect = el.getBoundingClientRect();
                        const selector = getUniqueSelector(el);

                        setHoveredRect({
                            x: rect.left * scale,
                            y: rect.top * scale,
                            width: rect.width * scale,
                            height: rect.height * scale,
                            selector
                        });
                        return;
                    }
                } catch {
                    // Ignore inspector errors
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

            if (hoveredRect) {
                selector = hoveredRect.selector;
                if (iframe?.contentDocument) {
                    const el = getElementBySelector(selector, iframe.contentDocument);
                    if (el) {
                        const rect = el.getBoundingClientRect();
                        relativeX = (logicalX - rect.left) / rect.width;
                        relativeY = (logicalY - rect.top) / rect.height;
                    }
                }
            } else {
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

    return { hoveredRect, handleMouseMove, handleMouseDown, setHoveredRect };
}
