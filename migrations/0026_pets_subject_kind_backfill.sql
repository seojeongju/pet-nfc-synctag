-- 멀티 모드(펫·메모리 등)에서 동일 owner 범위 목록이 섞이지 않도록,
-- subject_kind NULL/빈 값은 기존 스키마 기본값('pet')으로 통일합니다.
-- (배포: 웹/워커 코드의 엄격한 subject_kind = ? 쿼리 이전·동시에 적용 권장)

UPDATE pets
SET subject_kind = 'pet'
WHERE subject_kind IS NULL
   OR TRIM(COALESCE(subject_kind, '')) = '';
