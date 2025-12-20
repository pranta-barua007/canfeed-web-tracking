import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db"; // Import your Drizzle instance
import * as schema from "@/db/schema";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg", // or "mysql", "sqlite"
        schema: schema
    }),
    emailAndPassword: {
        enabled: true
    },
    // socialProviders: {
    //   github: { 
    //     clientId: process.env.GITHUB_CLIENT_ID, 
    //     clientSecret: process.env.GITHUB_CLIENT_SECRET 
    //   } 
    // }
});
