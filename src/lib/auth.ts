import { betterAuth } from "better-auth";

// Cloudflare 환경(env)를 인자로 받아 betterAuth 인스턴스를 생성하는 팩토리 함수
export const getAuth = (env: any) => {
    return betterAuth({
        database: env.DB as unknown as D1Database,
        secret: env.BETTER_AUTH_SECRET,
        baseURL: env.BETTER_AUTH_URL,
        socialProviders: {
            google: {
                clientId: env.GOOGLE_CLIENT_ID || "",
                clientSecret: env.GOOGLE_CLIENT_SECRET || "",
            },
            kakao: {
                clientId: env.KAKAO_CLIENT_ID || "",
                clientSecret: env.KAKAO_CLIENT_SECRET || "",
            }
        }
    });
};
