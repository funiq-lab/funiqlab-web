'use client';

import {useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent} from 'react';
import {routeRadius} from '@/lib/route-dial';
import {useTranslations} from 'next-intl';
import {projects} from '@/data/portfolio';
import {LanguageSwitcher} from './language-switcher';
import {DecryptedLabel} from './opening-effects';
import {SocialLinks} from './social-links';

const projectCount = projects.length;
const panelId = 'project-orbit';

function wrap(position: number) {
  return (position % projectCount + projectCount) % projectCount;
}

export function ProjectOrbit() {
  const t = useTranslations();
  const panel = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const rotation = useRef(0);
  const idle = useRef(0);
  const frame = useRef(0);
  const drag = useRef<{pointerId: number; start: number; last: number; moved: boolean} | null>(null);
  const [position, setPosition] = useState(0);
  const [locked, setLocked] = useState(true);

  const stop = useCallback(() => {
    window.clearTimeout(idle.current);
    window.cancelAnimationFrame(frame.current);
  }, []);

  const move = useCallback((value: number) => {
    rotation.current = wrap(value);
    setPosition(rotation.current);
  }, []);

  const settle = useCallback((target = Math.round(rotation.current)) => {
    stop();
    const from = rotation.current;
    if (target === from || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      move(target);
      setLocked(true);
      return;
    }

    const start = performance.now();
    setLocked(false);
    function draw(now: number) {
      const progress = Math.min(1, (now - start) / 170);
      if (progress === 1) {
        move(target);
        setLocked(true);
        return;
      }
      const eased = 1 - (1 - progress) ** 3;
      move(from + (target - from) * eased);
      frame.current = requestAnimationFrame(draw);
    }
    frame.current = requestAnimationFrame(draw);
  }, [move, stop]);

  useEffect(() => {
    const surface = track.current;
    const popup = panel.current;
    if (!surface || !popup) return;

    function onWheel(event: WheelEvent) {
      if (event.ctrlKey || !event.deltaY) return;
      event.preventDefault();
      stop();
      const distance = event.deltaMode === 1 ? event.deltaY * 18
        : event.deltaMode === 2 ? event.deltaY * 110 : event.deltaY;
      setLocked(false);
      move(rotation.current + distance / 110);
      idle.current = window.setTimeout(() => settle(), 100);
    }

    const onToggle = (event: ToggleEvent) => {
      stop();
      drag.current = null;
      if (event.newState === 'open') {
        move(0);
        setLocked(true);
      }
    };

    surface.addEventListener('wheel', onWheel, {passive: false});
    popup.addEventListener('beforetoggle', onToggle);
    return () => {
      stop();
      surface.removeEventListener('wheel', onWheel);
      popup.removeEventListener('beforetoggle', onToggle);
    };
  }, [move, settle, stop]);

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || event.button !== 0) return;
    drag.current = {pointerId: event.pointerId, start: event.clientY, last: event.clientY, moved: false};
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const gesture = drag.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;

    if (!gesture.moved) {
      if (Math.abs(event.clientY - gesture.start) < 6) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      gesture.moved = true;
      setLocked(false);
      stop();
    }
    move(rotation.current + (gesture.last - event.clientY) / 90);
    gesture.last = event.clientY;
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerId !== drag.current?.pointerId) return;
    if (drag.current.moved) settle();
    drag.current = null;
  }

  return <section id={panelId} className="project-orbit" ref={panel} data-rotating={!locked || undefined} popover="auto" role="dialog"
    aria-label={t('Nav.work')} tabIndex={-1} onKeyDown={event => {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      event.preventDefault();
      if ((event.target as Element).closest('.orbit-projects')) event.currentTarget.focus({preventScroll: true});
      settle(Math.round(rotation.current) + (event.key === 'ArrowDown' ? 1 : -1));
    }}>
    <div className="orbit-track" ref={track} onPointerDown={onPointerDown} onPointerMove={onPointerMove}
      onPointerUp={endDrag} onPointerCancel={endDrag}
      onLostPointerCapture={event => {if (event.target === event.currentTarget) endDrag(event);}}
      onPointerLeave={event => {if (!drag.current?.moved) endDrag(event);}}>
      <ol className="orbit-projects">
        {projects.map((project, index) => {
          const distance = wrap(index - position + projectCount / 2) - projectCount / 2;
          const angle = distance * Math.PI / 7;
          const hidden = Math.abs(distance) > 2.12;
          const opacity = hidden ? 0 : Math.max(.24, 1 - Math.max(0, Math.abs(distance) - .56) * .46);
          const selected = locked && index === position;
          const name = t(`Projects.${project.id}.name`);
          return <li key={project.id} aria-hidden={hidden || undefined}
            style={{'--project-y': `${50 + Math.sin(angle) * routeRadius}%`,
              '--project-x': `${Math.cos(angle) * routeRadius * 2}%`, opacity} as CSSProperties}>
            {selected
              ? <a className="orbit-card" href={project.url} target="_blank" rel="noopener noreferrer" aria-current="true">
                <span className="orbit-entry">
                  <span>{name}</span>
                  <small>{t(`Projects.${project.id}.shortDescription`)}</small>
                </span>
              </a>
              : <span className="orbit-card"><span className="orbit-preview-name">{name}</span></span>}
          </li>;
        })}
      </ol>
    </div>
    <div className="orbit-language">
      <button type="button" className="orbit-close" popoverTarget={panelId} popoverTargetAction="hide" autoFocus>
        {t('Nav.close')}
      </button>
      <LanguageSwitcher/><SocialLinks/>
    </div>
    <button type="button" className="orbit-scroll-hint" aria-label={t('Work.nextProject')}
      onClick={() => settle(Math.round(rotation.current) + 1)}>
      <DecryptedLabel text={t('Journey.scrollPrompt')}/>
    </button>
  </section>;
}
