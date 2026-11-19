import {portraitFilmQuery} from '@/data/portfolio';
import {chapterFrames, chapterFrameURL} from '@/lib/chapter-frames';

const opener = chapterFrames[0];
const start = `(() => {
  history.scrollRestoration = 'manual';
  if (location.hash) history.replaceState(history.state, '', location.pathname + location.search);
  window.scrollTo({top:0,behavior:'instant'});
  const html = document.documentElement;
  if (!document.hidden && !navigator.connection?.saveData && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    html.dataset.openingRain = 'pending';
    const boost = () => { if (html.dataset.openingRain === 'pending') html.dataset.rainBoost = '1'; };
    addEventListener('pointerdown', boost, {once:true,passive:true});
    addEventListener('wheel', boost, {once:true,passive:true});
    setTimeout(() => {
      if (html.dataset.openingRain === 'pending') delete html.dataset.openingRain;
      delete html.dataset.rainBoost;
      removeEventListener('pointerdown', boost);
      removeEventListener('wheel', boost);
    }, 1200);
  }
  const preload = document.createElement('link');
  preload.rel = 'preload';
  preload.as = 'image';
  preload.href = matchMedia(${JSON.stringify(portraitFilmQuery)}).matches
    ? ${JSON.stringify(chapterFrameURL(opener.portrait))} : ${JSON.stringify(chapterFrameURL(opener.desktop))};
  preload.fetchPriority = 'high';
  document.head.appendChild(preload);
})();`;

export function JourneyStartup() {
  return <script dangerouslySetInnerHTML={{__html:start}}/>;
}
