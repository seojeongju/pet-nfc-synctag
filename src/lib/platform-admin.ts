/**
 * 플랫폼 전역 관리자(서비스 운영자). `/admin` 콘솔·크로스 테넌트 작업에 사용합니다.
 * 테넌트 내 역할(owner/admin/member)과 별개입니다.
 */
export const PLATFORM_ADMIN_ROLE = "platform_admin";

const LEGACY_PLATFORM_ADMIN_ROLE = "admin";

export function isPlatformAdminRole(role: string | null | undefined): boolean {
  return role === PLATFORM_ADMIN_ROLE || role === LEGACY_PLATFORM_ADMIN_ROLE;
}
