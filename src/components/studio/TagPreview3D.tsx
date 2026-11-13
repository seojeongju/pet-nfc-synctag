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
import { getTagMaterial, type TagDesignSpec } from "@/lib/platform/tag-design";
import {
  faceGeometryFor,
  paintFaceCanvas,
  useFaceImages,
  type FaceArea,
  type FaceGeometry,
} from "@/components/studio/tag-face-paint";

type Props = {
  formFactor: FormFactor;
  spec: TagDesignSpec;
  showChip: boolean;
};

type TextArea = FaceArea;

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

function buildBody(ff: FormFactor): { parts: BodyPart[] } & FaceGeometry {
  const t = ff.thicknessMm;
  switch (ff.id) {
    case "keyring_round": {
      const r = ff.widthMm / 2;
      const cy = -(ff.heightMm - ff.widthMm) / 2;
      const tabY = cy + r + 2;
      return {
        ...faceGeometryFor(ff),
        parts: [
          { shape: circleShape(0, cy, r), depth: t },
          { shape: circleShape(0, tabY, 6, 3), depth: t * 0.75 },
        ],
      };
    }
    case "pendant_bone": {
      const w = ff.widthMm;
      const h = ff.heightMm;
      const knobR = h * 0.27;
      const kx = w / 2 - knobR;
      const ky = h / 2 - knobR;
      return {
        ...faceGeometryFor(ff),
        parts: [
          { shape: roundedRectShape(w - knobR * 2, h * 0.55, 2), depth: t },
          { shape: circleShape(-kx, ky, knobR), depth: t },
          { shape: circleShape(-kx, -ky, knobR), depth: t },
          { shape: circleShape(kx, ky, knobR, 1.6), depth: t },
          { shape: circleShape(kx, -ky, knobR), depth: t },
        ],
      };
    }
    case "stand_plate": {
      const w = ff.widthMm;
      const h = ff.heightMm;
      return {
        ...faceGeometryFor(ff),
        parts: [{ shape: roundedRectShape(w, h, 8), depth: t }],
      };
    }
    case "card_plate": {
      const w = ff.widthMm;
      const h = ff.heightMm;
      return {
        ...faceGeometryFor(ff),
        parts: [{ shape: roundedRectShape(w, h, 4), depth: t }],
      };
    }
  }
}

/** 공용 윗면 캔버스(2D 미리보기와 동일)를 3D 텍스처로 */
function paintFaceTexture(
  spec: TagDesignSpec,
  area: TextArea,
  faceEl: HTMLImageElement | null,
  logoEl: HTMLImageElement | null
): THREE.CanvasTexture | null {
  const canvas = paintFaceCanvas(spec, area, faceEl, logoEl);
  if (!canvas) return null;
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
  const { faceEl, logoEl } = useFaceImages(spec);

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
