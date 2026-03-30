import { getRequestContext } from "@cloudflare/next-on-pages";

export function getDB() {
  const context = getRequestContext();
  return context.env.DB as unknown as D1Database;
}

export function getR2() {
  const context = getRequestContext();
  return context.env.R2 as unknown as R2Bucket;
}
