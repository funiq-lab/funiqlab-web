import {chapterFrames, chapterFrameURL} from './chapter-frames';

type Chapter = (typeof chapterFrames)[number];

/** Keep the last decoded scene underneath the incoming one throughout the dissolve. */
export function sceneStills(container: HTMLElement) {
  let requested = '', generation = 0;
  const images = new Map<string, HTMLImageElement>();

  function image(url: string, priority: 'auto' | 'low') {
    const cached = images.get(url);
    if (cached) return cached;
    const img = new Image();
    img.alt = '';
    img.decoding = 'async';
    img.fetchPriority = priority;
    img.src = url;
    images.set(url, img);
    return img;
  }

  async function show(chapter: Chapter, portrait: boolean, reduced: boolean, forward: boolean) {
    const format = portrait ? 'portrait' : 'desktop';
    const url = chapterFrameURL(chapter[format]);
    const key = url ?? 'blackout';
    if (key === requested) return;
    requested = key;
    const id = ++generation;
    const layer = url ? image(url, 'auto') : document.createElement('div');
    if (layer instanceof HTMLImageElement) {
      try {
        await layer.decode();
      } catch {
        images.delete(key);
        return;
      }
    }
    if (id !== generation) return;
    if (container.lastElementChild !== layer) {
      container.append(layer);
      const finish = () => {
        if (layer.parentNode === container) {
          while (layer.previousElementSibling) layer.previousElementSibling.remove();
        }
      };
      for (const animation of layer.getAnimations()) animation.cancel();
      if (reduced) finish();
      else layer.animate([{opacity:0},{opacity:1}], {duration:320,easing:'ease-out'}).onfinish = finish;
    }
    const neighbor = chapterFrames[chapterFrames.indexOf(chapter) + (forward ? 1 : -1)];
    if (neighbor?.[format]) image(chapterFrameURL(neighbor[format])!, 'low');
  }
  return {show, retry() {requested = '';}, dispose() {generation++; images.clear(); container.replaceChildren();}};
}
