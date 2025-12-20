import { defineConfig } from "drizzle-kit";
import { DB_URL } from "@/db/config";


export default defineConfig({
    schema: "./src/db/schema.ts",
    out: "./drizzle",
    dialect: "postgresql",
    dbCredentials: {
        url: DB_URL!,
    },
});
