import type { SubjectKind } from "@/lib/subject-kind";

export type AlbumRow = {
  id: string;
  owner_id: string;
  subject_kind: SubjectKind;
  tenant_id: string | null;
  title: string;
  description: string | null;
  cover_asset_id: string | null;
  created_at: string;
  updated_at: string;
};

export type AlbumAssetRow = {
  id: string;
  album_id: string;
  r2_key: string;
  mime_type: string;
  size_bytes: number;
  size_mb: number;
  caption: string | null;
  created_at: string;
};

export type AlbumShareLinkRow = {
  id: string;
  album_id: string;
  created_by_user_id: string;
  token_hash: string;
  expires_at: string | null;
  revoked_at: string | null;
  view_count: number;
  last_viewed_at: string | null;
  created_at: string;
};

export type AlbumListItem = AlbumRow & {
  asset_count: number;
  total_size_mb: number;
  latest_asset_key: string | null;
};

export type AlbumShareLinkListItem = Omit<AlbumShareLinkRow, "token_hash"> & {
  share_path: string;
  is_active: number;
};
