"use server";

import { revalidatePath } from "next/cache";
import { getComments as getCommentsService, createComment as createCommentService, updateCommentResolution } from "./services";

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
        const newComment = await createCommentService(data);
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
        await updateCommentResolution(commentId, resolved);
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
