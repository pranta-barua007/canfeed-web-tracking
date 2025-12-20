"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/store";

// Dynamic import to avoid SSR with Konva
const CanvasOverlay = dynamic(() => import("@/features/workspace/components/CanvasOverlay"), {
    ssr: false,
});

export default function ProxyExperimentPage() {
    const [url, setUrl] = useState("https://example.com");
    const [iframeSrc, setIframeSrc] = useState("");
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Use global store for comment mode to play nice with CanvasOverlay
    const { isCommentMode, toggleCommentMode, setDeviceScale } = useAppStore();

    useEffect(() => {
        setDeviceScale(1); // Reset scale for this test
    }, [setDeviceScale]);

    const handleLoad = () => {
        setIframeSrc(url);
    };

    return (
        <div className="p-8 h-screen flex flex-col gap-6 bg-zinc-50 dark:bg-zinc-950">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold">Client-Side Proxy Experiment (Archived)</h1>
                <p className="text-muted-foreground text-sm">Demonstration of why strict Proxy/Extension is required. Plain iframes cannot track interaction due to Same-Origin Policy.</p>
            </div>

            <div className="flex gap-4 items-center max-w-4xl">
                <div className="flex gap-2 flex-1">
                    <Input
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Enter URL (e.g., https://example.com)"
                    />
                    <Button onClick={handleLoad}>Load</Button>
                </div>

                <div className="flex items-center space-x-3 bg-white px-3 py-2 rounded-lg border shadow-sm">
                    <Switch id="mode" checked={isCommentMode} onCheckedChange={toggleCommentMode} />
                    <Label htmlFor="mode">Comment Mode</Label>
                </div>
                <Button
                    variant="secondary"
                    onClick={() => {
                        try {
                            const y = iframeRef.current?.contentWindow?.scrollY;
                            alert(`Scroll Y: ${y}`);
                        } catch (e) {
                            const message = e instanceof Error ? e.message : String(e);
                            alert(`BLOCKED: ${message}\nWe cannot read scroll position.`);
                        }
                    }}
                >
                    Get Scroll Y
                </Button>
            </div>

            <div className="flex-1 bg-white border rounded-lg overflow-hidden shadow-sm relative isolate">
                {/* The Real Canvas Overlay */}
                <div className="absolute inset-0 z-20 pointer-events-none">
                    <CanvasOverlay
                        width={1200} // Fixed width for test
                        height={800} // Fixed height for test
                        url={iframeSrc || "test"}
                        scale={1}
                    />
                </div>

                {/* The Iframe Container */}
                {iframeSrc ? (
                    <iframe
                        ref={iframeRef}
                        key={iframeSrc}
                        src={iframeSrc}
                        className="w-full h-full border-none"
                        title="Direct Iframe View"
                        // CRITICAL: We enable pointer events on iframe so you can scroll it.
                        // But CanvasOverlay usually blocks them in comment mode.
                        // Here we see the conflict: IF we block events, you can't scroll.
                        // IF we allow events, the canvas doesn't get the click.
                        style={{ pointerEvents: isCommentMode ? "none" : "auto" }}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        Enter a URL and click Load
                    </div>
                )}
            </div>
        </div>
    );
}
