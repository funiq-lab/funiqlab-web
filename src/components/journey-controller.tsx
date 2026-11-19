'use client';
import {useEffect} from 'react';
import {sceneStills} from '@/lib/scene-stills';
import {type film, portraitFilmQuery} from '@/data/portfolio';
import {smoothstep} from '@/lib/timeline';
import {chapterFrameAt, chapterFrames} from '@/lib/chapter-frames';
import {choreography, filmPosition, journeyDestinations, sampleTrack} from '@/lib/choreography';
import {chapterAssembly} from '@/lib/chapter-assembly';
import {elapsedArc} from '@/lib/route-dial';
import {VideoScrubber} from '@/lib/video-scrubber';

type Props = {sources: typeof film};

const fullFlightDuration = 5000;
const minimumFlightDuration = 1200;
const scrollKeys = new Set(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' ']);

export function JourneyController({sources}: Props) {
  useEffect(() => {
    const root = document.getElementById('voyage');
    const distance = document.querySelector<HTMLElement>('.voyage-distance');
    if (!root || !distance) return;
    const portfolio = root.closest<HTMLElement>('.portfolio');
    const nodes = Array.from(root.querySelectorAll<HTMLElement>('[data-motion]'));
    const video = root.querySelector<HTMLVideoElement>('.journey-video')!;
    // Probe each track's actual Main 10 level before requesting its bytes.
    let desktopSource = video.canPlayType('video/mp4; codecs="hvc1.2.4.L120.90"') ? sources.desktopHevc : sources.desktop;
    let portraitSource = video.canPlayType('video/mp4; codecs="hvc1.2.4.L90.90"') ? sources.portraitHevc : sources.portrait;
    const scenes = sceneStills(root.querySelector<HTMLElement>('.fallback-frame')!);
    const still = root.querySelector<HTMLCanvasElement>('.paused-film-frame')!;
    let captureTimer = 0, capturedTime = -1;
    const waypointLinks = Array.from(document.querySelectorAll<HTMLButtonElement>('.waypoint'));
    const portraitFilm = matchMedia(portraitFilmQuery);
    const filmClock = portfolio?.querySelector<HTMLElement>('[data-film-clock]');
    const elapsedRoute = portfolio?.querySelector<SVGPathElement>('.route-elapsed');
    const projectOrbit = portfolio?.querySelector<HTMLElement>('#project-orbit');
    const cornerLabels = Array.from(portfolio?.querySelectorAll<HTMLElement>('.corner-link,.route-open,.journey-hint,.film-clock') ?? []);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = matchMedia('(max-width: 700px)');
    const connection = (navigator as Navigator & {connection?: EventTarget & {saveData?: boolean; effectiveType?: string}}).connection;
    let fits720p = false;
    let constrainedLandscape = false;
    let stallTimer = 0, retryTimer = 0, retried = false;
    const assembly = chapterAssembly();
    const scrubber = new VideoScrubber(video);
    let range = 1, frame = 0, disposed = false, source = '', progress = 0;
    let initialized = false, openProjects = false;
    let forward = true;
    let flight: {from: number; destination: number; started: number; duration: number} | null = null;

    document.documentElement.classList.add('experience-page');

    // Capture once after a seek settles. Keep the native video on screen during
    // both scrolling and idle time: canvas and video can be colour-managed differently.
    function captureFrame() {
      captureTimer = 0;
      if (!source || !scrubber.hasCurrentFrame || !video.videoWidth || capturedTime === video.currentTime) return;
      const ctx = still.getContext('2d', {alpha:false, willReadFrequently:true});
      if (!ctx) return;
      if (still.width !== video.videoWidth || still.height !== video.videoHeight) {
        still.width = video.videoWidth;
        still.height = video.videoHeight;
      }
      try {
        ctx.drawImage(video, 0, 0);
        capturedTime = video.currentTime;
      } catch {
        capturedTime = -1;
      }
    }

    function parkFilm() {
      window.clearTimeout(captureTimer);
      if (video.error || !root!.classList.contains('film-ready')) return;
      captureFrame();
      if (capturedTime >= 0) root!.classList.add('film-parked');
      else root!.classList.remove('film-ready');
    }

    function configureCaptions() {
      root!.classList.toggle('digit-captions', !reduced.matches && !connection?.saveData && !matchMedia('(forced-colors: active)').matches);
    }
    function configureMedia(p: number) {
      if (!source && p === 0 && document.documentElement.dataset.openingRain) return;
      // Choose the bandwidth tier once per landscape session. A fluctuating
      // network estimate should not start a second download during a seek.
      if (!portraitFilm.matches && (!source || source === sources.portrait || source === sources.portraitHevc)) {
        constrainedLandscape = connection?.effectiveType === '3g';
      }
      const deviceSource = portraitFilm.matches ? portraitSource :
        fits720p || constrainedLandscape ? sources.mobile : desktopSource;
      const next = reduced.matches || connection?.saveData || ['slow-2g','2g'].includes(connection?.effectiveType ?? '') ? '' : deviceSource;
      if (next === source) {
        if (source && p > 0 && video.preload === 'metadata') video.preload = 'auto';
        return;
      }
      window.clearTimeout(captureTimer);
      captureTimer = 0;
      capturedTime = -1;
      root!.classList.remove('film-parked');
      source = next;
      root!.classList.remove('film-ready');
      window.clearTimeout(retryTimer);
      clearStall();
      retried = false;
      video.pause();
      if (source) {video.preload = p === 0 ? 'metadata' : 'auto'; video.src = source;}
      else video.removeAttribute('src');
      video.load();
    }
    function render() {
      frame = 0;
      if (disposed || document.hidden) return;
      if (flight) {
        const t = Math.min(1, (performance.now() - flight.started) / flight.duration);
        // Keep most of the flight at a steady pace while easing both ends.
        const traveled = .72 * t + .28 * smoothstep(0, 1, t);
        const position = flight.from + (flight.destination - flight.from) * traveled;
        window.scrollTo({top:position * range,behavior:'instant'});
        if (t === 1) cancelFlight();
        else schedule();
      }
      const p = Math.min(1, Math.max(0, scrollY / range));
      const moved = p !== progress;
      if (moved) {
        forward = p > progress;
        window.clearTimeout(captureTimer);
        captureTimer = 0;
      }
      progress = p;
      const film = filmPosition(p);
      root!.dataset.progress = String(p);
      root!.dataset.filmProgress = String(film);
      const chapter = chapterFrameAt(p);
      if (root!.dataset.chapterFrame !== chapter.id) root!.dataset.chapterFrame = chapter.id;
      void scenes.show(chapter, portraitFilm.matches, reduced.matches, forward);
      portfolio?.style.setProperty('--flight-progress', String(film));
      if (moved) elapsedRoute?.setAttribute('d', elapsedArc(film));
      const clockText = '00:' + String(Math.floor(film * 30.08)).padStart(2,'0');
      if (filmClock && filmClock.textContent !== clockText) filmClock.textContent = clockText;
      configureMedia(p);
      root!.classList.toggle('at-start', p < .06);

      const ready = !document.documentElement.dataset.openingRain;
      const captionsEnabled = root!.classList.contains('digit-captions');
      for (const label of cornerLabels) {
        const startOnly = label.matches('.corner-end');
        const visible = startOnly ? p === 0 : !label.matches('.corner-home') || p > 0;
        assembly.update(label,ready && visible,captionsEnabled,1,false,forward);
      }

      // Position and film time follow the scroll. Incoming type gets time to resolve even after a large wheel step.
      nodes.forEach(node => {
        const track = choreography[node.dataset.motion!];
        const frames = mobile.matches ? track.mobile : track.desktop;
        const pose = sampleTrack(frames, p);
        const last = frames.length - 1;
        const enters = node.dataset.motion === 'opening' ? 0 : 1 - smoothstep(frames[0].at, frames[1].at, p);
        const leaves = frames[last].opacity === 0 ? smoothstep(frames[last - 1].at, frames[last].at, p) : 0;
        node.style.setProperty('--scene-x', pose.x + 'vw');
        node.style.transform = 'translate3d(var(--scene-x),' + pose.y + 'svh,0) scale(' + (reduced.matches ? 1 : pose.scale) + ')';
        assembly.update(node, ready && pose.opacity >= .015, captionsEnabled, 1 - Math.max(enters, leaves), forward ? leaves > 0 : enters > 0, forward);
        node.style.opacity = String(node.classList.contains('forming-caption') ? smoothstep(0, .62, pose.opacity) : pose.opacity);
        node.style.visibility = pose.opacity < .015 ? 'hidden' : 'visible';
      });
      let currentWaypoint = waypointLinks[0];
      for (const link of waypointLinks) {
        const reached = p + 1 / range >= journeyDestinations[link.dataset.journeyTarget!];
        link.toggleAttribute('data-reached', reached);
        if (reached) currentWaypoint = link;
      }
      for (const link of waypointLinks) {
        if (link === currentWaypoint) link.setAttribute('aria-current','location');
        else link.removeAttribute('aria-current');
      }
      // Read geometry after the writes, then make only visible actions focusable.
      const boxes = nodes.map(node => node.getBoundingClientRect());
      nodes.forEach((node,i) => {
        const box = boxes[i];
        const hidden = Number(node.style.opacity) < .15 || box.bottom < 95 || box.top > innerHeight - 24 || box.right < 0 || box.left > innerWidth;
        node.inert = hidden;
        node.setAttribute('aria-hidden', String(hidden));
      });
      if (source && !video.error) {
        scrubber.setProgress(film);
        if (scrubber.hasCurrentFrame) {
          clearStall();
          root!.classList.add('film-ready');
          if (root!.classList.contains('film-parked') && Math.abs(video.currentTime - capturedTime) > 1 / 120) {
            root!.classList.remove('film-parked');
          }
          if (!captureTimer && capturedTime !== video.currentTime) captureTimer = window.setTimeout(captureFrame, 180);
        } else if (!stallTimer && root!.classList.contains('film-ready')) {
          stallTimer = window.setTimeout(showStills, 650);
        }
      }
      if (openProjects && p > .99) {
        openProjects = false;
        root!.querySelector<HTMLButtonElement>('.ending-invitation')?.focus({preventScroll:true});
        projectOrbit?.showPopover();
      }
    }
    function onReady() {
      if (frame) cancelAnimationFrame(frame);
      render();
    }
    function schedule() {if (!frame && !document.hidden) frame = requestAnimationFrame(render);}
    function cancelFlight() {flight = null;}
    function onScrollKey(event: KeyboardEvent) {
      if (!event.defaultPrevented && scrollKeys.has(event.key)) cancelFlight();
    }
    function measure() {
      const density = window.devicePixelRatio || 1;
      fits720p = innerWidth * density <= 1280 && innerHeight * density <= 720;
      range = Math.max(1,distance!.offsetHeight - innerHeight);
      if (initialized) window.scrollTo({top:progress * range,behavior:'instant'});
      initialized = true;
      schedule();
    }
    function onLink(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const control = (event.target as Element).closest<HTMLElement>('[data-journey-target]');
      let id = control?.dataset.journeyTarget;
      if (id === 'next') {
        id = chapterFrames.find(chapter => journeyDestinations[chapter.id] * range > scrollY + 1)?.id ?? 'projects';
      }
      if (!id || !Object.hasOwn(journeyDestinations,id)) return;
      const destination = journeyDestinations[id];
      openProjects = id === 'projects';
      cancelFlight();
      const from = Math.min(1, Math.max(0, scrollY / range));
      const length = Math.abs(destination - from);
      if (control?.matches('.corner-home,.corner-end,.waypoint') && !reduced.matches && length * range > 1) {
        flight = {
          from,
          destination,
          started:performance.now(),
          duration:Math.max(minimumFlightDuration, length * fullFlightDuration),
        };
      } else {
        window.scrollTo({top:destination * range,behavior:reduced.matches ? 'instant' : 'smooth'});
      }
      schedule();
    }
    function onPreference() {
      if (flight && reduced.matches) {
        window.scrollTo({top:flight.destination * range,behavior:'instant'});
        cancelFlight();
      }
      configureCaptions();
      schedule();
    }
    function clearStall() {
      window.clearTimeout(stallTimer);
      stallTimer = 0;
    }
    function showStills() {
      clearStall();
      root!.classList.remove('film-ready','film-parked');
    }
    function onSeeked() {
      // An ongoing sequence of successful seeks is normal during scrolling.
      clearStall();
      schedule();
    }
    function retryFilm() {
      if (source && video.error && navigator.onLine && !document.hidden) {
        video.load();
        schedule();
      }
    }
    function onError() {
      showStills();
      const code = video.error?.code;
      if (code === MediaError.MEDIA_ERR_DECODE || code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
        if (source === sources.portraitHevc) portraitSource = sources.portrait;
        else if (source === sources.desktopHevc) desktopSource = sources.desktop;
        else return;
        configureMedia(progress);
        schedule();
        return;
      }
      if (!retried && code === MediaError.MEDIA_ERR_NETWORK) {
        retried = true;
        retryTimer = window.setTimeout(retryFilm, 1800);
      }
    }
    function onOnline() {
      scenes.retry();
      retryFilm();
      schedule();
    }
    function onVisibility() {
      if (document.hidden) {cancelFlight(); parkFilm(); cancelAnimationFrame(frame); frame = 0; video.pause();}
      else {if (video.error && !retried) retryFilm(); schedule();}
    }
    function resetEntry() {
      if (location.hash) history.replaceState(history.state,'',location.pathname + location.search);
      openProjects = false;
      cancelFlight();
      window.scrollTo({top:0,behavior:'instant'});
      schedule();
    }
    function onPageShow(event:PageTransitionEvent) {
      if (event.persisted) {
        if (projectOrbit?.matches(':popover-open')) projectOrbit.hidePopover();
        portfolio?.querySelector('details[open]')?.removeAttribute('open');
        resetEntry();
      }
    }

    window.addEventListener('blur',parkFilm);
    window.addEventListener('scroll',schedule,{passive:true});
    window.addEventListener('wheel',cancelFlight,{passive:true});
    window.addEventListener('pointerdown',cancelFlight,{passive:true});
    window.addEventListener('keydown',onScrollKey);
    window.addEventListener('resize',measure);
    window.addEventListener('hashchange',resetEntry);
    window.addEventListener('pageshow',onPageShow);
    document.addEventListener('journey:ready',onReady);
    document.addEventListener('click',onLink);
    document.addEventListener('visibilitychange',onVisibility);
    window.addEventListener('online',onOnline);
    connection?.addEventListener('change',onPreference);
    mobile.addEventListener('change',onPreference);
    portraitFilm.addEventListener('change',onPreference);
    reduced.addEventListener('change',onPreference);
    video.addEventListener('canplay',schedule);
    video.addEventListener('seeked',onSeeked);
    video.addEventListener('error',onError);
    configureCaptions();
    measure();
    resetEntry();
    return () => {
      window.removeEventListener('blur',parkFilm);
      window.clearTimeout(captureTimer);
      clearStall();
      window.clearTimeout(retryTimer);
      scenes.dispose();
      assembly.dispose();
      disposed = true; cancelAnimationFrame(frame); scrubber.dispose();
      document.documentElement.classList.remove('experience-page');
      window.removeEventListener('scroll',schedule);
      window.removeEventListener('wheel',cancelFlight);
      window.removeEventListener('pointerdown',cancelFlight);
      window.removeEventListener('keydown',onScrollKey);
      window.removeEventListener('resize',measure);
      window.removeEventListener('hashchange',resetEntry);
      window.removeEventListener('pageshow',onPageShow);
      document.removeEventListener('journey:ready',onReady);
      document.removeEventListener('click',onLink);
      document.removeEventListener('visibilitychange',onVisibility);
      window.removeEventListener('online',onOnline);
      connection?.removeEventListener('change',onPreference);
      mobile.removeEventListener('change',onPreference);
      portraitFilm.removeEventListener('change',onPreference);
      reduced.removeEventListener('change',onPreference);
      video.removeEventListener('canplay',schedule);
      video.removeEventListener('seeked',onSeeked);
      video.removeEventListener('error',onError);
    };
  },[sources]);
  return null;
}
