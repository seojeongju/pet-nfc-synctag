"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { linkTag, unlinkTag } from "@/app/actions/tag";
import { Loader2, Plus, Trash2, Smartphone, ShieldCheck, Box, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TagManageCardProps {
  petId: string;
  existingTags: Array<{ id: string; is_active?: boolean }>;
  writeLocked?: boolean;
  /** 대시보드 반려 상세 등에 끼워 넣을 때: 여백·타이포를 줄임 */
  embed?: boolean;
}

export function TagManageCard({
  petId,
  existingTags,
  writeLocked = false,
  embed = false,
}: TagManageCardProps) {
  const [isPending, startTransition] = useTransition();
  const [newTagId, setNewTagId] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingUnlink, setPendingUnlink] = useState<string | null>(null);
  const router = useRouter();

  const runLink = () => {
    if (writeLocked) return;
    if (!newTagId.trim()) return;
    setActionError(null);
    startTransition(async () => {
      try {
        await linkTag(petId, newTagId);
        setNewTagId("");
        router.refresh();
      } catch (e) {
        const msg = e instanceof Error && e.message ? e.message : "태그를 연결하지 못했습니다.";
        setActionError(msg);
      }
    });
  };

  const runUnlink = (tagId: string) => {
    if (writeLocked) return;
    setActionError(null);
    startTransition(async () => {
      try {
        await unlinkTag(tagId);
        setPendingUnlink(null);
        router.refresh();
      } catch (e) {
        const msg = e instanceof Error && e.message ? e.message : "태그를 해제하지 못했습니다.";
        setActionError(msg);
        setPendingUnlink(null);
      }
    });
  };

  return (
    <>
      <Dialog open={!!pendingUnlink} onOpenChange={(o) => !o && setPendingUnlink(null)}>
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>태그 연결을 해제할까요?</DialogTitle>
            <DialogDescription className="text-left text-xs font-bold text-slate-600">
              {pendingUnlink ? (
                <>
                  <span className="font-mono break-all text-slate-800">{pendingUnlink}</span>
                  <br />
                  <span className="mt-2 inline-block">해제 후에는 이 태그로 이 반려의 프로필이 열리지 않을 수 있어요. 다시 대시보드에서 연결할 수
                    있습니다.
                  </span>
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2 sm:justify-end sm:gap-2">
            <Button
              type="button"
              variant="outline"
              className="font-black"
              onClick={() => setPendingUnlink(null)}
            >
              취소
            </Button>
            <Button
              type="button"
              className="bg-rose-600 font-black text-white hover:bg-rose-500"
              onClick={() => {
                if (pendingUnlink) void runUnlink(pendingUnlink);
              }}
              disabled={!pendingUnlink || isPending}
            >
              {isPending && pendingUnlink ? "해제 중…" : "연결 해제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card
        className={cn(
          "border-none overflow-hidden relative bg-white/90 backdrop-blur-md",
          embed
            ? "shadow-none rounded-[20px] border border-slate-100"
            : "shadow-app rounded-[40px]"
        )}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 blur-3xl pointer-events-none" />

        <CardContent
          className={cn("relative z-10", embed ? "p-0 space-y-3" : "p-8 space-y-7")}
        >
          {embed ? (
            <div>
              <p className="text-xs font-black text-slate-800">태그 연결·해제</p>
              <p className="text-[10px] font-bold text-slate-500 mt-0.5">정품 UID를 입력하거나, 연결을 해제할 수 있어요.</p>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-teal-600 font-black text-[10px] uppercase tracking-[0.2em]">
                  <Zap className="w-3.5 h-3.5" />
                  Smart Connect
                </div>
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 tracking-tight">NFC 태그 관리</h3>
                <p className="text-[11px] font-bold text-slate-400">아이의 정보를 담은 스마트 인식표 목록</p>
              </div>
            </div>
          )}

          {actionError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[11px] font-bold text-rose-700">
              {actionError}
            </div>
          ) : null}

          <div className="space-y-3">
            {writeLocked ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-700">
                조직이 중지 상태라 태그 연결/해제는 잠겨 있습니다.
              </div>
            ) : null}
            <AnimatePresence mode="popLayout">
              {existingTags.length > 0 ? (
                existingTags.map((tag, index) => (
                  <motion.div
                    key={tag.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "flex items-center justify-between group hover:shadow-md transition-all",
                      embed
                        ? "p-3 bg-slate-50 rounded-[14px] border border-slate-100"
                        : "p-5 bg-white rounded-[24px] shadow-sm border border-slate-100"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          "shrink-0 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-teal-50 group-hover:text-teal-500 transition-colors",
                          embed ? "w-9 h-9" : "w-12 h-12"
                        )}
                      >
                        <Smartphone className={embed ? "w-4 h-4" : "w-6 h-6"} />
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={cn(
                              "font-black text-slate-700 break-all",
                              embed ? "text-xs font-mono" : "text-sm"
                            )}
                          >
                            {tag.id}
                          </span>
                          <ShieldCheck className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              tag.is_active ? "bg-teal-500 animate-pulse" : "bg-slate-300"
                            )}
                          />
                          <span
                            className={cn(
                              "text-[9px] font-black uppercase tracking-widest",
                              tag.is_active ? "text-teal-500" : "text-slate-400"
                            )}
                          >
                            {tag.is_active ? "Active" : "비활성"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "shrink-0 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all focus:ring-0",
                        embed ? "w-9 h-9" : "w-10 h-10"
                      )}
                      onClick={() => setPendingUnlink(tag.id)}
                      disabled={writeLocked || isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={cn(
                    "flex flex-col items-center gap-2 border-2 border-dashed border-slate-100",
                    embed ? "py-6 bg-slate-50/50 rounded-2xl" : "py-12 bg-slate-50/50 rounded-[32px]"
                  )}
                >
                  <Box className={embed ? "w-8 h-8 text-slate-200" : "w-12 h-12 text-slate-200"} />
                  <p
                    className={cn(
                      "text-slate-400 text-center font-black",
                      embed ? "text-[10px]" : "text-xs uppercase tracking-widest"
                    )}
                  >
                    연결된 태그가 없습니다. <br />
                    {embed ? "아래에 태그 UID를 입력해 연결해 주세요." : "아래에 ID를 입력해 주세요."}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className={cn("relative group", embed ? "pt-0" : "pt-2")}>
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-500 transition-colors z-10">
              <Plus className="w-4 h-4" />
            </div>
            <Input
              placeholder="새 태그 UID (뒷면 참조)"
              value={newTagId}
              onChange={(e) => {
                setNewTagId(e.target.value);
                setActionError(null);
              }}
              disabled={writeLocked}
              className={cn(
                "pl-10 pr-14 font-bold text-sm border-none shadow-inner bg-slate-50 focus:bg-white focus:ring-4 focus:ring-teal-500/10 transition-all placeholder:text-slate-300",
                embed ? "h-12 rounded-2xl" : "h-16 pl-14 pr-16 rounded-[24px]"
              )}
            />
            <button
              type="button"
              onClick={runLink}
              disabled={writeLocked || isPending || !newTagId.trim()}
              className="absolute right-1.5 top-1.5 bottom-1.5 w-9 sm:w-10 bg-slate-900 hover:bg-teal-500 text-white rounded-xl shadow-lg flex items-center justify-center transition-all disabled:opacity-30 z-10"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>

          {!embed ? (
            <div className="text-center pt-2">
              <p className="text-[10px] text-slate-300 font-bold uppercase tracking-tighter opacity-70">* NFC Secure Link Protocol</p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </>
  );
}
