import { LocateFixed, MapPinned, Route } from "lucide-react";

const steps = [
  {
    icon: LocateFixed,
    title: "내 위치 확인",
    body: "스마트폰 GPS로 지금 있는 곳을 확인합니다. 위치 권한을 허용해 주세요.",
  },
  {
    icon: MapPinned,
    title: "가까운 지하철역 선택",
    body: "GPS로 측정한 현재 위치에서 가까운 수도권 지하철역을 거리순으로 보여 줍니다.",
  },
  {
    icon: Route,
    title: "이동 경로 안내",
    body: "카카오맵으로 역까지 길찾기를 엽니다. 역 안 엘리베이터·승강장 안내는 순차적으로 확대됩니다.",
  },
] as const;

export function WayfinderHowItWorks() {
  return (
    <section className="space-y-3" aria-labelledby="wf-how-heading">
      <h2 id="wf-how-heading" className="text-xs font-black uppercase tracking-widest text-slate-500">
        이용 방법
      </h2>
      <ol className="space-y-2">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <li
              key={step.title}
              className="flex gap-3 rounded-2xl border border-slate-200/90 bg-white/90 p-3 shadow-sm"
            >
              <span className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                <Icon className="h-4 w-4" aria-hidden />
                <span className="mt-0.5 text-[9px] font-black">{i + 1}</span>
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="text-sm font-black text-slate-900">{step.title}</p>
                <p className="mt-0.5 text-xs font-semibold leading-relaxed text-slate-600">{step.body}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
