import { betterAuth } from "better-auth";

type AuthEnv = CloudflareEnv & {
    BETTER_AUTH_SECRET?: string;
    BETTER_AUTH_URL?: string;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    KAKAO_CLIENT_ID?: string;
    KAKAO_CLIENT_SECRET?: string;
};

export const getAuth = (env: AuthEnv) => {
    // 필수 환경 변수 체크 - 누락될 경우 구체적인 에러 발생 유도
    if (!env.BETTER_AUTH_SECRET) {
        throw new Error("Missing BETTER_AUTH_SECRET in environment variables");
    }
    if (!env.BETTER_AUTH_URL) {
        throw new Error("Missing BETTER_AUTH_URL in environment variables");
    }

    return betterAuth({
        database: env.DB, // D1 네이티브 드라이버 자동 감지 및 배치 처리 지원
        secret: env.BETTER_AUTH_SECRET,
        baseURL: env.BETTER_AUTH_URL,
        trustHost: true, // Edge Runtime 호스트 인식을 위해 최상위 옵션으로 이동
        emailAndPassword: {
            enabled: true
        },
        socialProviders: {
            google: {
                clientId: env.GOOGLE_CLIENT_ID || "",
                clientSecret: env.GOOGLE_CLIENT_SECRET || "",
            },
            kakao: {
                clientId: env.KAKAO_CLIENT_ID || "",
                clientSecret: env.KAKAO_CLIENT_SECRET || "",
            }
        },
    });
};
