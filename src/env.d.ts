import { D1Database, R2Bucket } from "@cloudflare/workers-types";

declare global {
  interface CloudflareEnv {
    DB: D1Database;
    R2: R2Bucket;
    NEXT_PUBLIC_KAKAO_MAP_JS_KEY?: string;
    NEXT_PUBLIC_KAKAO_MAP_KEY?: string;
    /** 카카오 로컬 REST API (coord2address 등). 서버 전용 */
    KAKAO_REST_API_KEY?: string;
    /** 공공데이터포털 등 외부 API (관리자 금 시세 등) */
    PUBLIC_DATA_API_KEY?: string;
  }
}

declare module "@cloudflare/next-on-pages" {
  export function getRequestContext(): {
    env: CloudflareEnv;
    context: {
        waitUntil(promise: Promise<unknown>): void;
    };
  };
}
