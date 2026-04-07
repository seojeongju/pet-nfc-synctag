import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    // baseURL을 명시하지 않으면 자동으로 현재 접속 중인 도메인(origin)을 베이스로 사용합니다.
    // 이는 로컬 개발 환경과 Cloudflare 운영 환경 모두에서 가장 안정적으로 작동하는 방식입니다.
});

export const { signIn, signOut, useSession } = authClient;
