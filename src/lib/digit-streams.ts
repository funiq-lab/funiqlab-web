export function rainNoise(seed: number) {
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

// Each lane is a seamless loop. Moving the strip preserves the identity and
// spacing of its falling digits even while a scene mask changes their intensity.
export function digitStreams(columns: number, rows: number, pitch: number, step: number, dpr: number, seed: number, sparse = false) {
  const sheet = document.createElement('canvas');
  const laneWidth = Math.round(pitch * dpr);
  const rowHeight = Math.round(step * dpr);
  sheet.width = columns * laneWidth;
  sheet.height = rows * rowHeight;
  const ctx = sheet.getContext('2d');
  if (!ctx) return null;
  const random = rainNoise(seed);
  ctx.font = `600 ${rowHeight * .91}px ui-monospace, monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let col = 0; col < columns; col++) {
    // Short bright heads and long tails interleave at different depths.
    const period = rows / (2 + Math.floor(random() * 4));
    const phase = random() * period;
    for (let row = 0; row < rows; row++) {
      const tail = ((phase - row) % period + period) % period / period;
      const intensity = (1 - tail) ** (sparse ? 3.2 : 1.5);
      const noise = random();
      if (noise < (sparse ? .13 + tail * .26 : .06)) continue;
      const white = Math.round((sparse ? 32 : 99) + (sparse ? 222 : 155) * intensity);
      ctx.fillStyle = `rgb(${white} ${white} ${white})`;
      ctx.globalAlpha = .67 + .33 * noise;
      const bit = random() < .5 ? 0 : 1;

      // Bake the light on a few stream heads once. The main digit remains sharp.
      const head = sparse && tail < .065;
      ctx.shadowColor = head ? 'rgba(235,241,255,.85)' : 'transparent';
      ctx.shadowBlur = head ? rowHeight * .34 : 0;
      if (head) { ctx.fillStyle = '#fff'; ctx.globalAlpha = 1; }
      ctx.fillText(String(bit), (col + .5) * laneWidth, (row + .52) * rowHeight);
    }
  }
  return {sheet, laneWidth, rowHeight};
}

export function rainPitch(width: number) {
  return Math.max(5, Math.min(9, width / 180));
}
