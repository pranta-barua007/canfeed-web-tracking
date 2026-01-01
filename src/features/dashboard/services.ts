import 'server-only';

import { db } from "@/db";
import { comments } from "@/db/schema";
import { desc, sql } from "drizzle-orm";

import { type GroupedWorkspace } from "./types";

export async function getGroupedWorkspaces(): Promise<GroupedWorkspace[]> {
    try {
        // Fetch all unique URLs with their latest activity and count
        const stats = await db.select({
            url: comments.url,
            lastActive: sql<Date>`MAX(${comments.createdAt})`,
            count: sql<number>`COUNT(*)`,
        })
            .from(comments)
            .groupBy(comments.url)
            .orderBy(desc(sql`MAX(${comments.createdAt})`));

        // Group by Domain in Memory
        const groups: Record<string, GroupedWorkspace> = {};

        for (const stat of stats) {
            try {
                const urlObj = new URL(stat.url);
                const domain = urlObj.hostname;
                const path = urlObj.pathname + urlObj.search;

                if (!groups[domain]) {
                    groups[domain] = {
                        domain,
                        favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
                        lastActive: new Date(0), // Init with old date
                        totalComments: 0,
                        pages: []
                    };
                }

                const group = groups[domain];
                const lastActive = new Date(stat.lastActive);
                const count = Number(stat.count);

                // Update Group Stats
                if (lastActive > group.lastActive) {
                    group.lastActive = lastActive;
                }
                group.totalComments += count;

                // Add Page
                group.pages.push({
                    url: stat.url,
                    path: path === '/' ? '/' : path, // Show '/' for root
                    commentCount: count,
                    lastActive: lastActive
                });

            } catch {
                // Invalid URL in DB, skip
                console.warn("Skipping invalid URL in dashboard stats:", stat.url);
            }
        }

        // Convert to array and sort by recent activity
        return Object.values(groups).sort((a, b) =>
            b.lastActive.getTime() - a.lastActive.getTime()
        );

    } catch (error) {
        console.error("Failed to fetch dashboard workspaces:", error);
        return [];
    }
}
