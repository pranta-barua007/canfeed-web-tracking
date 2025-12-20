"use client";

import { CommentMarker } from "./CommentMarker";

interface GhostMarkerProps {
    x: number;
    y: number;
}

/**
 * A specialized marker for placing a new comment.
 * Decoupled from the persistent comment markers.
 */
export function GhostMarker({ x, y }: GhostMarkerProps) {
    return <CommentMarker x={x} y={y} isNew />;
}
