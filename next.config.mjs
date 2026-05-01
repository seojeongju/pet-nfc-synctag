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
    runtimeCaching: [
      {
        urlPattern: ({ url }) => url.pathname.startsWith("/admin"),
        handler: "NetworkOnly",
        method: "GET",
      },
      {
        urlPattern: ({ url }) => url.pathname.startsWith("/admin"),
        handler: "NetworkOnly",
        method: "POST",
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
