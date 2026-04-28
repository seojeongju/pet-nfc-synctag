import type { D1Database } from "@cloudflare/workers-types";

export type GoldPriceSource = "AUTO" | "MANUAL";

export interface GoldSettings {
  useAutoFetch: boolean;
  manualOverridePrice: number | null;
  lastFetchedAt: string | null;
}

export async function getGoldSettings(db: D1Database): Promise<GoldSettings> {
  const row = await db
    .prepare("SELECT use_auto_fetch, manual_override_price, last_fetched_at FROM gold_settings WHERE id = 1")
    .first<{ use_auto_fetch: number; manual_override_price: number | null; last_fetched_at: string | null }>();

  if (!row) {
    return { useAutoFetch: true, manualOverridePrice: null, lastFetchedAt: null };
  }

  return {
    useAutoFetch: row.use_auto_fetch === 1,
    manualOverridePrice: row.manual_override_price,
    lastFetchedAt: row.last_fetched_at,
  };
}

/**
 * 현재 적용 중인 금 시세(1g당)를 가져옵니다.
 * 1. manualOverridePrice가 있으면 우선 사용
 * 2. 없으면 가장 최근 gold_prices 레코드 사용
 */
export async function getCurrentGoldPrice(db: D1Database): Promise<number> {
  const settings = await getGoldSettings(db);
  
  if (settings.manualOverridePrice !== null) {
    return settings.manualOverridePrice;
  }

  const latest = await db
    .prepare("SELECT price_per_gram FROM gold_prices ORDER BY created_at DESC LIMIT 1")
    .first<{ price_per_gram: number }>();

  return latest?.price_per_gram ?? 0;
}

/**
 * 공공데이터 API 등을 통해 금 시세를 가져와 DB에 저장합니다.
 */
export async function fetchAndSaveGoldPrice(db: D1Database, apiKey: string): Promise<number | null> {
  try {
    // 예시: 공공데이터포털(data.go.kr) 한국거래소 금시장 시세 API 호출
    // 실제 서비스 키와 상세 파라미터는 환경변수 등에서 관리 권장
    const url = `http://apis.data.go.kr/1160100/service/GetStockQuotationService/getMarketPriceList?serviceKey=${apiKey}&resultType=json&numOfRows=1&itmsNm=금 99.99`;
    
    const response = await fetch(url);
    const data = (await response.json()) as {
      response?: { body?: { items?: { item?: unknown } } };
    };
    const rawItems = data.response?.body?.items?.item;
    const first = Array.isArray(rawItems) ? rawItems[0] : rawItems;
    const priceStr =
      first && typeof first === "object" && first !== null && "clpr" in first
        ? String((first as { clpr?: string }).clpr ?? "")
        : "";
    if (!priceStr) return null;

    const pricePerGram = parseFloat(String(priceStr));

    // DB 저장
    await db
      .prepare("INSERT INTO gold_prices (price_per_gram, source) VALUES (?, 'AUTO')")
      .bind(pricePerGram)
      .run();

    await db
      .prepare("UPDATE gold_settings SET last_fetched_at = CURRENT_TIMESTAMP WHERE id = 1")
      .run();

    return pricePerGram;
  } catch (error) {
    console.error("Gold price fetch error:", error);
    return null;
  }
}

/**
 * 관리자가 수동으로 시세를 설정하거나 자동 연동을 제어합니다.
 */
export async function updateGoldSettings(
  db: D1Database, 
  input: { useAutoFetch?: boolean; manualOverridePrice?: number | null }
) {
  const updates: string[] = [];
  const params: (number | null)[] = [];

  if (input.useAutoFetch !== undefined) {
    updates.push("use_auto_fetch = ?");
    params.push(input.useAutoFetch ? 1 : 0);
  }

  if (input.manualOverridePrice !== undefined) {
    updates.push("manual_override_price = ?");
    params.push(input.manualOverridePrice);
    
    // 수동 가격이 입력되면 이력에도 남김
    if (input.manualOverridePrice !== null) {
      await db
        .prepare("INSERT INTO gold_prices (price_per_gram, source) VALUES (?, 'MANUAL')")
        .bind(input.manualOverridePrice)
        .run();
    }
  }

  if (updates.length > 0) {
    params.push(1); // WHERE id = 1
    await db
      .prepare(`UPDATE gold_settings SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = 1`)
      .bind(...params)
      .run();
  }
}
