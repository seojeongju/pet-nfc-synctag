import { betterAuth } from "better-auth";

export const getAuth = (env: any) => {
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
        // Cloudflare Pages용 안정성 옵션 (세션 캐시 등 충돌 방지)
        advanced: {
            cookieCache: {
                enabled: false // Edge 환경 로그아웃/세션 유실 방지 가이드 반영
            }
        }
    });
};
