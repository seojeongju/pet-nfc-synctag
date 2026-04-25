export const runtime = "edge";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
      <h1 className="text-2xl font-black text-slate-900">개인정보 처리방침 (요약)</h1>
      <div className="mt-4 space-y-3 text-sm font-medium leading-relaxed text-slate-700">
        <p>1) 수집 항목: 계정 정보(이메일, 이름), 태그/기기 식별자, 서비스 사용 로그.</p>
        <p>2) 위치 정보: 발견자 또는 사용자의 명시적 동작과 권한 허용 시에만 저장/전달됩니다.</p>
        <p>3) 이용 목적: 보호자 연결, 사고 대응, 보안 모니터링, 서비스 품질 개선.</p>
        <p>4) 보관 및 파기: 법령/분쟁 대응 기간을 제외한 데이터는 정책에 따라 파기합니다.</p>
        <p>5) 본 문서는 요약본이며, 실제 운영 방침은 법률 검토본으로 수시 갱신될 수 있습니다.</p>
      </div>
    </div>
  );
}

