// A short history of directed strokes. Each stroke drags material along the
// tangent, then rolls to the side and relaxes as the wake travels downstream.
export class PointerWake {
  private strokes: {x:number; y:number; ux:number; uy:number; force:number; time:number}[] = [];
  private previous: {x:number; y:number; time:number} | null = null;
  private nextSample = 0;

  move(x:number, y:number, time:number) {
    const prev = this.previous;
    if (!prev || time - prev.time > 240) {
      this.previous = {x,y,time};
      return;
    }
    if (time < this.nextSample) return;
    const dx = x - prev.x, dy = y - prev.y;
    const distance = Math.hypot(dx,dy);
    if (distance < 1) return;
    this.previous = {x,y,time};
    this.nextSample = time + 14;
    const force = Math.min(1, distance / Math.max(12, time - prev.time));
    const count = Math.min(5, Math.ceil(distance / 18));
    for (let i = 1; i <= count; i++) this.strokes.push({
      x: prev.x + dx * i / count, y: prev.y + dy * i / count,
      ux: dx / distance, uy: dy / distance, force, time,
    });
    if (this.strokes.length > 16) this.strokes.splice(0, this.strokes.length - 16);
  }

  update(now:number) {
    while (this.strokes.length && now - this.strokes[0].time > 920) this.strokes.shift();
    return this.strokes.length > 0;
  }

  nearColumn(x:number) { return this.strokes.some(s => Math.abs(s.x - x) < 145); }

  offset(x:number, y:number, now:number, grain = .5) {
    let dx = 0, dy = 0, weight = 0;
    for (const s of this.strokes) {
      const rx = x - s.x, ry = y - s.y;
      if (Math.abs(rx) > 145 || Math.abs(ry) > 145) continue;
      const age = Math.min(1, Math.max(0, (now - s.time) / 920));
      const along = (rx * s.ux + ry * s.uy - age * 30) / 65;
      const side = (-rx * s.uy + ry * s.ux) / 29;
      const envelope = Math.max(0, 1 - along * along - side * side);
      const w = envelope * envelope * (1-age) ** 2 * s.force;
      if (w < .001) continue;
      const roll = Math.sin(age * 8 - along * 2 + grain * 2) * (7 + age * 12);
      dx += w * (s.ux * 38 - s.uy * roll);
      dy += w * (s.uy * 38 + s.ux * roll);
      weight += w;
    }
    const divisor = 1 + weight * .72;
    return {x:dx / divisor, y:dy / divisor};
  }
}
