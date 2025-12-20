"use client";

import Link from "next/link";
import { MessageSquare, ExternalLink } from "lucide-react";

interface WorkspacePageItemProps {
    url: string;
    path: string;
    commentCount: number;
}

export function WorkspacePageItem({
    url,
    path,
    commentCount,
}: WorkspacePageItemProps) {
    return (
        <Link
            href={`/workspace?url=${encodeURIComponent(url)}`}
            className="flex items-center gap-2 p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 group transition-colors text-sm"
        >
            <div className="flex-1 truncate text-muted-foreground group-hover:text-foreground">
                {path}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MessageSquare className="w-3 h-3" />
                {commentCount}
            </div>
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-50" />
        </Link>
    );
}
