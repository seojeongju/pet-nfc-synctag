/**
 * Next/webpack expect UTF-8 sources. UTF-16 files cause "stream did not contain valid UTF-8".
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SCAN_DIRS = ["src"];

const EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".css"]);

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith(".")) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules" || ent.name === ".next") continue;
      walk(p, files);
    } else if (EXT.has(path.extname(ent.name))) {
      files.push(p);
    }
  }
  return files;
}

function hasUtf16LeBom(buf) {
  return buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe;
}

function hasUtf16BeBom(buf) {
  return buf.length >= 2 && buf[0] === 0xfe && buf[1] === 0xff;
}

/** Heuristic: ASCII-only text saved as UTF-16 LE without BOM (e.g. "use client" -> 22 00 75 00). */
function looksLikeUtf16LeAsciiText(buf) {
  if (buf.length < 8) return false;
  let pairs = 0;
  const max = Math.min(buf.length - 1, 120);
  for (let i = 0; i < max; i += 2) {
    const hi = buf[i];
    const lo = buf[i + 1];
    if (lo !== 0) return false;
    if (hi === 0) return false;
    if (hi > 0x7f) return false;
    pairs++;
  }
  return pairs >= 4;
}

function checkBuffer(buf) {
  if (buf.length === 0) return null;

  if (hasUtf16LeBom(buf)) {
    return "UTF-16 LE (BOM FF FE). 에디터에서 UTF-8로 다시 저장하세요.";
  }
  if (hasUtf16BeBom(buf)) {
    return "UTF-16 BE (BOM FE FF). 에디터에서 UTF-8로 다시 저장하세요.";
  }
  if (looksLikeUtf16LeAsciiText(buf)) {
    return "UTF-16 LE로 보입니다(BOM 없음). 에디터에서 UTF-8로 다시 저장하세요.";
  }

  try {
    new TextDecoder("utf-8", { fatal: true }).decode(buf);
  } catch {
    return "유효하지 않은 UTF-8 바이트 시퀀스입니다.";
  }

  return null;
}

function main() {
  const files = [];
  for (const d of SCAN_DIRS) {
    walk(path.join(ROOT, d), files);
  }

  const problems = [];
  for (const file of files.sort()) {
    const buf = fs.readFileSync(file);
    const err = checkBuffer(buf);
    if (err) {
      problems.push({ file: path.relative(ROOT, file), err });
    }
  }

  if (problems.length > 0) {
    console.error("\n[check-source-utf8] 인코딩 오류:\n");
    for (const { file, err } of problems) {
      console.error(`  ${file}`);
      console.error(`    -> ${err}\n`);
    }
    console.error(
      "수정 예: 문제 파일 경로를 넣어 UTF-8로 저장 — node -e \"const fs=require('fs'),p='PATH';let b=fs.readFileSync(p);if(b[0]===0xFF&&b[1]===0xFE)b=b.slice(2);fs.writeFileSync(p,b.toString(b[1]===0&&b[3]===0?'utf16le':'utf8'),'utf8');\"\n"
    );
    process.exit(1);
  }

  console.log(`[check-source-utf8] OK (${files.length} files under ${SCAN_DIRS.join(", ")})`);
}

main();
