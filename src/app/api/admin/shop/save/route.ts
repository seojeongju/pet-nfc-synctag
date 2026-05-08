import { NextRequest, NextResponse } from "next/server";
import { saveShopProduct } from "@/app/actions/admin-shop";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    // JSON 데이터 복구 (ClientState)
    const clientStateStr = formData.get("_clientState") as string;
    const clientState = clientStateStr ? JSON.parse(clientStateStr) : null;
    
    // 기존 서버 액션 로직 재사용
    const result = await saveShopProduct(clientState, null, formData);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("API SAVE ERROR:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "서버 통신 중 오류가 발생했습니다." 
    }, { status: 500 });
  }
}
