"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DeviceIcon } from "@/components/ui/device-icon";
import { Undo2, CircleCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { type CommentType } from "@/store";

interface CommentItemProps {
    comment: CommentType;
    isActive: boolean;
    onClick: () => void;
    onResolveToggle: (e: React.MouseEvent) => void;
}

export function CommentItem({
    comment,
    isActive,
    onClick,
    onResolveToggle,
}: CommentItemProps) {
    const ctx = comment.deviceContext as { width: number } | null;

    return (
        <Card
            className={`
        cursor-pointer transition-all duration-200 border group
        ${isActive
                    ? "border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm ring-1 ring-blue-500/20"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                }
      `}
            onClick={onClick}
        >
            <CardHeader className="p-3 pb-2 flex flex-row gap-2 items-start space-y-0 relative">
                <Avatar className="h-6 w-6 ring-1 ring-zinc-100 dark:ring-zinc-800">
                    <AvatarImage src={comment.author?.avatar} />
                    <AvatarFallback className="text-[10px]">
                        {comment.author?.name?.[0] || "?"}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold truncate text-zinc-900 dark:text-zinc-100 leading-none mb-1">
                                {comment.author?.name || "Anonymous"}
                            </span>
                        </div>

                        <div className="flex flex-col items-end gap-0.5">
                            <span className="text-[10px] text-muted-foreground">
                                {comment.createdAt
                                    ? formatDistanceToNow(new Date(comment.createdAt), {
                                        addSuffix: true,
                                    })
                                    : ""}
                            </span>
                            {ctx?.width && (
                                <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                                    <DeviceIcon width={ctx.width} className="h-3 w-3" />
                                    <span>{ctx.width}px</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-3 pt-0 text-sm text-zinc-600 dark:text-zinc-300 pl-[3rem]">
                <p className="leading-relaxed break-words whitespace-pre-wrap">
                    {comment.content}
                </p>

                <div className="mt-3 flex justify-end">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onResolveToggle}
                        className={`
              h-6 px-2 text-xs gap-1.5 transition-colors
              ${comment.resolved
                                ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                : "text-muted-foreground hover:text-green-600 hover:bg-green-50"
                            }
            `}
                    >
                        {comment.resolved ? (
                            <Undo2 className="h-3 w-3" />
                        ) : (
                            <CircleCheck className="h-3 w-3" />
                        )}
                        {comment.resolved ? "Unresolve" : "Resolve"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
