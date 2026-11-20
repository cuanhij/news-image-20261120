// news-image-20261120: "The World in One Day - Friday 20 November 2026"
// Draws a newspaper front page summing up 20 Nov 2026 world news.
// Own code: own 5x7 bitmap font, own PNG encoder, no network, no assets.
// Writes entry.png to $MAKEFUN_OUTPUT_DIR (or /output). Deterministic.

import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

// ---------- 5x7 bitmap font (own glyphs, 7 rows of 5 bits each) ----------
const FONT: Record<string, string[]> = {
  "A": [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  "B": ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  "C": [".####", "#....", "#....", "#....", "#....", "#....", ".####"],
  "D": ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  "E": ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  "F": ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  "G": [".####", "#....", "#....", "#.###", "#...#", "#...#", ".###."],
  "H": ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  "I": ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"],
  "J": ["..###", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."],
  "K": ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  "L": ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  "M": ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  "N": ["#...#", "##..#", "##..#", "#.#.#", "#..##", "#..##", "#...#"],
  "O": [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  "P": ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  "Q": [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
  "R": ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  "S": [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  "T": ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  "U": ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  "V": ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  "W": ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"],
  "X": ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
  "Y": ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
  "Z": ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
  "0": [".###.", "#..##", "#.#.#", "##..#", "#...#", "#...#", ".###."],
  "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  "2": [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  "3": ["####.", "....#", "....#", ".###.", "....#", "....#", "####."],
  "4": ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  "5": ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  "6": [".###.", "#....", "#....", "####.", "#...#", "#...#", ".###."],
  "7": ["#####", "....#", "...#.", "...#.", "..#..", "..#..", "..#.."],
  "8": [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  "9": [".###.", "#...#", "#...#", ".####", "....#", "....#", ".###."],
  " ": [".....", ".....", ".....", ".....", ".....", ".....", "....."],
  ".": [".....", ".....", ".....", ".....", ".....", ".##..", ".##.."],
  ";": [".....", ".##..", ".##..", ".....", ".##..", ".##..", ".#..."],
  ",": [".....", ".....", ".....", ".....", ".##..", ".##..", ".#..."],
  "-": [".....", ".....", ".....", ".###.", ".....", ".....", "....."],
  "'": ["..#..", "..#..", "..#..", ".....", ".....", ".....", "....."],
  ":": [".....", ".##..", ".##..", ".....", ".##..", ".##..", "....."],
  "/": ["....#", "....#", "...#.", "..#..", ".#...", "#....", "#...."],
  "%": ["##..#", "##.#.", "..#..", ".#...", "#..##", "#..##", "....."],
  "$": ["..#..", ".####", "#.#..", ".###.", "..#.#", "####.", "..#.."],
  "&": [".##..", "#..#.", "#..#.", ".#...", "#.#.#", "#..#.", ".##.#"],
  "!": ["..#..", "..#..", "..#..", "..#..", "..#..", ".....", "..#.."],
  "?": [".###.", "#...#", "....#", "...#.", "..#..", ".....", "..#.."],
  "(": ["...##", "..#..", ".#...", ".#...", ".#...", "..#..", "...##"],
  ")": ["##...", "..#..", "...#.", "...#.", "...#.", "..#..", "##..."],
  "+": [".....", "..#..", "..#..", ".###.", "..#..", "..#..", "....."],
  "=": [".....", ".....", ".###.", ".....", ".###.", ".....", "....."],
  '"': [".#.#.", ".#.#.", ".....", ".....", ".....", ".....", "....."],
  "*": [".....", ".#.#.", "..#..", ".###.", "..#..", ".#.#.", "....."],
};

// ---------- PNG encoder (own code, Node zlib for the deflate step) ----------
function crc32(buf: Buffer): number {
  let table = crc32.table;
  if (!table) {
    table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
    crc32.table = table;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
crc32.table = null as unknown as Int32Array;

function pngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}

function encodePNG(w: number, h: number, rgb: Uint8Array): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const raw = Buffer.alloc(h * (1 + w * 3));
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 3)] = 0; // filter: none
    raw.set(rgb.subarray(y * w * 3, (y + 1) * w * 3), y * (1 + w * 3) + 1);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", idat),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------- Framebuffer + drawing helpers ----------
const W = 1024;
const H = 1024;
const px = new Uint8Array(W * H * 3);
type RGB = [number, number, number];

const PAPER: RGB = [246, 241, 229];
const INK: RGB = [26, 26, 26];
const RED: RGB = [178, 28, 28];
const WHITE: RGB = [255, 255, 255];
const GREY: RGB = [110, 105, 92];
const BLUE: RGB = [38, 64, 128];
const SKY: RGB = [90, 140, 190];

function fill(r: number, g: number, b: number): void {
  for (let i = 0; i < W * H; i++) {
    px[i * 3] = r;
    px[i * 3 + 1] = g;
    px[i * 3 + 2] = b;
  }
}

function setPixel(x: number, y: number, c: RGB): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = c[0];
  px[i + 1] = c[1];
  px[i + 2] = c[2];
}

function fillRect(x: number, y: number, w: number, h: number, c: RGB): void {
  for (let yy = y; yy < y + h; yy++)
    for (let xx = x; xx < x + w; xx++) setPixel(xx, yy, c);
}

function drawRect(x: number, y: number, w: number, h: number, c: RGB, t = 1): void {
  fillRect(x, y, w, t, c);
  fillRect(x, y + h - t, w, t, c);
  fillRect(x, y, t, h, c);
  fillRect(x + w - t, y, t, h, c);
}

function drawLine(x0: number, y0: number, x1: number, y1: number, c: RGB): void {
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let x = x0;
  let y = y0;
  for (;;) {
    setPixel(x, y, c);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
}

function drawCircle(cx: number, cy: number, r: number, c: RGB): void {
  let x = r;
  let y = 0;
  let err = 0;
  while (x >= y) {
    setPixel(cx + x, cy + y, c);
    setPixel(cx + y, cy + x, c);
    setPixel(cx - y, cy + x, c);
    setPixel(cx - x, cy + y, c);
    setPixel(cx - x, cy - y, c);
    setPixel(cx - y, cy - x, c);
    setPixel(cx + y, cy - x, c);
    setPixel(cx + x, cy - y, c);
    y += 1;
    err += 1 + 2 * y;
    if (2 * (err - x) + 1 > 0) {
      x -= 1;
      err += 1 - 2 * x;
    }
  }
}

// ---------- Text ----------
function charWidth(scale: number): number {
  return 6 * scale;
}
function textWidth(text: string, scale: number): number {
  return text.length * charWidth(scale) - scale;
}
function drawText(x: number, y: number, text: string, scale: number, c: RGB): void {
  let cx = x;
  for (const ch of text.toUpperCase()) {
    const glyph = FONT[ch] ?? FONT["?"];
    for (let row = 0; row < 7; row++) {
      const bits = glyph[row];
      for (let col = 0; col < 5; col++) {
        if (bits[col] === "#") fillRect(cx + col * scale, y + row * scale, scale, scale, c);
      }
    }
    cx += charWidth(scale);
  }
}
function drawTextCentred(cx: number, y: number, text: string, scale: number, c: RGB): void {
  drawText(cx - Math.floor(textWidth(text, scale) / 2), y, text, scale, c);
}
function wrapText(text: string, scale: number, maxW: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur === "" ? w : cur + " " + w;
    if (textWidth(test, scale) <= maxW) {
      cur = test;
    } else {
      if (cur !== "") lines.push(cur);
      cur = w;
    }
  }
  if (cur !== "") lines.push(cur);
  return lines;
}
function drawWrapped(x: number, y: number, text: string, scale: number, maxW: number, c: RGB, leading: number): number {
  const lines = wrapText(text, scale, maxW);
  let yy = y;
  for (const line of lines) {
    drawText(x, yy, line, scale, c);
    yy += 7 * scale + leading;
  }
  return yy;
}

// ---------- Small icons and flags (own drawings) ----------
function drawStar(cx: number, cy: number, r: number, c: RGB): void {
  // 5-point star: lines from centre to the 10 vertices, then outline.
  const pts: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const ang = (Math.PI * i) / 5 - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.45;
    pts.push([cx + Math.round(Math.cos(ang) * rad), cy + Math.round(Math.sin(ang) * rad)]);
  }
  for (let i = 0; i < 10; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[(i + 1) % 10];
    drawLine(x0, y0, x1, y1, c);
    drawLine(cx, cy, x0, y0, c);
  }
  setPixel(cx, cy, c);
}

function flagUSA(x: number, y: number, w: number, h: number): void {
  const stripeH = Math.floor(h / 7);
  for (let i = 0; i < 7; i++) {
    fillRect(x, y + i * stripeH, w, stripeH, i % 2 === 0 ? ([178, 34, 52] as RGB) : WHITE);
  }
  fillRect(x, y, Math.floor(w * 0.4), stripeH * 4, [60, 59, 110] as RGB);
  for (let r = 0; r < 4; r++)
    for (let cI = 0; cI < 5; cI++)
      setPixel(x + 3 + cI * 6, y + 3 + r * 7, WHITE);
}

function flagChina(x: number, y: number, w: number, h: number): void {
  fillRect(x, y, w, h, [222, 41, 16] as RGB);
  drawStar(x + 14, y + 14, 11, [255, 222, 0] as RGB);
  for (const [sx, sy] of [[30, 8], [36, 14], [36, 22], [30, 26]]) {
    setPixel(x + sx, y + sy, [255, 222, 0] as RGB);
    setPixel(x + sx + 1, y + sy, [255, 222, 0] as RGB);
  }
}

function flagRussia(x: number, y: number, w: number, h: number): void {
  const band = Math.floor(h / 3);
  fillRect(x, y, w, band, WHITE);
  fillRect(x, y + band, w, band, [0, 57, 166] as RGB);
  fillRect(x, y + 2 * band, w, h - 2 * band, [213, 43, 30] as RGB);
}

function iconCyclone(x: number, y: number, s: number): void {
  // concentric arcs read as a storm swirl
  const cx = x + Math.floor(s / 2);
  const cy = y + Math.floor(s / 2);
  for (const r of [6, 12, 18]) drawCircle(cx, cy, r, INK);
  fillRect(cx - 3, cy - 3, 7, 7, RED);
}

function iconBars(x: number, y: number): void {
  const heights = [10, 18, 14, 26, 32];
  for (let i = 0; i < heights.length; i++) {
    fillRect(x + i * 11, y + 34 - heights[i], 7, heights[i], i === 4 ? RED : INK);
  }
  drawLine(x, y + 2, x + 52, y + 34 - 32, RED);
  drawLine(x + 52, y + 2, x + 44, y + 4, RED);
  drawLine(x + 52, y + 2, x + 50, y + 10, RED);
}

function iconDome(x: number, y: number): void {
  // capitol dome: half circle on a base
  const cx = x + 26;
  const cy = y + 20;
  for (let a = 0; a <= 18; a++) {
    const t = (Math.PI * a) / 18;
    const px2 = Math.round(cx + Math.cos(Math.PI + t) * 18);
    const py2 = Math.round(cy - Math.sin(t) * 16);
    setPixel(px2, py2, INK);
    setPixel(px2, py2 + 1, INK);
  }
  fillRect(x + 4, y + 20, 44, 4, INK);
  fillRect(x + 8, y + 24, 36, 10, INK);
  fillRect(cx - 1, y + 2, 3, 6, INK);
  fillRect(cx - 5, y, 11, 3, RED);
}

function iconChart(x: number, y: number): void {
  drawLine(x + 2, y + 30, x + 14, y + 22, INK);
  drawLine(x + 14, y + 22, x + 24, y + 26, INK);
  drawLine(x + 24, y + 26, x + 36, y + 12, INK);
  drawLine(x + 36, y + 12, x + 50, y + 4, RED);
  drawLine(x + 50, y + 4, x + 42, y + 6, RED);
  drawLine(x + 50, y + 4, x + 48, y + 12, RED);
  fillRect(x + 2, y + 32, 50, 2, GREY);
}

// ---------- Stories (verified 20 Nov 2026 via web search, as of build time) ----------
const LEAD_HEADLINE = "TRUMP, XI & PUTIN SIGN PEACE DECLARATION";
const LEAD_BODY =
  "After their first-ever trilateral in Shenzhen, the three leaders declare that 'a nuclear war cannot be won and must never be fought'. The text says nothing about Ukraine or Iran and sets no arms-control talks. Trump briefs the press in Washington at noon.";
const LEAD_POINTS = "THE DECLARATION: UN REFORM - MORE ENERGY SUPPLY - NUCLEAR-RISK TALKS - SHIELD LEADERS FROM THE ICC";

type Cell = { kicker: string; headline: string; body: string; icon: "cyclone" | "bars" | "dome" | "chart" };
const CELLS: Cell[] = [
  {
    kicker: "WEATHER",
    headline: "CYCLONE AKVAN HITS ODISHA",
    body: "Severe Cyclone Akvan crosses the Odisha coast near Gopalpur at noon, winds to 110 km/h. Over 300,000 evacuated and 69 trains cancelled.",
    icon: "cyclone",
  },
  {
    kicker: "MARKETS",
    headline: "ANT +17% ON DEBUT AS DOW PLUNGES",
    body: "Anthropic closes at $97.17, up 17% after topping $2 trillion on its Nasdaq debut. The Dow plunges 1,101 points, 2.2%, below 50,000.",
    icon: "bars",
  },
  {
    kicker: "THE GULF",
    headline: "SENATE REJECTS IRAN WAR VOTE 51-48",
    body: "The Senate rejects a war-powers curb 51-48 as the risk of US strikes on Iran builds. Brent crude nears $92.60; talks stall.",
    icon: "dome",
  },
  {
    kicker: "ECONOMY",
    headline: "TAIWAN MOVES TO STEADY STOCKS",
    body: "Taiwan's watchdog unveils five measures to steady stocks after a three-day slide. Short-selling limits take effect today.",
    icon: "chart",
  },
];
const BOTTOM =
  "ALSO: TRUMP PARDONS PETE ROSE - POSTHUMOUS PARDON FOR THE LATE BASEBALL STAR, SEPARATE FROM THE HALL OF FAME.";

// ---------- Page ----------
function drawPage(): void {
  fill(PAPER[0], PAPER[1], PAPER[2]);

  // Masthead
  drawTextCentred(512, 26, "THE WORLD IN ONE DAY", 5, INK);
  drawTextCentred(512, 76, "FRIDAY 20 NOVEMBER 2026", 2, INK);
  fillRect(40, 110, 944, 3, INK);
  fillRect(40, 116, 944, 2, RED);

  // Lead story
  drawText(40, 136, "DIPLOMACY", 1, RED);
  drawText(40, 150, LEAD_HEADLINE, 3, INK);
  drawWrapped(40, 186, LEAD_BODY, 2, 640, INK, 4);
  // flag trio, right of the lead body
  const flagY = 186;
  const flagW = 84;
  const flagH = 56;
  flagUSA(700, flagY, flagW, flagH);
  flagChina(796, flagY, flagW, flagH);
  flagRussia(892, flagY, flagW, flagH);
  drawRect(700, flagY, flagW, flagH, INK, 1);
  drawRect(796, flagY, flagW, flagH, INK, 1);
  drawRect(892, flagY, flagW, flagH, INK, 1);
  drawTextCentred(742, flagY + 62, "USA", 1, GREY);
  drawTextCentred(838, flagY + 62, "CHINA", 1, GREY);
  drawTextCentred(934, flagY + 62, "RUSSIA", 1, GREY);
  drawTextCentred(838, flagY + 78, "SHENZHEN", 1, GREY);
  // declaration points strip
  drawRect(40, 300, 944, 44, INK, 1);
  fillRect(40, 300, 944, 44, WHITE);
  drawRect(40, 300, 944, 44, INK, 1);
  const pts = wrapText(LEAD_POINTS, 1, 920);
  let py = 309;
  for (const line of pts) {
    drawTextCentred(512, py, line, 1, INK);
    py += 11;
  }
  fillRect(40, 360, 944, 2, INK);

  // 2x2 grid
  const cellW = 466;
  const cellH = 232;
  const xs = [40, 518];
  const ys = [376, 624];
  for (let i = 0; i < 4; i++) {
    const cell = CELLS[i];
    const x = xs[i % 2];
    const y = ys[Math.floor(i / 2)];
    fillRect(x, y, cellW, cellH, WHITE);
    drawRect(x, y, cellW, cellH, INK, 2);
    drawText(x + 14, y + 12, cell.kicker, 1, RED);
    // icon bottom-right (clear of headline and body text)
    if (cell.icon === "cyclone") iconCyclone(x + cellW - 62, y + cellH - 54, 44);
    if (cell.icon === "bars") iconBars(x + cellW - 68, y + cellH - 48);
    if (cell.icon === "dome") iconDome(x + cellW - 66, y + cellH - 44);
    if (cell.icon === "chart") iconChart(x + cellW - 68, y + cellH - 48);
    // headline (scale 3, up to 3 lines) and body (scale 2, up to 4 lines)
    const headLines = wrapText(cell.headline, 3, cellW - 28);
    let hy = y + 34;
    for (const line of headLines.slice(0, 3)) {
      drawText(x + 14, hy, line, 3, INK);
      hy += 24;
    }
    const bodyY = y + 34 + Math.min(headLines.length, 3) * 24 + 8;
    drawWrapped(x + 14, bodyY, cell.body, 2, cellW - 28, INK, 4);
  }

  // Bottom band
  fillRect(40, 872, 944, 76, WHITE);
  drawRect(40, 872, 944, 76, INK, 2);
  drawText(54, 886, "ALSO", 1, RED);
  drawWrapped(54, 902, BOTTOM, 2, 916, INK, 4);

  // Footer
  drawTextCentred(512, 966, "SIX STORIES FROM 20 NOVEMBER 2026 - DRAWN FROM WIRE REPORTS", 1, GREY);
  fillRect(40, 992, 944, 2, INK);
}

// ---------- Main ----------
function main(): void {
  drawPage();
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "entry.png"), encodePNG(W, H, px));
}

main();
