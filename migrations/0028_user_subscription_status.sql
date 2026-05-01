-- user.subscriptionStatus: 레거시 개인 플랜 코드(구독 테이블보다 먼저 쓰이던 컬럼).
-- 예전에 생성된 D1에는 없을 수 있음 → 없으면 한 번만 적용.
ALTER TABLE user ADD COLUMN subscriptionStatus TEXT DEFAULT 'free';
