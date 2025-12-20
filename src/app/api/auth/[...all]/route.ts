import { auth } from "@/lib/auth"; // import your auth instance
import { toNextJsHandler } from "better-auth/next-js";

export const { POST, GET } = toNextJsHandler(auth);
