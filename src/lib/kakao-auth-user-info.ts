/** Better Auth 카카오 getUserInfo — kapi /v2/user/me 응답 매핑 */

type KakaoOAuthToken = {
  accessToken?: string | null;
};

type KakaoMeResponse = {
  id: number;
  kakao_account?: {
    email?: string | null;
    is_email_verified?: boolean;
    profile?: {
      nickname?: string | null;
      profile_image_url?: string | null;
    };
  };
  properties?: {
    nickname?: string | null;
    profile_image?: string | null;
  };
};

/** account_email scope 없을 때 D1 user.email NOT NULL 충족용 (카카오 id 기준 고유) */
export function syntheticKakaoEmail(kakaoUserId: number | string): string {
  return `kakao_${String(kakaoUserId)}@oauth.wow-linku.co.kr`;
}

export async function fetchKakaoUserInfoForAuth(token: KakaoOAuthToken) {
  const accessToken = token.accessToken?.trim();
  if (!accessToken) {
    throw new Error("Missing Kakao access token");
  }

  const res = await fetch("https://kapi.kakao.com/v2/user/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Kakao user/me failed (${res.status}): ${body.slice(0, 240)}`);
  }

  const profile = (await res.json()) as KakaoMeResponse;
  const id = String(profile.id);
  const emailFromKakao = profile.kakao_account?.email?.trim();
  const email = emailFromKakao || syntheticKakaoEmail(id);
  const emailVerified = emailFromKakao
    ? Boolean(profile.kakao_account?.is_email_verified)
    : false;
  const name =
    profile.kakao_account?.profile?.nickname?.trim() ||
    profile.properties?.nickname?.trim() ||
    null;
  const image =
    profile.kakao_account?.profile?.profile_image_url?.trim() ||
    profile.properties?.profile_image?.trim() ||
    null;

  return {
    user: {
      id,
      name,
      email,
      image,
      emailVerified,
    },
    data: profile,
  };
}
