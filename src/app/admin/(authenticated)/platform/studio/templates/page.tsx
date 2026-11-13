import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminPageIntro } from "@/components/admin/layout/AdminPageIntro";
import {
  createStudioTemplateAction,
  deleteStudioTemplateAction,
  toggleStudioTemplateActiveAction,
} from "@/app/actions/admin-studio-templates";
import { resolveAdminScope } from "@/lib/admin-authz";
import { getDB } from "@/lib/db";
import { FORM_FACTORS, getFormFactor } from "@/lib/platform/form-factors";
import { PLATFORM_SERVICES, getPlatformService } from "@/lib/platform/services";
import { TAG_BODY_COLORS, TAG_MATERIALS, TAG_TEXT_COLORS } from "@/lib/platform/tag-design";
import { listAllTemplatesForAdmin } from "@/lib/platform/tag-templates-store";
import { adminUi } from "@/styles/admin/ui";
import { cn } from "@/lib/utils";

export const runtime = "edge";

export default async function AdminStudioTemplatesPage() {
  const scope = await resolveAdminScope("admin");
  if (!scope.actor.isPlatformAdmin) redirect("/admin/shop/orders");

  const templates = await listAllTemplatesForAdmin(getDB());
  const services = PLATFORM_SERVICES.filter((s) => s.customizable);
  const formFactors = FORM_FACTORS;

  return (
    <div className={cn(adminUi.pageContainer, adminUi.pageBottomSafe)}>
      <AdminPageIntro
        title="태그 스튜디오 · 템플릿"
        subtitle="서비스별 기본 템플릿은 코드로 제공됩니다. 아래에서 추가 템플릿을 등록하면 /studio에 바로 노출됩니다."
        crumbs={[
          { label: "통합 관리자", href: "/admin" },
          { label: "디자인·제작 요청", href: "/admin/platform/studio" },
          { label: "템플릿" },
        ]}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href="/admin/platform/studio"
          className="inline-flex h-10 items-center rounded-2xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 hover:bg-slate-50"
        >
          디자인·제작 요청
        </Link>
        <Link
          href="/studio"
          target="_blank"
          className="inline-flex h-10 items-center rounded-2xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 hover:bg-slate-50"
        >
          스튜디오 미리보기
        </Link>
      </div>

      <section className={cn(adminUi.subtleCard, "mb-6 p-5")}>
        <h2 className="text-sm font-black text-slate-900">템플릿 추가</h2>
        <p className="mt-1 text-xs font-semibold text-slate-500">마이그레이션 0043(`tag_design_templates`) 적용 후 저장됩니다.</p>
        <form action={createStudioTemplateAction} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="block text-xs font-bold text-slate-600">
            서비스
            <select name="serviceId" required className={cn(adminUi.input, "mt-1 w-full")}>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-bold text-slate-600">
            태그 모양
            <select name="formFactorId" required className={cn(adminUi.input, "mt-1 w-full")}>
              {formFactors.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-bold text-slate-600 md:col-span-2">
            템플릿 이름
            <input name="name" required maxLength={40} placeholder="예: 펫 키링 · 봄 시즌" className={cn(adminUi.input, "mt-1 w-full")} />
          </label>
          <label className="block text-xs font-bold text-slate-600 md:col-span-2">
            설명
            <input name="description" maxLength={200} placeholder="사용자에게 보이는 짧은 설명" className={cn(adminUi.input, "mt-1 w-full")} />
          </label>
          <label className="block text-xs font-bold text-slate-600">
            카드 힌트
            <input name="previewHint" maxLength={40} placeholder="예: 틸 · 양각" className={cn(adminUi.input, "mt-1 w-full")} />
          </label>
          <label className="block text-xs font-bold text-slate-600">
            정렬
            <input name="sortOrder" type="number" defaultValue={100} className={cn(adminUi.input, "mt-1 w-full")} />
          </label>
          <label className="block text-xs font-bold text-slate-600">
            문구 1줄
            <input name="line1" maxLength={16} defaultValue="HELLO" className={cn(adminUi.input, "mt-1 w-full")} />
          </label>
          <label className="block text-xs font-bold text-slate-600">
            문구 2줄
            <input name="line2" maxLength={16} className={cn(adminUi.input, "mt-1 w-full")} />
          </label>
          <label className="block text-xs font-bold text-slate-600">
            문구 3줄
            <input name="line3" maxLength={16} className={cn(adminUi.input, "mt-1 w-full")} />
          </label>
          <label className="block text-xs font-bold text-slate-600">
            문구 스타일
            <select name="textStyle" defaultValue="raised" className={cn(adminUi.input, "mt-1 w-full")}>
              <option value="raised">양각</option>
              <option value="engraved">음각</option>
            </select>
          </label>
          <label className="block text-xs font-bold text-slate-600">
            본체 색
            <select name="bodyColor" defaultValue="#00A896" className={cn(adminUi.input, "mt-1 w-full")}>
              {TAG_BODY_COLORS.map((c) => (
                <option key={c.hex} value={c.hex}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-bold text-slate-600">
            문구 색
            <select name="textColor" defaultValue="#FFFFFF" className={cn(adminUi.input, "mt-1 w-full")}>
              {TAG_TEXT_COLORS.map((c) => (
                <option key={c.hex} value={c.hex}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-bold text-slate-600">
            재질
            <select name="materialId" defaultValue="pla_matte" className={cn(adminUi.input, "mt-1 w-full")}>
              {TAG_MATERIALS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
          <div className="md:col-span-2">
            <button type="submit" className={cn(adminUi.darkButton, "h-11 rounded-2xl px-5 text-xs")}>
              템플릿 등록
            </button>
          </div>
        </form>
      </section>

      <section className={cn(adminUi.subtleCard, "overflow-hidden")}>
        <div className="border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-black text-slate-900">템플릿 목록 ({templates.length})</h2>
        </div>
        <ul className="divide-y divide-slate-100">
          {templates.map((t) => {
            const service = getPlatformService(t.serviceId);
            const ff = getFormFactor(t.formFactorId);
            return (
              <li key={`${t.source}-${t.id}`} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <span
                  className="h-9 w-9 shrink-0 rounded-xl ring-1 ring-slate-200"
                  style={{ backgroundColor: (t.defaultSpec.bodyColor as string) || "#00A896" }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-slate-900">
                    {t.name}{" "}
                    <span className={cn("ml-1 text-[10px] font-bold", t.source === "builtin" ? "text-teal-600" : "text-violet-600")}>
                      {t.source === "builtin" ? "기본" : "추가"}
                      {!t.active ? " · 비활성" : ""}
                    </span>
                  </p>
                  <p className="text-[11px] font-semibold text-slate-500">
                    {service?.name ?? t.serviceId} · {ff?.name ?? t.formFactorId} · {t.previewHint} · {t.id}
                  </p>
                </div>
                {t.source === "custom" ? (
                  <div className="flex flex-wrap gap-2">
                    <form action={toggleStudioTemplateActiveAction}>
                      <input type="hidden" name="templateId" value={t.id} />
                      <input type="hidden" name="active" value={t.active ? "0" : "1"} />
                      <button
                        type="submit"
                        className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-black text-slate-700 hover:bg-slate-50"
                      >
                        {t.active ? "비활성" : "활성"}
                      </button>
                    </form>
                    <form action={deleteStudioTemplateAction}>
                      <input type="hidden" name="templateId" value={t.id} />
                      <button
                        type="submit"
                        className="inline-flex h-9 items-center rounded-xl border border-rose-200 bg-white px-3 text-[11px] font-black text-rose-600 hover:bg-rose-50"
                      >
                        삭제
                      </button>
                    </form>
                  </div>
                ) : (
                  <span className="text-[10px] font-bold text-slate-400">코드 시드 · 수정 불가</span>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
