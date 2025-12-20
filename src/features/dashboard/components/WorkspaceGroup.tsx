"use client";

import {
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { formatDistanceToNow } from "date-fns";
import NextImage from "next/image";
import { WorkspacePageItem } from "./WorkspacePageItem";
import { type GroupedWorkspace } from "../services";

interface WorkspaceGroupProps {
    group: GroupedWorkspace;
}

export function WorkspaceGroup({ group }: WorkspaceGroupProps) {
    return (
        <AccordionItem key={group.domain} value={group.domain}>
            <AccordionTrigger className="hover:no-underline py-3 px-1">
                <div className="flex items-center gap-3 w-full text-left">
                    <NextImage
                        src={group.favicon}
                        alt={group.domain}
                        width={20}
                        height={20}
                        className="rounded-sm bg-zinc-100"
                    />
                    <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{group.domain}</div>
                        <div className="text-xs text-muted-foreground font-normal">
                            {group.totalComments} comments • active{" "}
                            {formatDistanceToNow(group.lastActive)} ago
                        </div>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent>
                <div className="flex flex-col gap-1 pl-2">
                    {group.pages.map((page) => (
                        <WorkspacePageItem
                            key={page.url}
                            url={page.url}
                            path={page.path}
                            commentCount={page.commentCount}
                        />
                    ))}
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
