import sharp from "sharp";

/**
 * Remove white/near-white background from a logo image.
 * Returns a PNG buffer with transparent background.
 */
export async function removeWhiteBackground(
  inputBuffer: Buffer,
  tolerance = 40
): Promise<Buffer> {
  const { data, info } = await sharp(inputBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = new Uint8Array(data);
  const { width, height, channels } = info;

  for (let i = 0; i < pixels.length; i += channels) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];

    // Euclidean distance from pure white
    const dist = Math.sqrt((255 - r) ** 2 + (255 - g) ** 2 + (255 - b) ** 2);

    if (dist <= tolerance) {
      // Soft edge: scale alpha proportionally for anti-aliased edges
      pixels[i + 3] = Math.round((dist / tolerance) * 255);
    }
  }

  return sharp(Buffer.from(pixels), {
    raw: { width, height, channels },
  })
    .png()
    .toBuffer();
}

/**
 * Extract dominant colors from a logo image.
 * Returns an array of hex color strings, sorted by frequency (most common first).
 * Filters out white, near-white, black, and near-black colors.
 */
export async function extractDominantColors(
  inputBuffer: Buffer,
  maxColors = 5
): Promise<string[]> {
  // Resize to small for fast sampling
  const { data, info } = await sharp(inputBuffer)
    .resize(150, 150, { fit: "inside" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = new Uint8Array(data);
  const { channels } = info;

  function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    const rn = r / 255, gn = g / 255, bn = b / 255;
    const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
    const l = (max + min) / 2;
    if (max === min) return { h: 0, s: 0, l };
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h = 0;
    if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
    else if (max === gn) h = ((bn - rn) / d + 2) * 60;
    else h = ((rn - gn) / d + 4) * 60;
    return { h, s, l };
  }

  // Group by hue range: Red, Orange, Yellow, Green, Teal, Blue, Purple
  const hueGroups: { [key: string]: { totalR: number; totalG: number; totalB: number; count: number; maxSat: number } } = {};
  const hueRanges: [string, number, number][] = [
    ["red", 345, 15],       // wraps around
    ["orange", 15, 45],
    ["yellow", 45, 75],
    ["lime", 75, 105],
    ["green", 105, 150],
    ["teal", 150, 195],
    ["blue", 195, 260],
    ["purple", 260, 300],
    ["pink", 300, 345],
  ];

  let darkPixels = 0;

  for (let i = 0; i < pixels.length; i += channels) {
    const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2], a = pixels[i + 3];

    if (a < 128) continue;
    if (r > 220 && g > 220 && b > 220) continue;

    const { h, s, l } = rgbToHsl(r, g, b);

    // Dark/black pixels
    if (l < 0.2) { darkPixels++; continue; }

    // Skip grays
    if (s < 0.2) continue;

    // Find hue group
    let group = "other";
    for (const [name, start, end] of hueRanges) {
      if (name === "red") {
        if (h >= 345 || h < 15) { group = name; break; }
      } else if (h >= start && h < end) {
        group = name; break;
      }
    }

    if (!hueGroups[group]) {
      hueGroups[group] = { totalR: 0, totalG: 0, totalB: 0, count: 0, maxSat: 0 };
    }
    hueGroups[group].totalR += r;
    hueGroups[group].totalG += g;
    hueGroups[group].totalB += b;
    hueGroups[group].count++;
    hueGroups[group].maxSat = Math.max(hueGroups[group].maxSat, s);
  }

  // Sort groups by (count * saturation), take top colors
  const limit = maxColors - (darkPixels > 10 ? 1 : 0);
  const sorted = Object.entries(hueGroups)
    .filter(([, g]) => g.count >= 10) // need a meaningful number of pixels
    .sort(([, a], [, b]) => (b.count * b.maxSat) - (a.count * a.maxSat))
    .slice(0, limit);

  // Average color per group
  const result = sorted.map(([, g]) => {
    const r = Math.round(g.totalR / g.count);
    const gv = Math.round(g.totalG / g.count);
    const b = Math.round(g.totalB / g.count);
    return `#${r.toString(16).padStart(2, "0")}${gv.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  });

  if (darkPixels > 10) {
    result.push("#000000");
  }

  return result;
}
