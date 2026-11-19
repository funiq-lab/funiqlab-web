import {rainNoise, rainPitch} from './digit-streams';
import {paintRainType} from './rain-type';
import {smoothstep} from './timeline';

function captionShower(node: HTMLElement) {
  const area = node.getBoundingClientRect();
  const width = Math.ceil(area.width), height = Math.ceil(area.height);
  if (!width || !height) return;
  const pitch = rainPitch(innerWidth);
  const step = Math.max(3, Math.round(pitch * .72));
  const stencil = document.createElement('canvas');
  stencil.width = Math.ceil(width / step);
  stencil.height = Math.ceil(height / step);
  const ink = stencil.getContext('2d', {willReadFrequently: true});
  if (!ink) return;
  ink.scale(1/step,1/step);
  paintRainType(ink,node,area);
  const pixels = ink.getImageData(0,0,stencil.width,stencil.height).data;

  const margin = Math.ceil(pitch * 13);
  const canvas = document.createElement('canvas');
  canvas.className = 'chapter-rain';
  canvas.setAttribute('aria-hidden','true');
  const ratio = Math.min(devicePixelRatio, 2);
  const extent = height + margin * 2;
  canvas.width = Math.ceil((width + pitch * 4) * ratio);
  canvas.height = Math.ceil(extent * ratio);
  canvas.style.cssText = `left:${-2*pitch}px;top:${-margin}px;width:${width+4*pitch}px;height:${extent}px`;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.scale(ratio,ratio);
  ctx.translate(2*pitch,margin);
  // Cache both sizes of 0 and 1 at display resolution. Frames only position
  // the sprites, including when scroll direction changes halfway through.
  const cell = Math.ceil(pitch * 2.8 * ratio);
  const glyphs = document.createElement('canvas');
  glyphs.width = cell * 4;
  glyphs.height = cell;
  const glyphInk = glyphs.getContext('2d')!;
  glyphInk.fillStyle = '#efefef';
  glyphInk.textAlign = 'center';
  glyphInk.textBaseline = 'middle';
  for (let i = 0; i < 4; i++) {
    glyphInk.font = `600 ${pitch * (i < 2 ? 1.32 : 2.1) * ratio}px ui-monospace, monospace`;
    glyphInk.fillText(String(i % 2), (i+.5)*cell,cell/2);
  }

  // A column's arrival controls both its last falling bits and the native ink
  // it leaves behind. Draw whole digits, including the parts outside a stroke.
  const random = rainNoise(4236 + width);
  const delay = Array.from({length:stencil.width+2}, (_,i) =>
    .10 + .075*Math.sin(i*.28) + random()*.13);
  const drops: {x:number; y:number; distance:number; delay:number; sprite:number; alpha:number}[] = [];
  for (let col = 0; col < stencil.width; col++) {
    for (let row = 0; row < stencil.height; row++) {
      const coverage = pixels[(row*stencil.width+col)*4+3]/255;
      if (coverage < .045 || random() > Math.min(.88, coverage*1.4)) continue;
      const y = (row+.5)*step;
      drops.push({x:(col+.5)*step, y, distance:pitch*(2+random()*10),
        delay:delay[col], sprite:(random()<.24 ? 2 : 0) + Math.floor(random()*2),
        alpha:.48+random()*.5});
    }
  }
  const parts = Array.from(node.querySelectorAll<HTMLElement>('.opening-wordmark,.first-credit p,.rain-label,.film-clock span,.type-ink,h2 svg,.transmission,.role,.flight-position,.blackout-line p,.invitation-label,.invitation-rule'))
    .map(el => ({el, box:el.getBoundingClientRect(),
      pairedLabel:el.matches('.invitation-rule') ? el.previousElementSibling?.getBoundingClientRect() : undefined}));
  const rule = parts.find(part => part.pairedLabel);
  if (rule?.pairedLabel) {
    // Sample a one-pixel rule explicitly. It falls between cells in the coarse
    // type stencil. Each short run resolves with the word immediately above it.
    const left = rule.box.left-area.left;
    for (let x=left+step/2; x<left+rule.box.width; x+=step) {
      const col = Math.min(delay.length-1,Math.floor(x/step));
      drops.push({x, y:rule.box.top-area.top, distance:pitch*(2+random()*4),
        delay:delay[col], sprite:Math.floor(random()*2), alpha:.55});
    }
  }
  node.append(canvas);
  node.classList.add('forming-caption');

  function draw(t:number, fromBelow:boolean) {
    ctx!.clearRect(-2*pitch,-margin,width+pitch*4,extent);
    for (const drop of drops) {
      const land = drop.delay + .46 * (fromBelow ? height-drop.y : drop.y) / height;
      const approach = smoothstep(land-.24,land+.055,t);
      const fade = 1-smoothstep(land+.08,land+.23,t);
      if (!approach || !fade) continue;
      ctx!.globalAlpha = approach * fade * drop.alpha;
      const y = drop.y + (fromBelow ? 1 : -1)*drop.distance*(1-approach);
      const size = cell / ratio;
      ctx!.drawImage(glyphs,drop.sprite*cell,0,cell,cell,drop.x-size/2,y-size/2,size,size);
    }
    // Clip only the painted contents of a link or button. Their native hit
    // targets, tab order and accessible names remain available during assembly.
    for (const {el,box,pairedLabel} of parts) {
      const left = box.left-area.left, top = box.top-area.top;
      const base = fromBelow ? 'calc(100% + 4px)' : '-4px';
      const points = [`-4px ${base}`,`calc(100% + 4px) ${base}`];
      for (let x = box.width+4; ; x=Math.max(-4,x-step)) {
        const col = Math.max(0,Math.min(delay.length-1,Math.floor((left+x)/step)));
        const filled = (t-delay[col]-.12)*height/.46;
        let edge = (fromBelow ? height-filled : filled) - top;
        if (pairedLabel) {
          const local = (edge + box.top - pairedLabel.top) / Math.max(1,pairedLabel.height);
          edge = local * box.height;
        }
        points.push(`${x.toFixed(1)}px ${Math.max(-4,Math.min(box.height+4,edge)).toFixed(1)}px`);
        if (x===-4) break;
      }
      el.style.clipPath = `polygon(${points.join(',')})`;
    }
  }
  return {draw, dispose() {
    canvas.remove();
    canvas.width = canvas.height = glyphs.width = glyphs.height = 1;
    for (const {el} of parts) el.style.removeProperty('clip-path');
    node.classList.remove('forming-caption');
  }};
}

