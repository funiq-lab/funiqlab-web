/** Piecewise mapping keeps editorial video cues aligned with chapter anchors,
 * even when viewport size or translated paragraphs change the scroll lengths. */
export const smoothstep = (a: number, b: number, value: number) => {
  const t = Math.min(1, Math.max(0, (value - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function mapTimeline(position: number, anchors: readonly number[], cues: readonly number[]): number {
  if (anchors.length !== cues.length || anchors.length < 2) throw new Error('Timeline anchors and cues must have matching lengths.');
  if (position <= anchors[0]) return cues[0];
  const last = anchors.length - 1;
  if (position >= anchors[last]) return cues[last];
  for (let i = 0; i < last; i++) {
    if (position <= anchors[i + 1]) {
      const distance = anchors[i + 1] - anchors[i];
      const progress = distance > 0 ? (position - anchors[i]) / distance : 0;
      return cues[i] + progress * (cues[i + 1] - cues[i]);
    }
  }
  return cues[last];
}
