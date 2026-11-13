"use client";

/**
 * 커스텀 태그 3D 미리보기 (L1 파라메트릭).
 * 단위는 mm. 폼팩터 치수로 외형을 돌출하고, 문구·이미지는 윗면 캔버스 텍스처로 입힌다.
 *
 * React 렌더러(@react-three/fiber) 없이 three.js를 직접 쓴다 — Next 15 App Router의 React 19 런타임에서
 * fiber v8이 React 18 내부(ReactCurrentBatchConfig)를 읽다가 페이지 전체가 깨졌기 때문.
 * `next/dynamic(ssr:false)`로만 불러야 한다.
 */
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { FormFactor } from "@/lib/platform/form-factors";
import { TEXT_COLOR_DESIGN, getTagMaterial, type TagDesignSpec } from "@/lib/platform/tag-design";
import { getCardFaceLayout } from "@/lib/platform/card-face-layouts";

type Props = {
  formFactor: FormFactor;
  spec: TagDesignSpec;
  showChip: boolean;
};

type TextArea = { cx: number; cy: number; w: number; h: number };

/** 돌출 모서리 둥글림. 윗면 실제 높이 = 두께 + BEVEL_MM 이므로 문구 면은 그 위에 둔다 */
const BEVEL_MM = 0.4;
type BodyPart = { shape: THREE.Shape; depth: number };

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

function useLoadedImage(src: string | null): HTMLImageElement | null {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    let cancelled = false;
    setImg(null);
    void loadImage(src).then((el) => {
      if (!cancelled) setImg(el);
    });
    return () => {
      cancelled = true;
    };
  }, [src]);
  return img;
}

function isLightColor(hex: string): boolean {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return false;
  const [r, g, b] = [m[1], m[2], m[3]].map((v) => parseInt(v!, 16));
  return 0.299 * r! + 0.587 * g! + 0.114 * b! > 160;
}

/** 윗면 캔버스 텍스처: 템플릿 전면 아트 · 사용자 로고 · 문구 */
function paintFaceTexture(
  spec: TagDesignSpec,
  area: TextArea,
  faceEl: HTMLImageElement | null,
  logoEl: HTMLImageElement | null
): THREE.CanvasTexture | null {
  const faceSrc = spec.faceArtSrc ?? null;
  const logoSrc = spec.image?.src ?? null;
  const pxPerMm = faceSrc ? 18 : 24;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(area.w * pxPerMm);
  canvas.height = Math.round(area.h * pxPerMm);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // 템플릿 전면 아트(명함 등) — cover. 명함 템플릿은 글자 없는 배경(blank)이 faceEl로 들어온다
  const cardLayout = getCardFaceLayout(faceSrc);
  let art: { x: number; y: number; w: number; h: number } | null = null;
  if (faceEl && faceSrc) {
    const ratio = Math.max(canvas.width / faceEl.width, canvas.height / faceEl.height);
    const dw = faceEl.width * ratio;
    const dh = faceEl.height * ratio;
    art = { x: (canvas.width - dw) / 2, y: (canvas.height - dh) / 2, w: dw, h: dh };
    ctx.drawImage(faceEl, art.x, art.y, dw, dh);
  }

  // 명함 템플릿: 1·2번째 문구를 원래 NAME / SHORT TEXT 자리에 디자인 그대로(굵게·같은 색) 채운다
  if (cardLayout && art) {
    const frame = art;
    spec.lines.slice(0, cardLayout.slots.length).forEach((raw, i) => {
      const line = raw.trim();
      const slot = cardLayout.slots[i];
      if (!line || !slot) return;
      const sx = frame.x + slot.x * frame.w;
      const sy = frame.y + slot.y * frame.h;
      const sw = slot.w * frame.w;
      const sh = slot.h * frame.h;
      let size = sh * 0.82;
      const font = (px: number) => `900 ${px}px Outfit, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`;
      ctx.font = font(size);
      const measured = ctx.measureText(line).width;
      if (measured > sw) {
        size *= sw / measured;
        ctx.font = font(size);
      }
      ctx.textBaseline = "middle";
      ctx.textAlign = slot.align;
      const x = slot.align === "center" ? sx + sw / 2 : sx;
      const y = sy + sh / 2;
      const color = spec.textColor === TEXT_COLOR_DESIGN ? slot.color : spec.textColor;
      // 원본 아트의 입체 글자 느낌: 아래쪽 옅은 그림자 (밝은 글자일수록 진하게)
      ctx.fillStyle = isLightColor(color) ? "rgba(0,0,0,0.28)" : "rgba(15,23,42,0.18)";
      ctx.fillText(line, x + size * 0.02, y + size * 0.05);
      ctx.fillStyle = color;
      ctx.fillText(line, x, y);
    });
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
    Boolean(faceSrc) && lines.length > 0 && lines.every((l) => /^(NAME|SHORT TEXT|HELLO|LINK-U)$/i.test(l));
  if (!cardLayout && lines.length > 0 && !placeholderOnly) {
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
      ctx.fillStyle = faceSrc || spec.textColor === TEXT_COLOR_DESIGN ? "#0F172A" : spec.textColor;
      ctx.fillText(line, x, y);
    });
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

function disposeObject(root: THREE.Object3D) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
    for (const m of Array.isArray(mat) ? mat : mat ? [mat] : []) {
      (m as THREE.MeshStandardMaterial).map?.dispose();
      m.dispose();
    }
  });
}

