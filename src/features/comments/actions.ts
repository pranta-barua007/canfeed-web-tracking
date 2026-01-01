"use server";

import { db } from "@/db";
import { comments, users } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getComments as getCommentsService } from "./services";

import { type DeviceContext, type GetCommentsParams } from "./types";

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
    console.log("[Action] Creating comment for:", data.url, "Selector:", data.selector);
    try {
        const authorId = data.authorId || "anon";

        // Ensure 'anon' user exists to satisfy FK
        if (authorId === "anon") {
            await db.insert(users).values({
                id: "anon",
                name: "Anonymous",
                email: "anon@example.com",
                emailVerified: false,
                createdAt: new Date(),
                updatedAt: new Date()
            }).onConflictDoNothing().execute();
        }

        const [newComment] = await db.insert(comments).values({
            content: data.content,
            url: data.url,
            x: data.x,
            y: data.y,
            selector: data.selector,
            selectorFallback: data.selectorFallback,
            authorId: authorId,
            deviceContext: data.deviceContext
        }).returning();

        console.log("[Action] Comment created successfully:", newComment.id);
        revalidatePath("/workspace");
        return newComment;
    } catch (error) {
        console.error("[Action] Failed to create comment:", error);
        return null;
    }
}

export async function toggleResolveComment(commentId: string, resolved: boolean) {
    try {
        await db.update(comments)
            .set({ resolved, updatedAt: new Date() })
            .where(eq(comments.id, commentId));

        revalidatePath("/workspace");
        return { success: true };
    } catch (error) {
        console.error("Failed to toggle resolve:", error);
        return { success: false };
    }
}

export async function getComments(params: GetCommentsParams) {
    return getCommentsService(params);
}
