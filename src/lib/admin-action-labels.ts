/**
 * admin_action_logs.action 값 → 운영자용 한글 설명
 * DB에만 있는 커스텀 값은 그대로 보조 표시
 */
const LABELS: Record<string, string> = {
  bulk_register: "UID 대량 등록",
  nfc_web_write: "Web NFC URL 기록",
  nfc_web_read: "Web NFC UID 읽기",
  nfc_native_write: "네이티브 앱 URL 기록",
  nfc_native_write_rejected: "네이티브 기록 거부(보안)",
  nfc_native_handoff: "네이티브 앱 핸드오프 발급",
  tag_link: "태그–관리 대상 연결",
  tag_unlink: "태그 연결 해제",
  platform_user_role: "플랫폼 사용자 역할 변경",
  platform_user_email: "플랫폼 사용자 이메일 변경",
  platform_user_password_reset: "비밀번호 재설정 안내",
  platform_user_subscription: "구독/플랜 변경",
  platform_user_delete: "사용자 삭제",
  tenant_create_by_admin: "조직 생성(관리자)",
  tenant_member_upsert_by_admin: "조직 멤버 등록/수정",
  tenant_member_role_change_by_admin: "조직 멤버 역할 변경",
  tenant_member_remove_by_admin: "조직 멤버 제거",
  tenant_status_change_by_admin: "조직 상태 변경",
  tenant_rename_by_admin: "조직명 변경",
  tenant_allowed_modes_by_admin: "조직 허용 모드 설정",
  tenant_invite_create_by_admin: "조직 초대 생성",
};

export function getAdminActionDisplayLabel(action: string): string {
  const key = (action ?? "").trim();
  if (!key) return "알 수 없음";
  return LABELS[key] ?? key;
}
