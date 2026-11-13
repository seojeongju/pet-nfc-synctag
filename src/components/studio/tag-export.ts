"use client";

/**
 * 제작용 3D 파일 내보내기 (브라우저에서 생성, 서버 부담 없음).
 * - STL: 본체 + 양각 문구를 합친 단일 메시 (슬라이서가 겹침을 합집합으로 처리)
 * - 3MF: 본체 / 문구(양각·음각) / 칩 포켓을 이름 붙인 객체로 분리 (공정에서 포켓·음각은 빼기 연산)
 * 문구 형상은 윗면 캔버스의 글자 마스크를 0.4mm 격자로 돌출시켜 만든다(글꼴 벡터 불필요).
 * 로고·템플릿 아트는 표면 인쇄 대상이라 형상에 넣지 않는다.
 */
import * as THREE from "three";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { FormFactor } from "@/lib/platform/form-factors";
import { PRODUCTION_RULES } from "@/lib/platform/production-check";
import { chipCenterMm } from "@/lib/platform/tag-geometry";
import { getTagMaterial, type TagDesignSpec } from "@/lib/platform/tag-design";
import { buildBody } from "@/components/studio/tag-body-shapes";
import { paintFace } from "@/components/studio/tag-face-paint";

export type ExportObject = {
  name: string;
  /** 3MF 객체 역할 */
  role: "body" | "text-raised" | "text-engrave" | "chip-pocket";
  geometry: THREE.BufferGeometry;
  color: string;
};

const TEXT_CELL_MM = 0.4;
const MAX_TEXT_BOXES = 24000;

/** 윗면 캔버스의 글자 마스크를 격자 상자로 돌출 (알파 240 이상 = 글자 본체, 그림자·스트립 제외) */
function buildTextGeometry(ff: FormFactor, spec: TagDesignSpec): THREE.BufferGeometry | null {
  const { textArea } = buildBody(ff);
  const face = paintFace({ ...spec, image: { ...spec.image, src: null } }, textArea, null, null);
  if (!face) return null;
  const canvas = face.canvas;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const pxPerMm = canvas.width / textArea.w;
  const t = ff.thicknessMm;
  const engraved = spec.textStyle === "engraved";
  const z0 = engraved ? t - PRODUCTION_RULES.engraveDepthMm : t - 0.1;
  const z1 = engraved ? t + 0.1 : t + PRODUCTION_RULES.raisedTextMm;

  let cell = TEXT_CELL_MM;
  for (let attempt = 0; attempt < 3; attempt++) {
    const cols = Math.floor(textArea.w / cell);
    const rows = Math.floor(textArea.h / cell);
    const boxes: THREE.BufferGeometry[] = [];
    for (let j = 0; j < rows; j++) {
      const py = Math.min(canvas.height - 1, Math.round((j + 0.5) * cell * pxPerMm));
      let run = -1;
      for (let i = 0; i <= cols; i++) {
        const px = Math.min(canvas.width - 1, Math.round((i + 0.5) * cell * pxPerMm));
        const on = i < cols && data[(py * canvas.width + px) * 4 + 3]! >= 240;
        if (on && run < 0) run = i;
        if (!on && run >= 0) {
          const x0 = textArea.cx - textArea.w / 2 + run * cell;
          const x1 = textArea.cx - textArea.w / 2 + i * cell;
          const yTop = textArea.cy + textArea.h / 2 - j * cell;
          const g = new THREE.BoxGeometry(x1 - x0, cell, z1 - z0);
          g.translate((x0 + x1) / 2, yTop - cell / 2, (z0 + z1) / 2);
          boxes.push(g);
          run = -1;
        }
      }
    }
    if (boxes.length === 0) return null;
    if (boxes.length <= MAX_TEXT_BOXES) {
      const merged = mergeGeometries(boxes, false);
      boxes.forEach((b) => b.dispose());
      return merged;
    }
    boxes.forEach((b) => b.dispose());
    cell *= 1.5;
  }
  return null;
}

function toNonIndexed(g: THREE.BufferGeometry): THREE.BufferGeometry {
  return g.index ? g.toNonIndexed() : g;
}

