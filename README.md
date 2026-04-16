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

Create `.env.local` in the project root and set the Kakao Maps JavaScript key:

```env
NEXT_PUBLIC_KAKAO_MAP_JS_KEY=your_kakao_javascript_key_here
```

For backward compatibility, `NEXT_PUBLIC_KAKAO_MAP_KEY` is also supported.

### Production (GitHub Actions → Cloudflare Pages)

`NEXT_PUBLIC_*` values are inlined at **build time** when CI runs `npm run build`.  
Setting the key only in the Cloudflare dashboard does **not** inject it into that GitHub Actions build, which can cause `sdk.js` to return **401** in the browser.

Add the same key in the GitHub repository:

**Settings → Secrets and variables → Actions** → **Secrets** or **Variables** →  
name: `NEXT_PUBLIC_KAKAO_MAP_JS_KEY`, value: your Kakao **JavaScript** key.

Also register your production URL under the key’s **JavaScript SDK 도메인** in Kakao Developers.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