function buildTagGroup(
  formFactor: FormFactor,
  spec: TagDesignSpec,
  showChip: boolean,
  faceEl: HTMLImageElement | null,
  logoEl: HTMLImageElement | null
): THREE.Group {
  const { parts, textArea, chipCenter } = buildBody(formFactor);
  const material = getTagMaterial(spec.materialId);
  const t = formFactor.thicknessMm;
  const bodyOpacity = showChip ? Math.min(material.opacity, 0.35) : material.opacity;
  const isStand = formFactor.id === "stand_plate";
  const isCard = formFactor.id === "card_plate";
  const hasFaceArt = Boolean(spec.faceArtSrc);

  // 윗면(+Z)이 카메라를 보도록 눕힌 상태가 기본. 스탠드는 세워서 받침을 붙인다.
  const group = new THREE.Group();
  if (isStand) {
    group.position.set(0, formFactor.heightMm / 2, 0);
  } else {
    group.rotation.x = isCard ? -Math.PI / 2.2 : -Math.PI / 2.6;
    group.position.set(0, t, 0);
  }

  for (const p of parts) {
    const mesh = new THREE.Mesh(
      new THREE.ExtrudeGeometry(p.shape, {
        depth: p.depth,
        bevelEnabled: true,
        bevelThickness: BEVEL_MM,
        bevelSize: BEVEL_MM,
        bevelSegments: 3,
        curveSegments: 48,
      }),
      new THREE.MeshStandardMaterial({
        color: hasFaceArt ? "#E2E8F0" : spec.bodyColor,
        roughness: material.roughness,
        metalness: material.metalness,
        transparent: bodyOpacity < 1,
        opacity: bodyOpacity,
      })
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  const hasContent = hasFaceArt || spec.lines.some((l) => l.trim()) || Boolean(spec.image?.src);
  const texture = hasContent ? paintFaceTexture(spec, textArea, faceEl, logoEl) : null;
  if (texture) {
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(textArea.w, textArea.h),
      new THREE.MeshStandardMaterial({ map: texture, transparent: true, roughness: 0.55, depthWrite: false })
    );
    face.position.set(textArea.cx, textArea.cy, t + BEVEL_MM + (spec.textStyle === "raised" ? 0.12 : 0.06));
    group.add(face);
  }

  if (showChip) {
    const r = formFactor.chip.diameterMm / 2;
    const chip = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r, formFactor.chip.depthMm, 48),
      new THREE.MeshStandardMaterial({ color: "#F59E0B", emissive: "#B45309", emissiveIntensity: 0.25 })
    );
    chip.rotation.x = Math.PI / 2;
    chip.position.set(chipCenter[0], chipCenter[1], t - formFactor.chip.depthMm / 2);
    group.add(chip);
  }

  if (isStand) {
    const foot = new THREE.Mesh(
      new THREE.BoxGeometry(formFactor.widthMm, 4, 30),
      new THREE.MeshStandardMaterial({ color: spec.bodyColor, roughness: material.roughness, metalness: material.metalness })
    );
    foot.position.set(0, -formFactor.heightMm / 2 - 2, -8);
    foot.castShadow = true;
    group.add(foot);
  }
  return group;
}

