import { NextRequest, NextResponse } from "next/server";
import { uploadShopAsset } from "@/app/actions/admin-shop";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const result = await uploadShopAsset(formData);
    return NextResponse.json(result);
  } catch (error) {
    console.error("API UPLOAD ERROR:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "파일 업로드 중 오류가 발생했습니다." 
    }, { status: 500 });
  }
}
