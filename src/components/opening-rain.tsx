'use client';

import {useEffect, useRef} from 'react';
import {portraitFilmQuery} from '@/data/portfolio';
import {chapterFrameURL, chapterFrames} from '@/lib/chapter-frames';
import {digitStreams, rainPitch} from '@/lib/digit-streams';
import {PointerWake} from '@/lib/pointer-wake';
import {smoothstep} from '@/lib/timeline';

const revealStart = 2850;
const duration = 4350;

export function OpeningRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    if (html.dataset.openingRain !== 'pending') return;

    const canvas = canvasRef.current;
    const view = canvas?.parentElement;
    const portfolio = view?.closest('.portfolio');
    const poster = portfolio?.querySelector<HTMLElement>('.fallback-frame');
    const ctx = canvas?.getContext('2d');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    if (!canvas || !view || !poster || !ctx || reduced.matches) {
      delete html.dataset.openingRain;
      return;
    }

    const chapter = chapterFrames[0];
    const area = poster.getBoundingClientRect();
    const origin = view.getBoundingClientRect();
    const width = view.clientWidth;
    const height = view.clientHeight;
    if (!width || !height) {
      delete html.dataset.openingRain;
      return;
    }

    const ratio = Math.min(devicePixelRatio || 1, 2.5, Math.sqrt(4400000 / (width * height)));
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.scale(canvas.width / width, canvas.height / height);
    const field = document.createElement('canvas');
    field.width = canvas.width;
    field.height = canvas.height;
    const layer = field.getContext('2d');
    if (!layer) {
      delete html.dataset.openingRain;
      return;
    }
    layer.scale(field.width / width, field.height / height);

    // Two depths overlap. The fine layer resolves hull detail and the larger
    // streams remain legible as individual numbers on a phone.
    const pitch = rainPitch(width);
    const layers = [pitch, pitch * 1.64].map((spacing, depth) => {
      const step = Math.round(spacing * ratio) / ratio;
      const row = Math.round(step * 1.48 * ratio) / ratio;
      const rows = 96;
      const strips = digitStreams(24, rows, step, row, ratio, 4236 + depth, depth === 1);
      const lanes = Array.from({length: Math.ceil(width / step)}, (_, index) => ({
        x: index * step,
        strip: index % 24,
        tip: depth === 1 && Math.random() < .38 ? index % 2 : -1,
        birth: 100 + 1550 * Math.random() ** .75,
        offset: Math.random() * row * rows,
        speed: (depth ? .14 : .065) + Math.random() * (depth ? .18 : .095),
      }));
      return {step, period: rows * row, strips, lanes};
    });

    // Render the two lit leading glyphs once, with enough margin for their halos.
    const headSize = Math.ceil(layers[1].step * 3.8 * ratio);
    const tips = document.createElement('canvas');
    tips.width = headSize * 2;
    tips.height = headSize;
    const light = tips.getContext('2d');
    if (light) {
      light.font = `600 ${Math.round(headSize * .38)}px monospace`;
      light.textAlign = 'center';
      light.textBaseline = 'middle';
      light.fillStyle = '#fff';
      light.shadowColor = '#e7edff';
      light.shadowBlur = headSize * .16;
      for (let bit = 0; bit < 2; bit++) light.fillText(String(bit), (bit+.5)*headSize, headSize/2);
    }

    const sample = document.createElement('canvas');
    const cols = sample.width = Math.ceil(width / (pitch * .65));
    const rows = sample.height = Math.ceil(height / (pitch * .65));
    const sampler = sample.getContext('2d', {willReadFrequently: true});
    const masks = layers.map(() => {
      const mask = document.createElement('canvas');
      mask.width = cols;
      mask.height = rows;
      return mask;
    });
    const reveal = document.createElement('canvas');
    reveal.width = cols;
    reveal.height = rows;
    const revealInk = reveal.getContext('2d')!;
    const aperture = revealInk.createImageData(cols, rows);
    const arrival = new Float32Array(cols * rows);
    const laneDelay = Array.from({length: cols}, () => Math.random() * .11);
    let hasMask = false;
    let active = true;
    let fullFrameLoaded = false;
    function capture(image: HTMLImageElement, fullFrame = false) {
      if (!active || !sampler || (fullFrameLoaded && !fullFrame)) return;
      const scale = Math.max(area.width / image.width, area.height / image.height);
      const imageWidth = image.width * scale;
      const imageHeight = image.height * scale;
      const position = parseFloat(getComputedStyle(poster!).backgroundPositionX) / 100;
      sampler.save();
      sampler.scale(cols / width, rows / height);
      sampler.fillStyle = '#060606';
      sampler.fillRect(0,0,width,height);
      sampler.save();
      sampler.beginPath();
      sampler.rect(area.left-origin.left,area.top-origin.top,area.width,area.height);
      sampler.clip();
      sampler.drawImage(image, area.left-origin.left+(area.width-imageWidth)*position,
        area.top-origin.top+(area.height-imageHeight)/2,imageWidth,imageHeight);
      sampler.restore();
      sampler.restore();
      const pixels = sampler.getImageData(0, 0, cols, rows);
      const light = Float32Array.from({length: cols * rows}, (_, i) => {
        const base = i * 4;
        return (pixels.data[base] * .21 + pixels.data[base + 1] * .72 + pixels.data[base + 2] * .07) / 255;
      });
      masks.forEach((mask, depth) => {
        const ink = mask.getContext('2d');
        if (!ink) return;
        for (let i = 0; i < light.length; i++) {
          const luma = light[i];
          const right = (i + 1) % cols ? light[i + 1] : luma;
          const edge = Math.abs(right - luma) + Math.abs((light[i + cols] ?? luma) - luma);
          // Fine streams fill midtones. Only bright surfaces and lit edges
          // bring the second layer through, increasing actual glyph density.
          const signal = Math.min(1, luma + edge * .55);
          const coverage = depth ? smoothstep(.17, .69, signal) : smoothstep(.008, .6, signal ** .72);
          if (!depth) {
            const x = i % cols, y = Math.floor(i / cols);
            arrival[i] = .44 * (1 - smoothstep(.02,.82,signal)) + .23 * y / rows
              + laneDelay[x] + .07 * (1 + Math.sin(x * .09 + y * .045));
          }
          pixels.data[i * 4 + 3] = Math.round((1 - coverage) * 255);
        }
        ink.putImageData(pixels, 0, 0);
      });
      hasMask = true;
      fullFrameLoaded ||= fullFrame;
    }

    const preview = new Image();
    const finalFrame = new Image();
    const portrait = matchMedia(portraitFilmQuery).matches;
    const previewURL = getComputedStyle(poster).getPropertyValue('--first-frame').match(/data:image\/[^)'"]+/)?.[0];
    if (previewURL) {
      preview.onload = () => capture(preview);
      preview.src = previewURL;
    }
    const source = chapterFrameURL(portrait ? chapter.portrait : chapter.desktop);
    finalFrame.onload = () => capture(finalFrame, true);
    if (source) finalFrame.src = source;

    let elapsed = 0;
    let targetRate = html.dataset.rainBoost ? 6 : 1;
    let playbackRate = 1;
    let last: number | undefined;
    const wake = new PointerWake();
    function stir(event: PointerEvent) {
      if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
        wake.move(event.clientX - origin.left, event.clientY - origin.top, performance.now());
      }
    }
    // The integral of a rising velocity keeps the stream heads accelerating
    // continuously until they reach their cruising speed.
    function fall(age:number, speed:number) {
      const ramp = 1650;
      const accelerated = age + ramp * Math.expm1(-age / ramp);
      return height * (0.00016 * age + 0.00062 * accelerated) * (.68 + speed * 1.8);
    }
    function boost() { targetRate = 6; }
    function onKey(event: KeyboardEvent) {
      if (['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' ','Enter'].includes(event.key)) boost();
    }
    let frame = 0;

    const draw = (now: number) => {
      if (!active) return;

      if (elapsed >= duration) {
        finish();
        return;
      }
      frame = requestAnimationFrame(draw);
      const dt = last === undefined ? 0 : now - last;
      if (last !== undefined && dt < 32) return;
      last = now;
      playbackRate += (targetRate - playbackRate) * (1 - Math.exp(-dt / 110));
      elapsed += dt * playbackRate;
      const stirred = wake.update(now);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, width, height);
      const imprint = hasMask ? smoothstep(1500, 2950, elapsed) : 0;
      layers.forEach(({step, period, strips, lanes}, depth) => {
        if (!strips) return;
        layer.clearRect(0, 0, width, height);
        layer.imageSmoothingEnabled = false;
        for (const lane of lanes) {
          const age = elapsed - lane.birth;
          if (age <= 0) continue;
          const travel = fall(age, lane.speed);
          const bottom = Math.min(height, travel);
          const head = (lane.offset + travel) % period;
          const sourceX = lane.strip * strips.laneWidth;
          const disturbed = stirred && wake.nearColumn(lane.x);
          const row = strips.rowHeight / ratio;
          // Only subdivide the short portion of a strip under the pointer.
          // All other visible runs are single batched atlas draws.
          for (let y = head - period; y < bottom; y += period) {
            const end = Math.min(y + period, bottom);
            let top = Math.max(0, y);
            while (top < end) {
              const next = disturbed ? Math.min(end, y + (Math.floor((top-y)/row + .00001)+1)*row) : end;
              const d = disturbed ? wake.offset(lane.x,(top+next)/2,now) : {x:0,y:0};
              const sourceScale = strips.sheet.height / period;
              const x = Math.round((lane.x + d.x) * ratio) / ratio;
              const destY = Math.round((top + d.y) * ratio) / ratio;
              layer.drawImage(strips.sheet, sourceX, (top - y) * sourceScale, strips.laneWidth, (next - top) * sourceScale,
                x, destY, step, next - top);
              top = next;
            }
          }
          if (lane.tip >= 0 && travel < height + step) {
            const size = headSize / ratio;
            const d = disturbed ? wake.offset(lane.x,travel,now) : {x:0,y:0};
            layer.globalAlpha = smoothstep(0, 140, age);
            layer.drawImage(tips, lane.tip * headSize, 0, headSize, headSize,
              lane.x + step/2 + d.x - size/2, travel + d.y - size/2, size, size);
            layer.globalAlpha = 1;
          }
        }
        if (imprint > 0) {
          layer.globalCompositeOperation = 'destination-out';
          layer.imageSmoothingEnabled = true;
          layer.globalAlpha = imprint;
          layer.drawImage(masks[depth], 0, 0, width, height);
          layer.globalCompositeOperation = 'source-atop';
          layer.globalAlpha = imprint * .30;
          layer.drawImage(sample, 0, 0, width, height);
          layer.globalAlpha = 1;
          layer.globalCompositeOperation = 'source-over';
        }
        ctx.globalAlpha = depth ? .88 : .46 + imprint * .54;
        ctx.drawImage(field, 0, 0, width, height);
      });
      // The first bright surfaces resolve as the binary silhouette finishes forming.
      if (elapsed > revealStart) {
        const sweep = (elapsed - revealStart) / (duration - revealStart) * 1.17;
        for (let i = 0; i < arrival.length; i++) {
          aperture.data[i*4+3] = Math.round(255 * smoothstep(arrival[i], arrival[i]+.22, sweep));
        }
        revealInk.putImageData(aperture,0,0);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'destination-out';
        ctx.drawImage(reveal,0,0,width,height);
        ctx.globalCompositeOperation = 'source-over';
      }
    };

    function finish() {
      if (!active) return;
      active = false;
      cancelAnimationFrame(frame);
      delete html.dataset.openingRain;
      document.dispatchEvent(new Event('journey:ready'));
      preview.onload = null;
      finalFrame.onload = null;
      window.removeEventListener('pointerdown', boost);
      window.removeEventListener('wheel', boost);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('touchmove', boost);
      window.removeEventListener('pointermove', stir);
      window.removeEventListener('resize', finish);
      document.removeEventListener('visibilitychange', finish);
      reduced.removeEventListener('change', finish);
      for (const surface of [canvas!, field, sample, tips, ...masks, reveal]) surface.width = surface.height = 1;
      for (const {strips} of layers) if (strips) strips.sheet.width = strips.sheet.height = 1;
    }

    ctx.fillStyle = '#000';
    ctx.fillRect(0,0,width,height);
    frame = requestAnimationFrame(draw);
    html.dataset.openingRain = 'running';
    window.addEventListener('pointerdown', boost, {passive: true});
    window.addEventListener('wheel', boost, {passive: true});
    window.addEventListener('keydown', onKey);
    window.addEventListener('touchmove', boost, {passive: true});
    window.addEventListener('pointermove', stir, {passive:true});
    window.addEventListener('resize', finish);
    document.addEventListener('visibilitychange', finish);
    reduced.addEventListener('change', finish);
    return finish;
  }, []);

  return <div className="opening-rain" aria-hidden="true">
    <canvas ref={canvasRef}/>
  </div>;
}
