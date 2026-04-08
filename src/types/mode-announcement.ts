import type { SubjectKind } from "@/lib/subject-kind";

export type ModeAnnouncementStatus = "draft" | "published" | "archived";

export type ModeAnnouncementAttachmentKind = "image" | "pdf" | null;

export type ModeAnnouncementRow = {
  id: string;
  subject_kind: SubjectKind;
  target_batch_id: string | null;
  title: string;
  body: string | null;
  link_url: string | null;
  attachment_r2_key: string | null;
  attachment_mime: string | null;
  attachment_kind: ModeAnnouncementAttachmentKind;
  status: ModeAnnouncementStatus;
  priority: number;
  published_at: string | null;
  expires_at: string | null;
  created_by_email: string | null;
  created_at: string;
  updated_at: string;
};