export function buildExportObjects(ff: FormFactor, spec: TagDesignSpec): ExportObject[] {
  const { parts } = buildBody(ff);
  const bodyParts = parts.map((p) =>
    toNonIndexed(new THREE.ExtrudeGeometry(p.shape, { depth: p.depth, bevelEnabled: false, curveSegments: 64 }))
  );
  const body = mergeGeometries(bodyParts, false)!;
  bodyParts.forEach((g) => g.dispose());

  const objects: ExportObject[] = [{ name: "body", role: "body", geometry: body, color: spec.bodyColor }];

  const text = buildTextGeometry(ff, spec);
  if (text) {
    const engraved = spec.textStyle === "engraved";
    objects.push({
      name: engraved ? "text-engrave (subtract)" : "text-raised",
      role: engraved ? "text-engrave" : "text-raised",
      geometry: toNonIndexed(text),
      color: spec.textColor.startsWith("#") ? spec.textColor : "#FFFFFF",
    });
  }

  // 칩 포켓: 윗면에서 chipCoverMm 아래, 지름·깊이에 여유. 출력 중 일시정지 후 칩 삽입용 밀폐 공동(빼기 연산)
  const [cx, cy] = chipCenterMm(ff, spec);
  const tol = PRODUCTION_RULES.chipPocketToleranceMm;
  const depth = ff.chip.depthMm + tol;
  const top = ff.thicknessMm - PRODUCTION_RULES.chipCoverMm;
  const bottom = Math.max(0.6, top - depth);
  const pocket = new THREE.CylinderGeometry(ff.chip.diameterMm / 2 + tol, ff.chip.diameterMm / 2 + tol, top - bottom, 64);
  pocket.rotateX(Math.PI / 2);
  pocket.translate(cx, cy, (top + bottom) / 2);
  objects.push({ name: "chip-pocket (subtract)", role: "chip-pocket", geometry: toNonIndexed(pocket), color: "#F59E0B" });

  return objects;
}

export function disposeExportObjects(objects: ExportObject[]) {
  objects.forEach((o) => o.geometry.dispose());
}

/** STL(바이너리): 본체 + 양각 문구. 음각·포켓은 빼기 연산이 필요해 STL에는 넣지 않는다 */
export function exportStl(objects: ExportObject[]): Blob {
  const scene = new THREE.Scene();
  for (const o of objects) {
    if (o.role === "body" || o.role === "text-raised") scene.add(new THREE.Mesh(o.geometry));
  }
  const out = new STLExporter().parse(scene, { binary: true }) as DataView;
  return new Blob([out.buffer as ArrayBuffer], { type: "model/stl" });
}

// ── 3MF (zip 저장 방식 + core XML) ─────────────────────────────

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]!) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** 압축 없는 zip (3MF 컨테이너) */
function zipStore(files: Array<{ name: string; data: Uint8Array }>): Blob {
  const enc = new TextEncoder();
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;
  for (const f of files) {
    const name = enc.encode(f.name);
    const crc = crc32(f.data);
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true);
    lh.setUint16(4, 20, true);
    lh.setUint16(6, 0x0800, true); // UTF-8 이름
    lh.setUint16(8, 0, true);
    lh.setUint16(10, 0, true);
    lh.setUint16(12, 0x21, true);
    lh.setUint32(14, crc, true);
    lh.setUint32(18, f.data.length, true);
    lh.setUint32(22, f.data.length, true);
    lh.setUint16(26, name.length, true);
    lh.setUint16(28, 0, true);
    const local = new Uint8Array(30 + name.length + f.data.length);
    local.set(new Uint8Array(lh.buffer), 0);
    local.set(name, 30);
    local.set(f.data, 30 + name.length);
    locals.push(local);

    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true);
    ch.setUint16(4, 20, true);
    ch.setUint16(6, 20, true);
    ch.setUint16(8, 0x0800, true);
    ch.setUint16(10, 0, true);
    ch.setUint16(12, 0, true);
    ch.setUint16(14, 0x21, true);
    ch.setUint32(16, crc, true);
    ch.setUint32(20, f.data.length, true);
    ch.setUint32(24, f.data.length, true);
    ch.setUint16(28, name.length, true);
    ch.setUint32(42, offset, true);
    const central = new Uint8Array(46 + name.length);
    central.set(new Uint8Array(ch.buffer), 0);
    central.set(name, 46);
    centrals.push(central);
    offset += local.length;
  }
  const cdSize = centrals.reduce((n, c) => n + c.length, 0);
  const eocd = new DataView(new ArrayBuffer(22));
  eocd.setUint32(0, 0x06054b50, true);
  eocd.setUint16(8, files.length, true);
  eocd.setUint16(10, files.length, true);
  eocd.setUint32(12, cdSize, true);
  eocd.setUint32(16, offset, true);
  const parts: BlobPart[] = [...locals, ...centrals, new Uint8Array(eocd.buffer)].map((u) => u.buffer as ArrayBuffer);
  return new Blob(parts, { type: "model/3mf" });
}

