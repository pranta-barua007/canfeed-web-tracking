"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { usePathname, useSearchParams } from "next/navigation";
import { Check, Copy, Share2 } from "lucide-react";

export function ShareButton() {
    const [copied, setCopied] = useState(false);
    const [url, setUrl] = useState("");
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Function to build the current URL from Next.js state
    const refreshUrl = useCallback(() => {
        if (typeof window !== "undefined") {
            const origin = window.location.origin;
            const params = searchParams.toString();
            const fullUrl = `${origin}${pathname}${params ? `?${params}` : ""}`;
            setUrl(fullUrl);
        }
    }, [pathname, searchParams]);

    // Handle popover opening
    const handleOpenChange = (open: boolean) => {
        if (open) {
            refreshUrl();
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy text: ", err);
        }
    };

    return (
        <Popover onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Share2 className="h-4 w-4" />
                    Share
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80">
                <div className="space-y-3">
                    <div className="space-y-1">
                        <h4 className="font-medium leading-none">Share Workspace</h4>
                        <p className="text-xs text-muted-foreground">
                            Copy the link below to share this workspace with others.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Input
                            value={url}
                            readOnly
                            tabIndex={-1}
                            onFocus={(e) => e.target.blur()}
                            className="h-8 text-xs select-none cursor-default focus-visible:ring-0"
                        />
                        <Button
                            size="sm"
                            className="h-8 px-2 shrink-0"
                            onClick={handleCopy}
                        >
                            {copied ? (
                                <Check className="h-3 w-3" />
                            ) : (
                                <Copy className="h-3 w-3" />
                            )}
                            <span className="sr-only">Copy</span>
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
