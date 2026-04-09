"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { type SubjectKind } from "@/lib/subject-kind";
import { Card } from "@/components/ui/card";
import { Activity, MapPin, RefreshCw, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface LocationData {
  lat: number;
  lng: number;
  timestamp: string;
  type: string;
}

interface SubjectWithLocation {
  id: string;
  name: string;
  breed?: string | null;
  photo_url?: string | null;
  is_lost?: number | null;
  location: LocationData | null;
}

interface LiveLocationMapProps {
  subjects: SubjectWithLocation[];
  subjectKind: SubjectKind;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

declare global {
  interface Window {
    kakao: any;
  }
}

export default function LiveLocationMap({
  subjects,
  subjectKind,
  onRefresh,
  isRefreshing,
}: LiveLocationMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [sdkLoaded, setSdkLoaded] = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

  // SDK 초기화 및 지도 생성
  const initMap = () => {
    if (!window.kakao || !mapContainerRef.current || mapInstanceRef.current) return;

    window.kakao.maps.load(() => {
      const options = {
        center: new window.kakao.maps.LatLng(37.5665, 126.9780), // 기본 서울시청
        level: 3,
      };
      // @ts-ignore
      mapInstanceRef.current = new window.kakao.maps.Map(mapContainerRef.current, options);
    });
  };

  // 마커 업데이트
  useEffect(() => {
    if (!sdkLoaded || !mapInstanceRef.current) return;

    // 기존 마커 제거
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const bounds = new window.kakao.maps.LatLngBounds();
    let hasLocation = false;

    subjects.forEach((subject) => {
      if (!subject.location) return;

      hasLocation = true;
      const pos = new window.kakao.maps.LatLng(subject.location.lat, subject.location.lng);
      bounds.extend(pos);

      // 마커 생성
      const marker = new window.kakao.maps.Marker({
        position: pos,
        map: mapInstanceRef.current,
        title: subject.name,
      });

      // 인포윈도우 커스텀
      const content = `
        <div style="padding:15px; min-width:180px; font-family: 'Outfit', -apple-system, sans-serif;">
            <div style="font-weight:900; font-size:14px; color:#0f172a; margin-bottom:4px;">${subject.name}</div>
            <div style="font-size:11px; color:#64748b; font-weight:700;">${subject.location.type} · ${new Date(subject.location.timestamp).toLocaleString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</div>
            ${subject.is_lost ? '<div style="margin-top:8px; font-size:10px; color:#ffffff; font-weight:900; background:#f43f5e; padding:3px 8px; border-radius:8px; display:inline-block; box-shadow: 0 4px 12px rgba(244, 63, 94, 0.3);">실종 신고 중</div>' : ''}
        </div>
      `;

      const infowindow = new window.kakao.maps.InfoWindow({
        content: content,
        removable: true
      });

      window.kakao.maps.event.addListener(marker, 'click', () => {
        infowindow.open(mapInstanceRef.current, marker);
      });

      markersRef.current.push(marker);
    });

    if (hasLocation) {
      mapInstanceRef.current.setBounds(bounds);
    }
  }, [subjects, sdkLoaded]);

  return (
    <Card className="rounded-[40px] border-none shadow-app overflow-hidden bg-white relative">
      <div className="absolute top-5 left-5 z-20 flex flex-col gap-2">
         <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl flex items-center gap-2 shadow-sm border border-slate-100">
            <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest leading-none">실시간 위치 관제</span>
         </div>
      </div>

      <div className="absolute top-5 right-5 z-20">
        <button
          onClick={onRefresh}
          className={cn(
            "w-10 h-10 rounded-2xl bg-white shadow-lg flex items-center justify-center text-slate-600 hover:text-teal-500 transition-all active:scale-95",
            isRefreshing && "animate-spin"
          )}
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div 
        ref={mapContainerRef} 
        className="w-full h-[350px] bg-slate-50 transition-all"
      />

      {(!sdkLoaded || !apiKey) && (
        <div className="absolute inset-0 z-10 bg-slate-50/70 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-[24px] bg-white shadow-xl flex items-center justify-center text-teal-500 mb-6">
                <Activity className="w-8 h-8 animate-pulse" />
            </div>
            <p className="text-base font-black text-slate-900 leading-tight">
                지도를 불러오는 중입니다...
            </p>
            {!apiKey ? (
                <div className="mt-4 px-6 py-4 bg-amber-50 rounded-2xl border border-amber-100 max-w-[80%]">
                    <div className="flex items-center gap-2 text-amber-600 mb-2 justify-center">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs font-black uppercase">API Key Missing</span>
                    </div>
                    <p className="text-[10px] text-amber-700 font-bold leading-relaxed">
                        카카오맵 API 키(NEXT_PUBLIC_KAKAO_MAP_KEY)가 설정되지 않았습니다.<br />
                        환경 변수를 확인해 주세요.
                    </p>
                </div>
            ) : (
                <p className="text-[11px] text-slate-400 font-bold mt-2 font-outfit uppercase tracking-widest">Initialising SDK</p>
            )}
        </div>
      )}

      {apiKey ? (
        <Script
          src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false`}
          onLoad={() => {
            setSdkLoaded(true);
            setTimeout(initMap, 200);
          }}
        />
      ) : null}
    </Card>
  );
}
