import { buildWayfinderCompanionPublicUrl } from "@/lib/wayfinder/companion-url";

/**
 * 인벤토리 태그(tags + wayfinder_spots) 기준으로 NDEF에 기록할 공개 URL을 계산합니다.
 * prepareNfcTagWrite·네이티브 콜백 등에서 동일 규칙을 쓰기 위해 분리했습니다.
 *
 * 링크유-동행(wayfinder_spot 연결): `/wayfinder?from=nfc&tag=UID` — GPS 근처 역·경로가 메인.
 * 스팟 slug는 쿼리(보조)로만 전달. 고정 지점 전용 `/wayfinder/s/…` 는 QR·대시보드 미리보기용.
 */
export type TagWayfinderJoinFields = {
    wf_spot: string | null;
    wf_slug: string | null;
    wf_pub: number | null;
    wf_title?: string | null;
};

export type NdefWriteWayfinderWarning = {
    code: "wayfinder_unpublished";
    slug: string;
    title: string | null;
    message: string;
};

export type ComputeNdefWriteUrlOptions = {
    /** true면 미발행 스팟 URL도 반환(관리자 Web NFC·확인 후 기록용) */
    allowUnpublishedWayfinder?: boolean;
};

export function computeNdefWriteUrlForInventoryTag(
    base: string,
    tagUid: string,
    row: TagWayfinderJoinFields,
    options?: ComputeNdefWriteUrlOptions
): { ok: true; url: string; warnings?: NdefWriteWayfinderWarning[] } | { ok: false; error: string } {
    const b = base.replace(/\/$/, "").trim();
    if (!b) {
        return { ok: false, error: "앱 기준 URL(base)이 비어 있습니다." };
    }
    if (row.wf_spot) {
        if (!row.wf_slug) {
            return {
                ok: false,
                error: "동행 스팟 연결은 있으나 스팟 정보를 찾을 수 없습니다. 스팟이 삭제되었는지 확인하세요.",
            };
        }
        const url = buildWayfinderCompanionPublicUrl(b, tagUid, row.wf_slug);
        if (Number(row.wf_pub) !== 1) {
            const title = (row.wf_title ?? "").trim() || null;
            const message =
                "연결된 보조 스팟이 아직 발행되지 않았습니다. 태그 스캔 시 지하철 안내는 이용 가능하나, 지점 안내 카드는 표시되지 않을 수 있습니다.";
            if (!options?.allowUnpublishedWayfinder) {
                return {
                    ok: false,
                    error: `${message} (스팟: ${title || row.wf_slug})`,
                };
            }
            return {
                ok: true,
                url,
                warnings: [
                    {
                        code: "wayfinder_unpublished",
                        slug: row.wf_slug,
                        title,
                        message,
                    },
                ],
            };
        }
        return { ok: true, url };
    }
    return { ok: true, url: `${b}/t/${encodeURIComponent(tagUid)}` };
}

/** 핸드오프·클라이언트가 보낸 URL 문자열을 비교할 때(인코딩·공백 차이 흡수) */
export function nfcWriteUrlsEquivalent(a: string, b: string): boolean {
    const ta = a.trim();
    const tb = b.trim();
    if (ta === tb) return true;
    try {
        return new URL(ta).href === new URL(tb).href;
    } catch {
        return false;
    }
}
