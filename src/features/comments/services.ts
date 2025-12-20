import 'server-only';

import { db } from "@/db";
import { comments, users } from "@/db/schema";
import { eq, desc, and, ilike, gt, sql, or } from "drizzle-orm";

export type GetCommentsParams = {
    url: string;
    search?: string;
    resolved?: boolean; // filter by status
    limit?: number;
    offset?: number;
    device?: string; // filter by device context (rough match)
    since?: Date; // filter by time
};

export async function getComments({
    url,
    search,
    resolved,
    limit = 20,
    offset = 0,
    since,
    device
}: GetCommentsParams) {
    console.log("[getComments] Params:", { url, search, resolved, limit, offset, since });
    try {
        const whereConditions = [eq(comments.url, url)];

        if (resolved !== undefined) {
            whereConditions.push(eq(comments.resolved, resolved));
        }

        if (since) {
            whereConditions.push(gt(comments.createdAt, since));
        }

        if (search) {
            whereConditions.push(ilike(comments.content, `%${search}%`));
        }

        // Device Filter (Multi-select)
        if (device) {
            const devices = device.split(",");
            const deviceConditions = [];

            for (const d of devices) {
                if (d === "mobile") {
                    deviceConditions.push(sql`cast(${comments.deviceContext}->>'width' as integer) < 500`);
                } else if (d === "tablet") {
                    deviceConditions.push(sql`cast(${comments.deviceContext}->>'width' as integer) >= 500 AND cast(${comments.deviceContext}->>'width' as integer) < 1000`);
                } else if (d === "desktop") {
                    deviceConditions.push(sql`cast(${comments.deviceContext}->>'width' as integer) >= 1000`);
                }
            }

            if (deviceConditions.length > 0) {
                const deviceFilterSql = or(...deviceConditions);
                if (deviceFilterSql) {
                    whereConditions.push(deviceFilterSql);
                }
            }
        }

        const data = await db.select({
            id: comments.id,
            content: comments.content,
            url: comments.url,
            x: comments.x,
            y: comments.y,
            selector: comments.selector,
            selectorFallback: comments.selectorFallback,
            resolved: comments.resolved,
            createdAt: comments.createdAt,
            updatedAt: comments.updatedAt,
            authorId: comments.authorId,
            deviceContext: comments.deviceContext,
            author: {
                id: users.id,
                name: users.name,
                image: users.image,
            }
        })
            .from(comments)
            .leftJoin(users, eq(comments.authorId, users.id))
            .where(and(...whereConditions))
            .orderBy(desc(comments.createdAt))
            .limit(limit)
            .offset(offset);

        return data;
    } catch (error) {
        console.error("Failed to fetch comments:", error);
        return [];
    }
}
