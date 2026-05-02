import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** 쿼리스트링 값 디코딩. 잘못된 `%` 시퀀스면 `decodeURIComponent`가 URIError를 던져 RSC가 깨지므로 원문을 반환한다. */
export function safeDecodeURIComponent(value: string | undefined | null): string {
  if (value == null || value === "") return "";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
