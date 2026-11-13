"use client";

/**
 * 커스텀 태그 3D 미리보기 (L1 파라메트릭 — docs/NFC_PLATFORM_DEV_PLAN.md §5.3).
 * 단위는 mm. 폼팩터 치수로 외형을 돌출하고, 문구는 윗면 캔버스 텍스처로 입힌다.
 * three.js 번들이 다른 페이지에 섞이지 않도록 `next/dynamic(ssr:false)`로만 불러야 한다.
 */
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import type { FormFactor } from "@/lib/platform/form-factors";
import { getTagMaterial, type TagDesignSpec } from "@/lib/platform/tag-design";

type Props = {
  formFactor: FormFactor;
  spec: TagDesignSpec;
  showChip: boolean;
};

/** 윗면 문구 영역 (중심 x,y · 가로 · 세로, mm) */
type TextArea = { cx: number; cy: number; w: number; h: number };

type BodyPart = { shape: THREE.Shape; depth: number; z?: number };

function circleShape(cx: number, cy: number, r: number, holeR?: number): THREE.Shape {
  const s = new THREE.Shape();
  s.absarc(cx, cy, r, 0, Math.PI * 2, false);
  if (holeR) {
    const hole = new THREE.Path();
    hole.absarc(cx, cy, holeR, 0, Math.PI * 2, true);
    s.holes.push(hole);
  }
  return s;
}

