"use client";

import dynamic from "next/dynamic";

const CanvasOverlay = dynamic(() => import("./CanvasOverlay"), {
    ssr: false,
});

interface WorkspaceViewProps {
    targetUrl: string;
    width: number;
    height: number;
    scale: number;
    isCommentMode: boolean;
}

export function WorkspaceView({ targetUrl, width, height, scale, isCommentMode }: WorkspaceViewProps) {
    return (
        <div
            className="bg-white shadow-2xl transition-all duration-300 relative border ring-1 ring-zinc-900/5 mb-8"
            style={{
                width: width,
                height: height,
                transform: `scale(${scale})`,
                transformOrigin: "top center",
                marginBottom: height * (scale - 1) // Compensate for scale margin
            }}
        >
            {/* The Proxy Iframe */}
            <iframe
                id="proxy-iframe"
                key={targetUrl} // Force remount on URL change to clear state/listeners
                src={`/api/proxy?url=${encodeURIComponent(targetUrl)}`}
                className="w-full h-full border-none"
                style={{ pointerEvents: isCommentMode ? "none" : "auto" }} // Pass through clicks unless commenting
            />

            {/* The Interaction Layer */}
            <div className="absolute inset-0 z-10 pointer-events-none">
                <CanvasOverlay
                    key={targetUrl} // Force remount to reset scrollTop state and re-attach listeners
                    width={width}
                    height={height}
                    url={targetUrl}
                    scale={scale}
                />
            </div>
        </div>
    );
}
