-- 링크유-동행: wayfinder_spots 를 pet/elder 등 모드와 분리한 companion 스코프로 통일
UPDATE wayfinder_spots
SET subject_kind = 'companion'
WHERE subject_kind IS NULL OR subject_kind != 'companion';
