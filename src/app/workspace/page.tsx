"use client";

import { Suspense, useEffect, useCallback, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useAppStore } from "@/store";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import CommentsSidebar from "@/features/comments/components/CommentsSidebar";
import { DeviceSelector } from "@/features/workspace/components/DeviceSelector";
import { DEVICE_PRESETS } from "@/features/workspace/types";
import { WorkspaceView } from "@/features/workspace/components/WorkspaceView";
import { ShareButton } from "@/features/workspace/components/ShareButton";
import Link from "next/link";
import { WorkspaceSkeleton } from "@/features/workspace/components/WorkspaceSkeleton";

function WorkspaceContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    // Source of Truth for Navigation
    const targetUrl = searchParams.get("url") || "https://example.com";

    // UI Local State (Instant & Shallow)
    const paramDevice = searchParams.get("device") || "desktop-large";
    const paramScale = parseFloat(searchParams.get("scale") || "1.0");
    const [device, setDevice] = useState(paramDevice);
    const { isCommentMode, toggleCommentMode, deviceScale, setDeviceScale } = useAppStore();

    // Sync UI state if URL params change externally (History back/forward or Home navigation)
    useEffect(() => {
        setDevice(paramDevice);
    }, [paramDevice]);

    useEffect(() => {
        if (paramScale !== deviceScale) setDeviceScale(paramScale);
    }, [paramScale, deviceScale, setDeviceScale]);

    // Derived State
    const dimensions = DEVICE_PRESETS[device] || DEVICE_PRESETS["desktop-large"];

    // Smart Hybrid URL Update
    const updateUrl = useCallback((updates: Record<string, string | null>) => {
        const params = new URLSearchParams(window.location.search);
        let changed = false;
        let isNavigation = false;

        Object.entries(updates).forEach(([key, value]) => {
            if (value === null) {
                if (params.has(key)) {
                    params.delete(key);
                    changed = true;
                    if (key === 'url') isNavigation = true;
                }
            } else if (params.get(key) !== value) {
                params.set(key, value);
                changed = true;
                if (key === 'url') isNavigation = true;
            }
        });

        if (changed) {
            const newUrl = `${pathname}?${params.toString()}`;

            // NAVIGATION: Must use router.replace to update RSC state and refresh sub-components
            if (isNavigation) {
                router.replace(newUrl);
            }
            // PURE UI: Use history.replaceState to avoid RSC log spam and increase snappiness
            else {
                window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);

                // Manually sync local state since we bypassed the router re-render
                if (updates.device) setDevice(updates.device);
                if (updates.scale) {
                    const s = parseFloat(updates.scale);
                    if (!isNaN(s)) setDeviceScale(s);
                }
            }
        }
    }, [router, pathname, setDeviceScale]);

    // Handle Device Change
    const changeDevice = useCallback((newDevice: string) => {
        updateUrl({ device: newDevice });
    }, [updateUrl]);

    // Manual Handler
    const handleManualDeviceChange = (newDevice: string) => {
        changeDevice(newDevice);
        if (useAppStore.getState().activeCommentId) {
            useAppStore.getState().setActiveCommentId(null);
        }
    };

    // Handle Scale Change
    const handleScaleChange = (newScale: number) => {
        setDeviceScale(newScale);
        updateUrl({ scale: newScale.toString() });
    };

    // Handle Iframe Navigation Messages
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'CANFEED_NAVIGATE' && event.data.url) {
                // updateUrl will automatically treat this as a navigation (deep) update
                updateUrl({ url: event.data.url });
            }
        };
        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [updateUrl]);

    // Handle Scroll to Comment with Auto-Device Switch
    const { activeCommentId, comments } = useAppStore();
    useEffect(() => {
        if (!activeCommentId) return;

        const comment = comments.find(c => c.id === activeCommentId);
        if (comment) {
            const ctx = comment.deviceContext as { width: number } | null;
            if (ctx && ctx.width && Math.abs(ctx.width - dimensions.width) > 5) {
                const matchingDevice = Object.keys(DEVICE_PRESETS).find(
                    key => Math.abs(DEVICE_PRESETS[key].width - ctx.width) < 5
                );

                if (matchingDevice && matchingDevice !== device) {
                    // Wrap in timeout to avoid sync setState during effect
                    setTimeout(() => changeDevice(matchingDevice), 0);
                    return;
                }
            }

            const iframe = document.getElementById("proxy-iframe") as HTMLIFrameElement;
            if (iframe && iframe.contentWindow) {
                const targetY = comment.y * dimensions.height;
                const offset = targetY - (dimensions.height / 3);
                iframe.contentWindow.scrollTo({ top: offset, behavior: "smooth" });
            }
        }
    }, [activeCommentId, comments, dimensions, device, changeDevice]);

    // Keyboard Shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "/") {
                e.preventDefault();
                toggleCommentMode();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [toggleCommentMode]);

    return (
        <div className="flex h-screen flex-col bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
            <header className="flex h-14 items-center gap-4 border-b bg-white px-6 dark:bg-zinc-950 shadow-sm z-50">
                <Link href="/">
                    <h1 className="font-bold text-lg">CanFeed</h1>
                </Link>

                <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800" />

                <DeviceSelector
                    device={device}
                    onChange={handleManualDeviceChange}
                    scale={deviceScale}
                    onScaleChange={handleScaleChange}
                />

                <div className="ml-auto flex items-center gap-4">
                    <div className="flex items-center space-x-3 bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800">
                        <Switch id="comment-mode" checked={isCommentMode} onCheckedChange={toggleCommentMode} />
                        <div className="flex items-center gap-2">
                            <Label htmlFor="comment-mode" className="cursor-pointer text-sm font-medium">Comment Mode</Label>
                            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 sm:flex">
                                <span className="text-xs">⌘</span>/
                            </kbd>
                        </div>
                    </div>
                    <ShareButton />
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                <CommentsSidebar />
                <main className="flex-1 overflow-auto bg-zinc-200/50 p-8 flex justify-center items-start dark:bg-zinc-900/50">
                    <WorkspaceView
                        targetUrl={targetUrl}
                        width={dimensions.width}
                        height={dimensions.height}
                        scale={deviceScale}
                        isCommentMode={isCommentMode}
                    />
                </main>
            </div>
        </div>
    );
}

export default function WorkspacePage() {
    return (
        <Suspense fallback={<WorkspaceSkeleton />}>
            <WorkspaceContent />
        </Suspense>
    )
}