function roundedRectShape(w: number, h: number, r: number, cx = 0, cy = 0): THREE.Shape {
  const x = cx - w / 2;
  const y = cy - h / 2;
  const s = new THREE.Shape();
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function buildBody(ff: FormFactor): { parts: BodyPart[]; textArea: TextArea; chipCenter: [number, number] } {
  const t = ff.thicknessMm;
  switch (ff.id) {
    case "keyring_round": {
      const r = ff.widthMm / 2;
      const cy = -(ff.heightMm - ff.widthMm) / 2;
      const tabY = cy + r + 2;
      return {
        parts: [
          { shape: circleShape(0, cy, r), depth: t },
          { shape: circleShape(0, tabY, 6, 3), depth: t * 0.75 },
        ],
        textArea: { cx: 0, cy, w: r * 1.5, h: r * 1.1 },
        chipCenter: [0, cy],
      };
    }
    case "pendant_bone": {
      const w = ff.widthMm;
      const h = ff.heightMm;
      const knobR = h * 0.27;
      const kx = w / 2 - knobR;
      const ky = h / 2 - knobR;
      return {
        parts: [
          { shape: roundedRectShape(w - knobR * 2, h * 0.55, 2), depth: t },
          { shape: circleShape(-kx, ky, knobR), depth: t },
          { shape: circleShape(-kx, -ky, knobR), depth: t },
          { shape: circleShape(kx, ky, knobR, 1.6), depth: t },
          { shape: circleShape(kx, -ky, knobR), depth: t },
        ],
        textArea: { cx: 0, cy: 0, w: w - knobR * 2.4, h: h * 0.5 },
        chipCenter: [0, 0],
      };
    }
    case "stand_plate": {
      const w = ff.widthMm;
      const h = ff.heightMm;
      return {
        parts: [{ shape: roundedRectShape(w, h, 8), depth: t }],
        textArea: { cx: 0, cy: h * 0.12, w: w * 0.82, h: h * 0.42 },
        chipCenter: [0, -h * 0.22],
      };
    }
  }
}

function useTextTexture(spec: TagDesignSpec, area: TextArea): THREE.CanvasTexture | null {
  const texture = useMemo(() => {
    if (typeof document === "undefined") return null;
    const pxPerMm = 24;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(area.w * pxPerMm);
    canvas.height = Math.round(area.h * pxPerMm);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const lines = spec.lines.map((l) => l.trim()).filter(Boolean);
    if (lines.length > 0) {
      const lineH = canvas.height / Math.max(lines.length, 1);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      lines.forEach((line, i) => {
        let size = lineH * 0.78;
        ctx.font = `900 ${size}px Outfit, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`;
        const measured = ctx.measureText(line).width;
        if (measured > canvas.width * 0.94) {
          size *= (canvas.width * 0.94) / measured;
          ctx.font = `900 ${size}px Outfit, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`;
        }
        const y = lineH * (i + 0.5);
        if (spec.textStyle === "engraved") {
          // 음각: 위쪽 그림자로 파인 느낌
          ctx.fillStyle = "rgba(0,0,0,0.35)";
          ctx.fillText(line, canvas.width / 2, y - size * 0.04);
        } else {
          ctx.fillStyle = "rgba(0,0,0,0.22)";
          ctx.fillText(line, canvas.width / 2 + size * 0.03, y + size * 0.05);
        }
        ctx.fillStyle = spec.textColor;
        ctx.fillText(line, canvas.width / 2, y);
      });
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }, [spec.lines, spec.textColor, spec.textStyle, area.w, area.h]);

  useEffect(() => () => texture?.dispose(), [texture]);
  return texture;
}

function TagModel({ formFactor, spec, showChip }: Props) {
  const { parts, textArea, chipCenter } = useMemo(() => buildBody(formFactor), [formFactor]);
  const geometries = useMemo(
    () =>
      parts.map(
        (p) =>
          new THREE.ExtrudeGeometry(p.shape, {
            depth: p.depth,
            bevelEnabled: true,
            bevelThickness: 0.4,
            bevelSize: 0.4,
            bevelSegments: 3,
            curveSegments: 48,
          })
      ),
    [parts]
  );
  useEffect(() => () => geometries.forEach((g) => g.dispose()), [geometries]);

  const material = getTagMaterial(spec.materialId);
  const texture = useTextTexture(spec, textArea);
  const t = formFactor.thicknessMm;
  const bodyOpacity = showChip ? Math.min(material.opacity, 0.35) : material.opacity;
  const isStand = formFactor.id === "stand_plate";

  return (
    // 윗면(+Z)이 카메라를 보도록 눕힌 상태가 기본. 스탠드는 세워서 받침을 붙인다.
    <group rotation={isStand ? [0, 0, 0] : [-Math.PI / 2.6, 0, 0]} position={isStand ? [0, formFactor.heightMm / 2, 0] : [0, t, 0]}>
      {geometries.map((g, i) => (
        <mesh key={i} geometry={g} castShadow receiveShadow>
          <meshStandardMaterial
            color={spec.bodyColor}
            roughness={material.roughness}
            metalness={material.metalness}
            transparent={bodyOpacity < 1}
            opacity={bodyOpacity}
          />
        </mesh>
      ))}
      {texture ? (
        <mesh position={[textArea.cx, textArea.cy, t + 0.45 + (spec.textStyle === "raised" ? 0.02 : 0)]}>
          <planeGeometry args={[textArea.w, textArea.h]} />
          <meshStandardMaterial map={texture} transparent roughness={0.6} depthWrite={false} />
        </mesh>
      ) : null}
      {showChip ? (
        <mesh position={[chipCenter[0], chipCenter[1], t - formFactor.chip.depthMm / 2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[formFactor.chip.diameterMm / 2, formFactor.chip.diameterMm / 2, formFactor.chip.depthMm, 48]} />
          <meshStandardMaterial color="#F59E0B" emissive="#B45309" emissiveIntensity={0.25} />
        </mesh>
      ) : null}
      {isStand ? (
        <mesh position={[0, -formFactor.heightMm / 2 - 2, -8]} castShadow>
          <boxGeometry args={[formFactor.widthMm, 4, 30]} />
          <meshStandardMaterial color={spec.bodyColor} roughness={material.roughness} metalness={material.metalness} />
        </mesh>
      ) : null}
    </group>
  );
}

export default function TagPreview3D(props: Props) {
  const size = Math.max(props.formFactor.widthMm, props.formFactor.heightMm);
  const isStand = props.formFactor.id === "stand_plate";
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, size * (isStand ? 0.9 : 1.1), size * 1.6], fov: 35, near: 1, far: size * 20 }}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
    >
      <color attach="background" args={["#F8FAFC"]} />
      <ambientLight intensity={0.65} />
      <directionalLight position={[size, size * 2, size]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-size, size, -size]} intensity={0.45} color="#CCEDEA" />
      <TagModel {...props} />
      <ContactShadows position={[0, -0.5, 0]} opacity={0.35} scale={size * 3} blur={2.4} far={size} />
      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={size * 0.9}
        maxDistance={size * 4}
        target={[0, isStand ? props.formFactor.heightMm / 2 : 0, 0]}
      />
    </Canvas>
  );
}