type Stage = {
  scene: THREE.Scene;
  model: THREE.Group | null;
};

export default function TagPreview3D({ formFactor, spec, showChip }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Stage | null>(null);
  const [stageVersion, setStageVersion] = useState(0);
  const [webglFailed, setWebglFailed] = useState(false);
  // 명함 템플릿은 자리표시 글자를 지운 배경을 깔고 문구를 슬롯에 그린다
  const faceEl = useLoadedImage(getCardFaceLayout(spec.faceArtSrc)?.blankSrc ?? spec.faceArtSrc ?? null);
  const logoEl = useLoadedImage(spec.image?.src ?? null);

  // 장면·카메라·조명·컨트롤 — 폼팩터가 바뀔 때만 다시 만든다
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const size = Math.max(formFactor.widthMm, formFactor.heightMm);
    const isStand = formFactor.id === "stand_plate";
    const isCard = formFactor.id === "card_plate";

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    } catch {
      setWebglFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.touchAction = "none";
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#F8FAFC");
    scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(size, size * 2, size);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    const shadowCam = key.shadow.camera;
    shadowCam.left = -size * 1.5;
    shadowCam.right = size * 1.5;
    shadowCam.top = size * 1.5;
    shadowCam.bottom = -size * 1.5;
    shadowCam.far = size * 8;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xccedea, 0.45);
    fill.position.set(-size, size, -size);
    scene.add(fill);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(size * 6, size * 6), new THREE.ShadowMaterial({ opacity: 0.16 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    const camera = new THREE.PerspectiveCamera(35, 1, 1, size * 20);
    camera.position.set(0, size * (isStand ? 0.9 : isCard ? 0.85 : 1.1), size * (isCard ? 1.35 : 1.6));

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.minDistance = size * 0.9;
    controls.maxDistance = size * 4;
    controls.target.set(0, isStand ? formFactor.heightMm / 2 : 0, 0);
    controls.update();

    const resize = () => {
      const w = mount.clientWidth || 1;
      const h = mount.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    renderer.setAnimationLoop(() => {
      controls.update();
      renderer.render(scene, camera);
    });

    stageRef.current = { scene, model: null };
    setStageVersion((v) => v + 1);

    return () => {
      ro.disconnect();
      renderer.setAnimationLoop(null);
      controls.dispose();
      disposeObject(scene);
      renderer.dispose();
      renderer.domElement.remove();
      stageRef.current = null;
    };
  }, [formFactor]);

  // 모델 — 디자인·칩 표시·이미지가 바뀔 때마다 교체
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    if (stage.model) {
      stage.scene.remove(stage.model);
      disposeObject(stage.model);
    }
    const model = buildTagGroup(formFactor, spec, showChip, faceEl, logoEl);
    stage.scene.add(model);
    stage.model = model;
  }, [stageVersion, formFactor, spec, showChip, faceEl, logoEl]);

  if (webglFailed) {
    return (
      <div className="flex h-full w-full items-center justify-center px-6 text-center text-[12px] font-bold text-slate-400">
        이 기기에서는 3D 미리보기를 표시할 수 없습니다. 디자인 저장은 그대로 가능합니다.
      </div>
    );
  }
  return <div ref={mountRef} className="h-full w-full" />;
}
