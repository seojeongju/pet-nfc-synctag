# 모드 공지 운영 요약

## 노출 규칙

- status = published: 발행된 공지만 보호자에게 노출
- subject_kind: 대시보드 모드(kind 쿼리)와 일치
- published_at / expires_at: 기간 밖이면 제외
- target_tenant_id: NULL이면 개인 대시보드와 모든 조직 공통. 값이 있으면 해당 조직의 ?tenant= 컨텍스트에서만 노출
- target_batch_id: NULL이면 모드 전체. 값이 있으면 해당 배치 태그가 있는 계정에서만 노출

위 조건은 모두 AND로 결합됩니다.

## 수동 검증 시나리오

1. 전역 공지: target_tenant_id와 target_batch_id 비움
2. 조직 전용: target_tenant_id만 설정 후 ?tenant= 일치 여부
3. 배치 한정: target_batch_id 설정 후 태그 존재 여부
4. 만료: expires_at 과거 시 미노출

배포 후 D1에 migrations/0010_mode_announcements_target_tenant.sql 적용을 확인하세요.