type Shower = NonNullable<ReturnType<typeof captionShower>>;
type Playback = {
  shower: Shower;
  frame: number;
  level: number;
  exitScale: number;
};

export function chapterAssembly() {
  const visible = new Set<HTMLElement>();
  const active = new Map<HTMLElement, Playback>();
  function stop(node: HTMLElement) {
    const state = active.get(node);
    if (!state) return;
    cancelAnimationFrame(state.frame);
    state.shower.dispose();
    active.delete(node);
  }

  function update(node: HTMLElement, shown: boolean, enabled: boolean, solid: number, exiting: boolean, forward: boolean) {
    if (!shown || !enabled) {
      stop(node);
      if (shown) visible.add(node); else visible.delete(node);
      return;
    }
    const entering = !visible.has(node);
    visible.add(node);
    let state = active.get(node);
    if (!entering && !exiting && (!state || state.frame)) return;
    if (!state) {
      const shower = captionShower(node);
      if (!shower) return;
      state = {shower, frame:0, level:exiting ? solid : 0, exitScale:1};
      active.set(node,state);
    }

    // At the later boundary the bits travel below the letters. Playing that
    // same field backwards brings them back up into the strokes.
    if (exiting) {
      if (state.frame) {
        cancelAnimationFrame(state.frame);
        state.frame = 0;
        state.exitScale = state.level / Math.max(.001,solid);
      }
      state.level = Math.min(1,solid * state.exitScale);
      state.shower.draw(state.level,forward);
      return;
    }
    const playback = state;
    const start = performance.now() - playback.level * 1650;
    let last = -Infinity;
    function render(now: number) {
      playback.level = (now-start)/1650;
      if (playback.level >= 1 || document.hidden) {stop(node);return;}
      if (now-last >= 30) {
        playback.shower.draw(playback.level,!forward);
        last = now;
      }
      playback.frame = requestAnimationFrame(render);
    }
    render(performance.now());
  }
  return {update, dispose() {
    for (const node of active.keys()) stop(node);
    visible.clear();
  }};
}
