import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  // 관리자 영역은 Workbox runtime 캐시(NetworkFirst 등)를 쓰면 이전 빌드 JS/HTML과
  // 새 배포 서버 액션 ID가 어긋나 "Server Action was not found"가 날 수 있음 → 네트워크만 사용.
  extendDefaultRuntimeCaching: true,
  workboxOptions: {
    /** 발견자 Web Push 알림 클릭·표시 (public/sw-push-listener.js) */
    importScripts: ["/sw-push-listener.js"],
    // 서비스 워커가 제어하지 않을 경로 목록
    exclude: [
      /^\/admin(\/.*)?$/,
      /^\/api(\/.*)?$/,
    ],
    runtimeCaching: [
      {
        // 관리자 및 API 경로는 무조건 네트워크만 사용 (캐시 절대 금지)
        urlPattern: ({ url }) => url.pathname.startsWith("/admin") || url.pathname.startsWith("/api"),
        handler: "NetworkOnly",
        options: {
          backgroundSync: {
            name: "admin-sync-queue",
            options: {
              maxRetentionTime: 24 * 60,
            },
          },
        },
      },
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
};

export default withPWA(nextConfig);
