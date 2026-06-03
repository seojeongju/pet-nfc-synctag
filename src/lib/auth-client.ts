import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    // baseURL을 명시하지 않으면 자동으로 현재 접속 중인 도메인(origin)을 베이스로 사용합니다.
    fetchOptions: {
        credentials: "include",
    },
});

export const { signIn, signUp, signOut, useSession } = authClient;
