import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { drizzle as drizzleVercel } from 'drizzle-orm/vercel-postgres';
import { sql } from '@vercel/postgres';
import { Pool } from 'pg';
import * as schema from "./schema";
import { DB_URL } from './config';

const globalForDb = globalThis as unknown as {
    conn: Pool | undefined;
};

let db: ReturnType<typeof drizzlePg> | ReturnType<typeof drizzleVercel>;

db = drizzleVercel(sql, { schema });

if (process.env.NODE_ENV !== 'production') {
    const conn = globalForDb.conn ?? new Pool({
        connectionString: DB_URL!,
    });

    globalForDb.conn = conn;

    db = drizzlePg(conn, { schema });
}

export { db };