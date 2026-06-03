import { betterAuth } from "better-auth";
import { fetchKakaoUserInfoForAuth } from "@/lib/kakao-auth-user-info";

type AuthEnv = CloudflareEnv & {
    BETTER_AUTH_SECRET?: string;
    /** OAuth 리디렉트·쿠키 기준 URL(예: https://wow-linku.co.kr). Pages 바인딩에 두면 process.env와 달라도 일관됨 */
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

    const baseURL = env.BETTER_AUTH_URL?.trim().replace(/\/+$/, "");
    const trustedOrigins = [
        ...(baseURL ? [baseURL] : []),
        "https://wow-linku.co.kr",
        "https://www.wow-linku.co.kr",
        "http://localhost:3000",
    ];

    return betterAuth({
        ...(baseURL ? { baseURL } : {}),
        trustedOrigins,
        database: env.DB, // D1 네이티브 드라이버 자동 감지 및 배치 처리 지원
        secret: env.BETTER_AUTH_SECRET,
        trustHost: true, // Edge Runtime 호스트 인식을 위해 최상위 옵션으로 이동
        advanced: {
            trustedProxyHeaders: true,
            useSecureCookies: true,
            defaultCookieAttributes: {
                sameSite: "lax",
                secure: true,
                path: "/",
            },
        },
        emailAndPassword: {
            enabled: true
        },
        socialProviders: {
            google: {
                clientId: env.GOOGLE_CLIENT_ID || "",
                clientSecret: env.GOOGLE_CLIENT_SECRET || "",
                ...(baseURL
                    ? { redirectURI: `${baseURL}/api/auth/callback/google` }
                    : {}),
                /**
                 * Google OAuth: `display=touch` — 모바일/터치에 맞는 계정 UI(전체 폭)로 유도.
                 * 미지정 시 일부 WebView/UA에서 데스크톱용(가운데 작은 카드) 화면이 노출될 수 있음.
                 * @see https://developers.google.com/identity/protocols/oauth2/web-server#creatingclient
                 */
                display: "touch",
            },
            kakao: {
                clientId: env.KAKAO_CLIENT_ID || "",
                clientSecret: env.KAKAO_CLIENT_SECRET || "",
                /**
                 * disableDefaultScope: true — scope 대체(추가 아님).
                 * account_email 은 비즈앱(또는 콘솔에 이메일 동의 설정) 없으면 KOE205 → 링크유 REST 키에서는 제외.
                 * 이메일은 getUserInfo에서 실제 수신값 또는 syntheticKakaoEmail(id)로 채움.
                 * Pet-ID Connect 비즈앱으로 Cloudflare 키를 바꾼 뒤 account_email 을 scope에 넣어도 됨.
                 */
                disableDefaultScope: true,
                scope: ["profile_nickname", "profile_image"],
                getUserInfo: fetchKakaoUserInfoForAuth,
            }
        },
    });
};
