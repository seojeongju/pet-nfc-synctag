/**
 * 상품 미디어 업로드용: 중앙 기준 1:1 크롭 후 최대 변 길이 제한·JPEG 압축.
 * SVG/GIF 등은 원본 그대로 둡니다. 디코드 실패 시 원본 파일을 반환합니다.
 */
/** 미디어 탭 안내 문구와 동일하게 유지 */
export const SHOP_UPLOAD_IMAGE_MAX_EDGE_PX = 1200;
const JPEG_QUALITY = 0.88;

export async function resizeProductImageForUpload(file: File): Promise<File> {
  const type = (file.type || "").toLowerCase();
  if (!type.startsWith("image/")) return file;
  if (type === "image/svg+xml" || type === "image/gif") return file;

  try {
    const bitmap = await createImageBitmap(file);
    try {
      const w = bitmap.width;
      const h = bitmap.height;
      if (!w || !h) return file;

      const cropSide = Math.min(w, h);
      const sx = (w - cropSide) / 2;
      const sy = (h - cropSide) / 2;
      const outSize = Math.min(SHOP_UPLOAD_IMAGE_MAX_EDGE_PX, cropSide);

      const canvas = document.createElement("canvas");
      canvas.width = outSize;
      canvas.height = outSize;
      const ctx = canvas.getContext("2d");
      if (!ctx) return file;

      ctx.drawImage(bitmap, sx, sy, cropSide, cropSide, 0, 0, outSize, outSize);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), "image/jpeg", JPEG_QUALITY);
      });
      if (!blob || blob.size === 0) return file;

      const base =
        file.name.replace(/\.[^.]+$/, "").replace(/[^\w\-가-힣]/g, "_") || "product";
      return new File([blob], `${base}-shop.jpg`, {
        type: "image/jpeg",
        lastModified: Date.now(),
      });
    } finally {
      bitmap.close();
    }
  } catch {
    return file;
  }
}
