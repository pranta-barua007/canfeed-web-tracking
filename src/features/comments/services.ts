import 'server-only';

import { db } from "@/db";
import { comment, user } from "@/db/schema";
import { eq, desc, and, ilike, gt, sql, or } from "drizzle-orm";

import { type GetCommentsParams, type DeviceContext } from "./types";

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
        const whereConditions = [eq(comment.url, url)];

        if (resolved !== undefined) {
            whereConditions.push(eq(comment.resolved, resolved));
        }

        if (since) {
            whereConditions.push(gt(comment.createdAt, since));
        }

        if (search) {
            whereConditions.push(ilike(comment.content, `%${search}%`));
        }

        // Device Filter (Multi-select)
        if (device) {
            const devices = device.split(",");
            const deviceConditions = [];

            for (const d of devices) {
                if (d === "mobile") {
                    deviceConditions.push(sql`cast(${comment.deviceContext}->>'width' as integer) < 500`);
                } else if (d === "tablet") {
                    deviceConditions.push(sql`cast(${comment.deviceContext}->>'width' as integer) >= 500 AND cast(${comment.deviceContext}->>'width' as integer) < 1000`);
                } else if (d === "desktop") {
                    deviceConditions.push(sql`cast(${comment.deviceContext}->>'width' as integer) >= 1000`);
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
            id: comment.id,
            content: comment.content,
            url: comment.url,
            x: comment.x,
            y: comment.y,
            selector: comment.selector,
            selectorFallback: comment.selectorFallback,
            resolved: comment.resolved,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
            authorId: comment.authorId,
            deviceContext: comment.deviceContext,
            author: {
                id: user.id,
                name: user.name,
                image: user.image,
            }
        })
            .from(comment)
            .leftJoin(user, eq(comment.authorId, user.id))
            .where(and(...whereConditions))
            .orderBy(desc(comment.createdAt))
            .limit(limit)
            .offset(offset);

        return data;
    } catch (error) {
        console.error("Failed to fetch comment:", error);

        return [];
    }
}

export async function createComment(data: {
    content: string;
    url: string;
    x: number;
    y: number;
    selector?: string;
    selectorFallback?: Record<string, unknown> | null;
    authorId?: string; // Optional if anon
    deviceContext?: DeviceContext;
}) {
    const authorId = data.authorId || "anon";

    // Ensure 'anon' user exists to satisfy FK
    if (authorId === "anon") {
        await db.insert(user).values({
            id: "anon",
            name: "Anonymous",
            email: "anon@example.com",
            emailVerified: false,
            createdAt: new Date(),
            updatedAt: new Date()
        }).onConflictDoNothing().execute();
    }

    const [newComment] = await db.insert(comment).values({
        content: data.content,
        url: data.url,
        x: data.x,
        y: data.y,
        selector: data.selector,
        selectorFallback: data.selectorFallback,
        authorId: authorId,
        deviceContext: data.deviceContext
    }).returning();

    return newComment;
}

export async function updateCommentResolution(commentId: string, resolved: boolean) {
    await db.update(comment)
        .set({ resolved, updatedAt: new Date() })
        .where(eq(comment.id, commentId));
}
