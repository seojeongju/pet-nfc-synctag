"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Volume2, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type WayfinderSpeechAnnouncerProps = {
  /** 음성으로 읽을 본문(이미 HTML 없이 순수 텍스트 권장) */
  text: string;
  className?: string;
};

function pickKoVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  const ko =
    voices.find((v) => v.lang === "ko-KR") ??
    voices.find((v) => v.lang.toLowerCase().startsWith("ko")) ??
    null;
  return ko;
}

/**
 * Web Speech API(speechSynthesis)로 안내 문구를 읽습니다. 사용자 제스처(버튼) 후에만 재생합니다.
 */
export function WayfinderSpeechAnnouncer({ text, className }: WayfinderSpeechAnnouncerProps) {
  const [supported, setSupported] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [voiceHint, setVoiceHint] = useState(false);

  const trimmed = useMemo(() => text.replace(/\s+/g, " ").trim(), [text]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setSupported(false);
      return;
    }
    const onVoices = () => setVoiceHint(window.speechSynthesis.getVoices().length > 0);
    window.speechSynthesis.addEventListener("voiceschanged", onVoices);
    onVoices();
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", onVoices);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback(() => {
    if (!trimmed || typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(trimmed);
    u.lang = "ko-KR";
    const v = pickKoVoice();
    if (v) u.voice = v;
    u.rate = 0.95;
    u.pitch = 1;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  }, [trimmed]);

  if (!supported) {
    return (
      <p className={cn("text-xs font-semibold text-slate-500", className)}>
        이 브라우저에서는 음성 안내를 사용할 수 없습니다. 아래 텍스트를 직접 읽어 주세요.
      </p>
    );
  }

  if (!trimmed) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Button
        type="button"
        onClick={speaking ? stop : speak}
        className={cn(
          "h-11 gap-2 rounded-2xl px-5 font-black shadow-sm",
          speaking ? "bg-slate-700 hover:bg-slate-800" : "bg-indigo-600 hover:bg-indigo-700"
        )}
      >
        {speaking ? (
          <>
            <Square className="h-4 w-4 fill-current" aria-hidden />
            음성 중지
          </>
        ) : (
          <>
            <Volume2 className="h-4 w-4" aria-hidden />
            음성으로 듣기
          </>
        )}
      </Button>
      <span className="text-[11px] font-bold text-slate-400">
        {voiceHint ? "한국어 음성이 있으면 자동으로 선택됩니다." : "기기에 따라 음성 목록이 늦게 로드될 수 있습니다."}
      </span>
    </div>
  );
}
