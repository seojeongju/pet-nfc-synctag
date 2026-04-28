export const runtime = "edge";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
      <h1 className="text-2xl font-black text-slate-900">개인정보 처리방침</h1>
      <p className="mt-2 text-xs font-semibold text-slate-500">
        시행일: 2026-04-28 · 링크유(Link-U) 서비스
      </p>

      <div className="mt-8 space-y-8 text-sm font-medium leading-relaxed text-slate-700">
        <section className="space-y-2">
          <h2 className="text-base font-black text-slate-900">1. 목적</h2>
          <p>
            회사는 개인정보 보호법 등 관련 법령을 준수하며, 링크유(Link-U) 서비스(이하 &quot;서비스&quot;) 이용 과정에서
            수집·이용되는 개인정보의 항목, 목적, 보관 및 파기, 제공·위탁 등을 이용자에게 안내합니다.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-black text-slate-900">2. 수집하는 개인정보 항목</h2>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong className="text-slate-800">계정·서비스 공통:</strong> 이메일, 이름(또는 표시명), 로그인 식별자,
              서비스 이용 기록, 접속 로그, 기기·태그 식별자(NFC/단말 관련), 오류·보안 이벤트 기록 등
            </li>
            <li>
              <strong className="text-slate-800">위치 정보:</strong> 발견자 또는 보호자의 명시적 동작(버튼·권한 허용 등)이
              있을 때에만 수집·전송될 수 있으며, 항목·정밀도는 OS·브라우저 권한 및 화면 안내에 따릅니다.
            </li>
            <li>
              <strong className="text-slate-800">스토어(온라인 주문·상품 제공) 연동 시:</strong> 주문·배송·결제·고객응대를
              위해 아래 정보가 추가로 수집될 수 있습니다.
              <ul className="mt-1.5 list-[circle] space-y-1 pl-5">
                <li>수령인·주문자 성명, 휴대전화번호, 이메일(주문 확인·CS용)</li>
                <li>배송지 주소(도로명·지번, 우편번호 등 입력하는 범위)</li>
                <li>
                  주문·결제와 관련된 거래 식별 정보(주문번호, 결제·취소·환불 상태, 결제 수단 유형(카드·간편결제 등
                  상위 구분), PG·결제사에서 부여한 거래 ID 등).{" "}
                  <strong className="text-slate-800">신용카드 번호 전체</strong>는 당사 서버에 저장하지 않는 것이
                  일반적이며, PG·간편결제사의 결제창에서 처리될 수 있습니다.
                </li>
                <li>배송·수입 통관 등이 필요한 경우, 관계 법령이나 운영 정책에 따른 최소한의 항목</li>
              </ul>
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-black text-slate-900">3. 개인정보의 이용 목적</h2>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>회원 식별, 서비스 제공·유지, 보호자·발견자 연결, 알림·공지, 고객 지원</li>
            <li>사고 대응, 보안·부정이용 방지, 통계·서비스 품질 개선(가명·집계 형태에 한함)</li>
            <li>위치 정보: 동의한 범위에서 위치·안내·찾기 관련 기능 제공(세부는 위치기반서비스 이용약관·동의 화면)</li>
            <li>
              <strong className="text-slate-800">스토어:</strong> 상품 주문·결제·배송, 청구·취소·환불·교환, 전자상거래
              법령에 따른 기록·분쟁 대응, 부정 주문 방지, 맞춤 CS
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-black text-slate-900">4. 개인정보의 보관 및 파기</h2>
          <p>
            수집 목적이 달성되거나 이용자가 삭제를 요청하는 경우 지체 없이 파기하는 것을 원칙으로 합니다. 다만,
            전자상거래 등에서의 소비자 보호에 관한 법률 등 관련 법령에 따라 <strong>계약·주문·결제·배송</strong>에 관한
            기록은 해당 법령이 정한 기간 동안 보관할 수 있습니다. 구체적 기간·항목은 내부 정책 및 법률 검토에 따라
            운영·갱신될 수 있습니다.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-black text-slate-900">5. 제3자 제공 및 처리 위탁</h2>
          <p>
            당사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 아래에 해당하는 경우는 예외로
            할 수 있습니다.
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>이용자가 사전에 동의한 경우</li>
            <li>법령에 근거하거나 수사·감독기관의 적법한 요청이 있는 경우</li>
          </ul>
          <p className="mt-2">
            <strong className="text-slate-800">스토어·결제·배송:</strong> PG(결제대행), 간편결제, 모바일 청구/링크
            결제 서비스, 택배·배송사, 본인확인·부정거래 모니터링 대행사 등에 <strong>서비스 운영에 필요한 범위</strong>로
            개인정보 처리를 <strong>위탁</strong>할 수 있습니다. 위탁 시에는 위탁받는 자, 위탁 업무 내용, 위탁 기간 등을
            처리방침에 공개하고, 관계 법령에 따라 관리·감독합니다. 실제 위탁·제휴사는 도입 시점에 본 항에 반영·고지될
            수 있습니다.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-black text-slate-900">6. 이용자의 권리</h2>
          <p>
            이용자는 언제든지 개인정보 열람·정정·삭제·처리정지를 요구할 수 있으며, 동의를 철회할 수 있습니다. 다만
            법령에서 일정 정보의 보관을 요구하는 경우 삭제가 제한될 수 있습니다. 구체적 절차는 고객센터·앱 내 문의
            경로를 통해 안내합니다.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-black text-slate-900">7. 위치정보 (요지)</h2>
          <p>
            위치정보는 별도의 위치기반서비스 이용·제공에 관한 동의 절차와 약관에 따르며, 목적 외 용도로 사용하지
            않습니다. 상세는 서비스 내 &quot;위치 정보&quot; 동의 화면 및 본 방침의 2·3항을 참고합니다.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-black text-slate-900">8. 기타</h2>
          <p>
            본 방침은 법령·서비스 변경에 따라 개정될 수 있으며, 중요한 변경 시 서비스 내 공지 등 합리적인 방법으로
            알립니다. 개정 시 시행일을 본 문서 상단에 반영합니다.
          </p>
          <p className="text-xs text-slate-500">
            본 문서는 이용자 이해를 돕기 위한 요약·안내이며, 실제 권리·의무는 관련 법령 및 이용약관, 별도 동의
            화면이 우선할 수 있습니다. 사업자의 정식 명칭·대표자·주소·연락처 등은 회사의 공시 정책에 따릅니다.
          </p>
        </section>
      </div>
    </div>
  );
}
