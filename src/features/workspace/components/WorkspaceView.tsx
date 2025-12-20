"use client";

import dynamic from "next/dynamic";
import { useState, useRef } from "react";
import { Loader2 } from "lucide-react";

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
    const [isLoading, setIsLoading] = useState(true);
    const iframeRef = useRef<HTMLIFrameElement>(null);

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
            {/* Loading Spinner */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-50 z-20">
                    <div className="flex flex-col items-center gap-2 text-zinc-500">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <span className="text-sm font-medium">Loading preview...</span>
                    </div>
                </div>
            )}

            {/* The Proxy Iframe */}
            <iframe
                ref={iframeRef}
                id="proxy-iframe"
                key={targetUrl} // Force remount on URL change to clear state/listeners
                src={`/api/proxy?url=${encodeURIComponent(targetUrl)}`}
                className="w-full h-full border-none"
                style={{ pointerEvents: isCommentMode ? "none" : "auto" }} // Pass through clicks unless commenting

                // Performance & SEO
                loading="lazy"
                title={`Preview of ${targetUrl}`}

                // Security
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"

                // UX
                onLoad={() => setIsLoading(false)}
            />

            {/* The Interaction Layer */}
            <div className={`absolute inset-0 z-10 pointer-events-none transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
                <CanvasOverlay
                    key={targetUrl} // Force remount to reset scrollTop state and re-attach listeners
                    width={width}
                    height={height}
                    url={targetUrl}
                    scale={scale}
                    iframeRef={iframeRef}
                />
            </div>
        </div>
    );
}
