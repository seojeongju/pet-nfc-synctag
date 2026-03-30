import { betterAuth } from "better-auth";
import { d1Adapter } from "better-auth/adapters/cloudflare-d1";

export const getAuth = (db: D1Database) => betterAuth({
    database: d1Adapter(db, {
        schema: {
            user: "users",
            session: "sessions",
            account: "accounts",
            verification: "verifications",
        }
    }),
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        },
        kakao: {
            clientId: process.env.KAKAO_CLIENT_ID || "",
            clientSecret: process.env.KAKAO_CLIENT_SECRET || "",
        }
    }
});
