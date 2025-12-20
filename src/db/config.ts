export const DB_URL = process.env.NODE_ENV !== "production"
    ? process.env.POSTGRES_URL_LOCAL
    : process.env.POSTGRES_URL;    