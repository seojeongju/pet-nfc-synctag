import { D1Database, R2Bucket } from "@cloudflare/workers-types";

declare global {
  interface CloudflareEnv {
    DB: D1Database;
    R2: R2Bucket;
  }
}

declare module "@cloudflare/next-on-pages" {
  export function getRequestContext(): {
    env: CloudflareEnv;
    context: {
        waitUntil(promise: Promise<any>): void;
    };
  };
}
