/**
 * 로컬/CI: D1에 역별 교통약자 시설 동기화 (공공데이터 API 키 필요)
 *
 * Usage:
 *   PUBLIC_DATA_API_KEY=... npm run d1:apply:wayfinder-station-facilities
 *   curl -X POST https://wow-linku.co.kr/api/admin/wayfinder/sync-accessibility \
 *     -H "Cookie: ..." -H "Content-Type: application/json" \
 *     -d '{"stationId":"stn--107"}'
 */
console.log(`
링크유-동행 교통약자 시설 동기화

1. D1 마이그레이션: npm run d1:apply:wayfinder-station-facilities
2. Cloudflare Pages에 PUBLIC_DATA_API_KEY 설정 (data.go.kr · 서울교통공사 교통약자이용정보)
3. 플랫폼 관리자 세션으로 POST /api/admin/wayfinder/sync-accessibility
   - 전체 파일럿: {}
   - 단일 역: {"stationId":"stn--107"} 또는 {"stationId":"seoul-station"}
`);
