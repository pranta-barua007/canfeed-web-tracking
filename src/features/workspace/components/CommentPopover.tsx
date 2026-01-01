"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle2 } from "lucide-react";
import { type CommentType } from '@/features/comments/types';


interface CommentPopoverProps {
    x: number; // Pixel position
    y: number;
    comment?: CommentType;
    isNew?: boolean;
    onSave?: (content: string) => void;
    onResolve?: () => void;
    onClose: () => void;
}

export function CommentPopover({ x, y, comment, isNew, onSave, onClose, onResolve }: CommentPopoverProps) {
    const [content, setContent] = useState(comment?.content || "");

    const handleSave = () => {
        if (onSave && content.trim()) {
            onSave(content);
        }
    };

    return (
        <div
            className="absolute z-[60] shadow-xl"
            style={{ top: y + 20, left: x + 20 }} // Offset slightly from marker
        >
            <Card className="w-64">
                <CardHeader className="p-3 pb-0 flex flex-row items-center gap-2">
                    <Avatar className="h-6 w-6">
                        <AvatarImage src={comment?.author?.avatar} />
                        <AvatarFallback>{comment?.author?.name?.[0] || "?"}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-semibold text-muted-foreground">
                        {isNew ? "New Comment" : comment?.author?.name || "Anonymous"}
                    </span>
                </CardHeader>
                <CardContent className="p-3">
                    {isNew ? (
                        <Textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Add a comment..."
                            className="min-h-[80px] text-sm"
                            autoFocus
                        />
                    ) : (
                        <p className="text-sm">{comment?.content}</p>
                    )}
                </CardContent>
                <CardFooter className="p-3 pt-0 flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={onClose} className="h-7 text-xs">
                        {isNew ? "Cancel" : "Close"}
                    </Button>
                    {isNew && (
                        <Button size="sm" onClick={handleSave} className="h-7 text-xs">
                            Post
                        </Button>
                    )}
                    {!isNew && !comment?.resolved && onResolve && (
                        <Button variant="outline" size="sm" onClick={onResolve} className="h-7 text-xs gap-1 hover:bg-green-50 hover:text-green-600 hover:border-green-200">
                            <CheckCircle2 className="h-3 w-3" />
                            Resolve
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
