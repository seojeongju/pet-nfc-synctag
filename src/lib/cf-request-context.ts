import { cache } from "react";
import { getRequestContext } from "@cloudflare/next-on-pages";

/** 동일 요청에서 getRequestContext 중복 호출을 막기 위한 래퍼 (Edge / next-on-pages). */
export const getCfRequestContext = cache(() => getRequestContext());