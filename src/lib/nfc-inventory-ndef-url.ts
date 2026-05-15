/**
 * 인벤토리 태그(tags + wayfinder_spots) 기준으로 NDEF에 기록할 공개 URL을 계산합니다.
 * prepareNfcTagWrite·네이티브 콜백 등에서 동일 규칙을 쓰기 위해 분리했습니다.
 */
export type TagWayfinderJoinFields = {
    wf_spot: string | null;
    wf_slug: string | null;
    wf_pub: number | null;
};

export function computeNdefWriteUrlForInventoryTag(
    base: string,
    tagUid: string,
    row: TagWayfinderJoinFields
): { ok: true; url: string } | { ok: false; error: string } {
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
        if (Number(row.wf_pub) !== 1) {
            return {
                ok: false,
                error: "이 태그는 링크유-동행 스팟에 연결되어 있습니다. 공개(발행)된 뒤에 URL을 기록하세요.",
            };
        }
        return { ok: true, url: `${b}/wayfinder/s/${encodeURIComponent(row.wf_slug)}` };
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