function xmlEscape(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** 비인덱스 geometry → 중복 제거된 정점·삼각형 XML */
function meshXml(g: THREE.BufferGeometry): string {
  const pos = g.getAttribute("position");
  const verts: string[] = [];
  const index = new Map<string, number>();
  const tris: string[] = [];
  const idxOf = (i: number) => {
    const x = pos.getX(i).toFixed(3);
    const y = pos.getY(i).toFixed(3);
    const z = pos.getZ(i).toFixed(3);
    const key = `${x},${y},${z}`;
    let id = index.get(key);
    if (id === undefined) {
      id = verts.length;
      index.set(key, id);
      verts.push(`<vertex x="${x}" y="${y}" z="${z}"/>`);
    }
    return id;
  };
  for (let i = 0; i < pos.count; i += 3) {
    const a = idxOf(i);
    const b = idxOf(i + 1);
    const c = idxOf(i + 2);
    if (a !== b && b !== c && a !== c) tris.push(`<triangle v1="${a}" v2="${b}" v3="${c}"/>`);
  }
  return `<mesh><vertices>${verts.join("")}</vertices><triangles>${tris.join("")}</triangles></mesh>`;
}

export function export3mf(objects: ExportObject[], meta: { title: string; formFactor: FormFactor; spec: TagDesignSpec }): Blob {
  const materials = objects.map((o) => `<base name="${xmlEscape(o.name)}" displaycolor="${o.color.toUpperCase()}FF"/>`).join("");
  const objXml = objects
    .map((o, i) => `<object id="${i + 2}" name="${xmlEscape(o.name)}" type="model" pid="1" pindex="${i}">${meshXml(o.geometry)}</object>`)
    .join("");
  const items = objects.map((_, i) => `<item objectid="${i + 2}"/>`).join("");
  const mat = getTagMaterial(meta.spec.materialId);
  const notes = [
    `tag:${meta.formFactor.id}`,
    `chip:${meta.formFactor.chip.type}`,
    `material:${mat.name}(${mat.process})`,
    `text:${meta.spec.textStyle}`,
    "subtract: chip-pocket" + (meta.spec.textStyle === "engraved" ? ", text-engrave" : ""),
  ].join("; ");
  const model =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<model unit="millimeter" xml:lang="ko-KR" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">` +
    `<metadata name="Title">${xmlEscape(meta.title)}</metadata>` +
    `<metadata name="Designer">Link-U Studio</metadata>` +
    `<metadata name="Description">${xmlEscape(notes)}</metadata>` +
    `<resources><basematerials id="1">${materials}</basematerials>${objXml}</resources>` +
    `<build>${items}</build></model>`;
  const contentTypes =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>`;
  const rels =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>`;
  const enc = new TextEncoder();
  return zipStore([
    { name: "[Content_Types].xml", data: enc.encode(contentTypes) },
    { name: "_rels/.rels", data: enc.encode(rels) },
    { name: "3D/3dmodel.model", data: enc.encode(model) },
  ]);
}

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function exportFilename(title: string, ext: "stl" | "3mf") {
  const safe = title.trim().replace(/[\\/:*?"<>|]+/g, "_").slice(0, 40) || "linku-tag";
  return `${safe}.${ext}`;
}
