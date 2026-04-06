import { getRequestContext } from "@cloudflare/next-on-pages";

export function getDB() {
  const context = getRequestContext();
  if (!context || !context.env) {
    throw new Error("Unable to access Cloudflare bindings. Make sure you are running with 'wrangler pages dev' or deployed on Cloudflare Pages.");
  }
  return context.env.DB as unknown as D1Database;
}

export function getR2() {
  const context = getRequestContext();
  if (!context || !context.env) {
    throw new Error("Unable to access Cloudflare bindings. Make sure you are running with 'wrangler pages dev' or deployed on Cloudflare Pages.");
  }
  return context.env.R2 as unknown as R2Bucket;
}
