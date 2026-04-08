-- 플랫폼 관리자 역할: 기존 admin → platform_admin (테넌트 멤버 역할 admin과 구분)
UPDATE user SET role = 'platform_admin' WHERE role = 'admin';
