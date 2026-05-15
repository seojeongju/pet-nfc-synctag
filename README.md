This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Environment Variables

Create `.env.local` in the project root and set the Kakao Maps **JavaScript** key (from [Kakao Developers](https://developers.kakao.com/) → My Application → App Keys → **JavaScript key**).

```env
# Either is enough for `/api/kakao-map-config` (used by geofence / live maps):
KAKAO_MAP_JS_KEY=your_kakao_javascript_key_here
# or:
NEXT_PUBLIC_KAKAO_MAP_JS_KEY=your_kakao_javascript_key_here
```

For backward compatibility, `NEXT_PUBLIC_KAKAO_MAP_KEY` is also supported.

### Production (Cloudflare Pages)

`/api/kakao-map-config` reads, in order: **`KAKAO_MAP_JS_KEY`** → `NEXT_PUBLIC_KAKAO_MAP_JS_KEY` → `NEXT_PUBLIC_KAKAO_MAP_KEY` (from the Worker `env` object, then `process.env`).

**Recommended:** set **`KAKAO_MAP_JS_KEY`** in **Cloudflare Dashboard → Workers & Pages → your project → Settings → Environment variables → Production** to the same value as the Kakao **JavaScript** key. Then **redeploy** (or trigger a new deployment) so the variable is applied. This avoids relying on the key being present only at GitHub Actions build time.

### Production (GitHub Actions → Cloudflare Pages)

`NEXT_PUBLIC_*` values are inlined at **build time** when CI runs `npm run build`.  
If the key exists only in the Cloudflare dashboard and **not** in the GitHub Actions environment for `npm run build`, some client bundles may still miss it—but **`KAKAO_MAP_JS_KEY` in Pages** is enough for map config served by `/api/kakao-map-config`.

Add the same key in the GitHub repository if you also want it at build time:

**Settings → Secrets and variables → Actions** → **Secrets** or **Variables** →  
name: `NEXT_PUBLIC_KAKAO_MAP_JS_KEY`, value: your Kakao **JavaScript** key.

Recommended production values:

- GitHub Actions variable: `NEXT_PUBLIC_APP_URL=https://wow-linku.co.kr`
- Cloudflare Pages production environment variable: `BETTER_AUTH_URL=https://wow-linku.co.kr`
- Cloudflare Pages production environment variable (optional): `GOOGLE_SITE_VERIFICATION=<google meta content>`
- Cloudflare Pages production environment variable (optional): `NAVER_SITE_VERIFICATION=<naver meta content>`

Also register both `https://wow-linku.co.kr` and `https://www.wow-linku.co.kr` under the Kakao key’s **JavaScript SDK 도메인**.  
The app redirects `www.wow-linku.co.kr` to the apex domain, so use `https://wow-linku.co.kr` as the canonical base URL for OAuth/callback settings.

If the map shows **“SDK 로드 실패”** but the key is set: the browser origin must match Kakao **Web 플랫폼 사이트 도메인** exactly (including `https://`). For Cloudflare **Preview** URLs (`https://<hash>.<project>.pages.dev`), add that host in Kakao as well—wildcards are not always accepted, use the full preview origin you open in the browser.

## SEO / AEO

The app now exposes:

- `https://wow-linku.co.kr/robots.txt`
- `https://wow-linku.co.kr/sitemap.xml`

Recommended production steps:

1. Add `https://wow-linku.co.kr` as a property in **Google Search Console**
2. Submit `https://wow-linku.co.kr/sitemap.xml`
3. Add `wow-linku.co.kr` in **Naver Search Advisor**
4. Submit the same sitemap URL there as well
5. If you use HTML meta verification, store the issued values in:
   - `GOOGLE_SITE_VERIFICATION`
   - `NAVER_SITE_VERIFICATION`

## Native NFC Writer Fallback

For devices where Web NFC `NDEFWriter` is unavailable, this repo includes an Android app project at `android-native-writer`.

- Enable native handoff button in web UI:
  - `NEXT_PUBLIC_NFC_NATIVE_HANDOFF_ENABLED=true`
- Optional Play Store link for install CTA:
  - `NEXT_PUBLIC_NFC_NATIVE_APP_STORE_URL=https://play.google.com/store/apps/details?id=com.petidconnect.nfcwriter`

Server-side secrets for callback verification remain required:

- `NFC_NATIVE_HANDOFF_SECRET`
- `NFC_NATIVE_APP_API_KEY`
- Optional HMAC: `NFC_NATIVE_APP_HMAC_SECRET_CURRENT`, `NFC_NATIVE_APP_HMAC_SECRET_NEXT`

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
