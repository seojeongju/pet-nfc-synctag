"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff, Loader2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

type UiState = "hidden" | "unsupported" | "idle" | "subscribed" | "denied" | "error";

/**
 * 보호자 대시보드: PWA/브라우저에 발견자 알림(Web Push) 구독 등록.
 * NEXT_PUBLIC_VAPID_PUBLIC_KEY 미설정 시 카드 미표시.
 */
export function GuardianPushSubscribeCard() {
  const vapidPublic = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "").trim();
  const [ui, setUi] = useState<UiState>("hidden");
  const [working, setWorking] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const refreshSubscriptionState = useCallback(async () => {
    if (!vapidPublic) {
      setUi("hidden");
      return;
    }
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setUi("unsupported");
      return;
    }
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setUi(sub ? "subscribed" : "idle");
    } catch {
      setUi("idle");
    }
  }, [vapidPublic]);

  useEffect(() => {
    void refreshSubscriptionState();
  }, [refreshSubscriptionState]);

  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "denied") {
      setUi((prev) => (prev === "subscribed" ? prev : "denied"));
    }
  }, []);

  if (ui === "hidden") return null;

  const subscribe = async () => {
    if (!vapidPublic) return;
    setHint(null);
    setWorking(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setUi("denied");
        setHint("알림을 허용해야 발견자 알림을 받을 수 있어요.");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        await fetch("/api/guardian/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(existing.toJSON()),
        });
        setUi("subscribed");
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublic),
      });
      const res = await fetch("/api/guardian/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) {
        await sub.unsubscribe().catch(() => {});
        setUi("error");
        setHint("서버에 등록하지 못했어요. 잠시 후 다시 시도해 주세요.");
        return;
      }
      setUi("subscribed");
    } catch (e: unknown) {
      console.error(e);
      setUi("error");
      setHint(
        "구독에 실패했어요. 홈 화면에 설치한 앱·HTTPS·Chrome에서 다시 시도해 주세요."
      );
    } finally {
      setWorking(false);
    }
  };

  const unsubscribe = async () => {
    setHint(null);
    setWorking(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const j = sub.toJSON();
        await fetch("/api/guardian/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ endpoint: j.endpoint }),
        }).catch(() => {});
        await sub.unsubscribe();
      }
      setUi("idle");
    } catch (e: unknown) {
      console.error(e);
      setUi("error");
      setHint("해제 중 오류가 났어요.");
    } finally {
      setWorking(false);
    }
  };

  if (ui === "unsupported") {
    return (
      <div className="mb-4 rounded-2xl border border-amber-100 bg-amber-50/80 px-4 py-3 text-[12px] font-semibold text-amber-900">
        이 브라우저에서는 발견자 푸시 알림을 쓸 수 없어요. Chrome 업데이트 또는 다른 기기를 이용해 주세요.
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mb-4 rounded-2xl border px-4 py-3 shadow-sm",
        ui === "denied"
          ? "border-rose-100 bg-rose-50/90 text-rose-900"
          : "border-teal-100 bg-teal-50/70 text-teal-950"
      )}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/80 text-teal-600 shadow-sm">
            <Smartphone className="h-4 w-4" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <p className="text-[11px] font-black uppercase tracking-wide text-teal-700/80">
              발견자 알림
            </p>
            <p className="text-[13px] font-bold leading-snug text-slate-800">
              앱을 설치해 두면, 발견자가 전화·문자·위치를 보낼 때 이 기기로 알림을 받을 수 있어요.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {ui === "subscribed" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 rounded-xl border-teal-200 bg-white font-black text-teal-800"
              disabled={working}
              onClick={() => void unsubscribe()}
            >
              {working ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <BellOff className="mr-1 h-4 w-4" />
              )}
              알림 끄기
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              className="h-9 rounded-xl bg-teal-600 font-black text-white hover:bg-teal-700"
              disabled={working || ui === "denied"}
              onClick={() => void subscribe()}
            >
              {working ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Bell className="mr-1 h-4 w-4" />
              )}
              알림 받기
            </Button>
          )}
        </div>
      </div>
      {ui === "denied" ? (
        <p className="mt-2 text-[11px] font-semibold leading-snug text-rose-800">
          브라우저 설정에서 이 사이트의 알림을 허용한 뒤 다시 시도해 주세요.
        </p>
      ) : null}
      {hint ? (
        <p className="mt-2 text-[11px] font-semibold leading-snug text-slate-700">{hint}</p>
      ) : null}
    </div>
  );
}
