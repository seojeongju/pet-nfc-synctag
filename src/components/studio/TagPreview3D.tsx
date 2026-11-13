"use client";

/**
 * 커스텀 태그 3D 미리보기 (L1 파라메트릭).
 * 단위는 mm. 폼팩터 치수로 외형을 돌출하고, 문구·이미지는 윗면 캔버스 텍스처로 입힌다.
 */
import { useEffect, useMemo, useState } from "react";
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
    case "card_plate": {
      const w = ff.widthMm;
      const h = ff.heightMm;
      return {
        parts: [{ shape: roundedRectShape(w, h, 4), depth: t }],
        textArea: { cx: 0, cy: 0, w: w * 0.96, h: h * 0.96 },
        chipCenter: [w * 0.28, -h * 0.05],
      };
    }
  }
}

function loadImage(src: string | null): Promise<HTMLImageElement | null> {
  if (!src || typeof document === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function useFaceTexture(spec: TagDesignSpec, area: TextArea): THREE.CanvasTexture | null {
  const [faceEl, setFaceEl] = useState<HTMLImageElement | null>(null);
  const [logoEl, setLogoEl] = useState<HTMLImageElement | null>(null);
  const faceSrc = spec.faceArtSrc ?? null;
  const logoSrc = spec.image?.src ?? null;

  useEffect(() => {
    let cancelled = false;
    void loadImage(faceSrc).then((img) => {
      if (!cancelled) setFaceEl(img);
    });
    return () => {
      cancelled = true;
    };
  }, [faceSrc]);

  useEffect(() => {
    let cancelled = false;
    void loadImage(logoSrc).then((img) => {
      if (!cancelled) setLogoEl(img);
    });
    return () => {
      cancelled = true;
    };
  }, [logoSrc]);

  const texture = useMemo(() => {
    if (typeof document === "undefined") return null;
    const pxPerMm = faceSrc ? 18 : 24;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(area.w * pxPerMm);
    canvas.height = Math.round(area.h * pxPerMm);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // 템플릿 전면 아트(명함 등) — cover
    if (faceEl && faceSrc) {
      const ratio = Math.max(canvas.width / faceEl.width, canvas.height / faceEl.height);
      const dw = faceEl.width * ratio;
      const dh = faceEl.height * ratio;
      ctx.drawImage(faceEl, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh);
    }

    // 사용자 로고
    if (logoEl && logoSrc) {
      const scale = spec.image?.scale ?? 0.55;
      const opacity = spec.image?.opacity ?? 0.95;
      const maxW = canvas.width * scale * (faceSrc ? 0.28 : 1);
      const maxH = canvas.height * scale * (faceSrc ? 0.35 : 0.72);
      const ratio = Math.min(maxW / logoEl.width, maxH / logoEl.height);
      const dw = logoEl.width * ratio;
      const dh = logoEl.height * ratio;
      const dx = faceSrc ? canvas.width * 0.08 : (canvas.width - dw) / 2;
      const dy = faceSrc ? canvas.height * 0.12 : canvas.height * 0.08;
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.drawImage(logoEl, dx, dy, dw, dh);
      ctx.restore();
    }

    const lines = spec.lines.map((l) => l.trim()).filter(Boolean);
    // 플레이스홀더(NAME 등)만 있으면 전면 아트에 이미 있으므로 겹쳐 그리지 않음
    const placeholderOnly =
      Boolean(faceSrc) &&
      lines.length > 0 &&
      lines.every((l) => /^(NAME|SHORT TEXT|HELLO|LINK-U)$/i.test(l));
    if (lines.length > 0 && !placeholderOnly) {
      const textTop = faceSrc ? canvas.height * 0.32 : logoEl && logoSrc ? canvas.height * 0.55 : 0;
      const usableH = faceSrc ? canvas.height * 0.36 : canvas.height - textTop;
      const lineH = usableH / Math.max(lines.length, 1);
      ctx.textAlign = faceSrc ? "left" : "center";
      ctx.textBaseline = "middle";
      const x = faceSrc ? canvas.width * 0.1 : canvas.width / 2;
      lines.forEach((line, i) => {
        let size = lineH * (i === 0 ? 0.72 : 0.55);
        ctx.font = `900 ${size}px Outfit, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`;
        const maxW = canvas.width * (faceSrc ? 0.55 : 0.94);
        const measured = ctx.measureText(line).width;
        if (measured > maxW) {
          size *= maxW / measured;
          ctx.font = `900 ${size}px Outfit, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`;
        }
        const y = textTop + lineH * (i + 0.5);
        // 전면 아트 위에서는 가독성을 위해 살짝 배경 스트립
        if (faceSrc) {
          const padX = size * 0.2;
          const padY = size * 0.35;
          const tw = ctx.measureText(line).width;
          ctx.fillStyle = "rgba(255,255,255,0.82)";
          ctx.fillRect(x - padX, y - size / 2 - padY * 0.2, tw + padX * 2, size + padY);
        }
        if (spec.textStyle === "engraved") {
          ctx.fillStyle = "rgba(0,0,0,0.35)";
          ctx.fillText(line, x, y - size * 0.04);
        } else if (!faceSrc) {
          ctx.fillStyle = "rgba(0,0,0,0.22)";
          ctx.fillText(line, x + size * 0.03, y + size * 0.05);
        }
        ctx.fillStyle = faceSrc ? "#0F172A" : spec.textColor;
        ctx.fillText(line, x, y);
      });
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    tex.needsUpdate = true;
    return tex;
  }, [
    spec.lines,
    spec.textColor,
    spec.textStyle,
    spec.image?.opacity,
    spec.image?.scale,
    area.w,
    area.h,
    faceEl,
    faceSrc,
    logoEl,
    logoSrc,
  ]);

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
  const texture = useFaceTexture(spec, textArea);
  const t = formFactor.thicknessMm;
  const bodyOpacity = showChip ? Math.min(material.opacity, 0.35) : material.opacity;
  const isStand = formFactor.id === "stand_plate";
  const isCard = formFactor.id === "card_plate";
  const hasFaceArt = Boolean(spec.faceArtSrc);
  const hasFace = Boolean(
    texture && (hasFaceArt || spec.lines.some((l) => l.trim()) || spec.image?.src)
  );

  return (
    <group
      rotation={isStand ? [0, 0, 0] : isCard ? [-Math.PI / 2.2, 0, 0] : [-Math.PI / 2.6, 0, 0]}
      position={isStand ? [0, formFactor.heightMm / 2, 0] : [0, t, 0]}
    >
      {geometries.map((g, i) => (
        <mesh key={i} geometry={g} castShadow receiveShadow>
          <meshStandardMaterial
            color={hasFaceArt ? "#E2E8F0" : spec.bodyColor}
            roughness={material.roughness}
            metalness={material.metalness}
            transparent={bodyOpacity < 1}
            opacity={bodyOpacity}
          />
        </mesh>
      ))}
      {hasFace && texture ? (
        <mesh position={[textArea.cx, textArea.cy, t + 0.35 + (spec.textStyle === "raised" ? 0.02 : 0)]}>
          <planeGeometry args={[textArea.w, textArea.h]} />
          <meshStandardMaterial map={texture} transparent roughness={0.55} depthWrite={false} />
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
  const isCard = props.formFactor.id === "card_plate";
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{
        position: [0, size * (isStand ? 0.9 : isCard ? 0.85 : 1.1), size * (isCard ? 1.35 : 1.6)],
        fov: 35,
        near: 1,
        far: size * 20,
      }}
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
