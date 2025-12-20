import { pgTable, text, timestamp, boolean, uuid, jsonb, doublePrecision } from "drizzle-orm/pg-core";
import { type InferSelectModel } from "drizzle-orm";

export type User = InferSelectModel<typeof users>;
export type Comment = InferSelectModel<typeof comments>;

// --- Better Auth Schema (Simplified/Standard) ---
export const users = pgTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("emailVerified").notNull(),
    image: text("image"),
    createdAt: timestamp("createdAt").notNull(),
    updatedAt: timestamp("updatedAt").notNull(),
});

export const sessions = pgTable("session", {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expiresAt").notNull(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    userId: text("userId").notNull().references(() => users.id),
});

export const accounts = pgTable("account", {
    id: text("id").primaryKey(),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    userId: text("userId").notNull().references(() => users.id),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    expiresAt: timestamp("expiresAt"),
    password: text("password"),
});

export const verificationTokens = pgTable("verificationToken", {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
});

// --- CanFeed Domain Schema ---

export const comments = pgTable("comment", {
    id: uuid("id").primaryKey().defaultRandom(),
    content: text("content").notNull(),

    // The URL this comment belongs to (Canonical URL)
    url: text("url").notNull(),

    // Coordinates (Percentage 0-1)
    x: doublePrecision("x").notNull(),
    y: doublePrecision("y").notNull(),

    // Visual Context
    snapshot: jsonb("snapshot"), // Stores { imageRef, pHash, offset, etc. }
    deviceContext: jsonb("device_context"), // { breakpoint: 'mobile', width: 375 }
    selector: text("selector"),
    selectorFallback: jsonb("selector_fallback"), // Stores { text, attributes, etc. }

    // Status
    resolved: boolean("resolved").default(false),

    // Relations
    authorId: text("authorId").references(() => users.id),
    parentId: uuid("parentId"), // For threading

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Self-reference for replies cannot be easily defined in one go in some ORMs without circular refs, 
// but Drizzle handles it if we don't enforce foreign key strictly strictly or define it safely.
// For now, parentId is just a UUID.
