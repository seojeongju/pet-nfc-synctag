-- 파일럿 역 좌표(대략). 4단계 공공데이터 연동 시 external_ref 로 매핑 예정.
INSERT OR IGNORE INTO wayfinder_stations (id, name, lines, latitude, longitude, is_active, external_ref)
VALUES
  ('seoul-station', '서울역', '1호선·4호선·경부선 등', 37.554648, 126.972559, 1, NULL),
  ('gangnam-station', '강남역', '2호선·신분당선', 37.497950, 127.027621, 1, NULL),
  ('jamsil-station', '잠실역', '2호선·8호선', 37.513264, 127.100041, 1, NULL),
  ('hongdae-station', '홍대입구', '2호선·공항철도·경의중앙선', 37.557192, 126.925381, 1, NULL);
