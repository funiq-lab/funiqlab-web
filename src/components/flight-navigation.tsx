'use client';

import {useEffect, useRef, type CSSProperties} from 'react';
import {useTranslations} from 'next-intl';
import {coreProjects} from '@/data/portfolio';
import {filmPosition, journeyDestinations} from '@/lib/choreography';
import {elapsedArc, routeAngle, routePoint} from '@/lib/route-dial';
import {LanguageSwitcher} from './language-switcher';
import {SocialLinks} from './social-links';

const filmSeconds = 30;

export function FlightNavigation() {
  const t = useTranslations();
  const header = useRef<HTMLElement>(null);
  const menu = useRef<HTMLDetailsElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const stops = [
    {id: 'departure', label: t('Journey.departure')},
    ...coreProjects.map(project => ({
      id: project.id,
      label: t(`Projects.${project.id}.name`),
    })),
    {id: 'end', label: t('Nav.end')},
  ].map(stop => {
    const progress = filmPosition(journeyDestinations[stop.id]);
    const point = routePoint(progress);
    return {...stop, ...point, bearing: 90 - routeAngle(progress), seconds: Math.round(progress * filmSeconds)};
  });

  function closeMenu(restoreFocus = false) {
    if (!menu.current?.open) return;
    menu.current.open = false;
    if (restoreFocus) menu.current.querySelector('summary')?.focus();
  }

  useEffect(() => {
    const surface = panel.current;
    const disclosure = menu.current;
    const projector = header.current?.closest('.portfolio')?.querySelector<HTMLElement>('.hud-frame[data-side=right]');
    // Aim at a previewed stop; leaving the controls restores the actual film position.
    function aimProjector() {
      const target = disclosure?.open && surface?.querySelector<HTMLElement>('.waypoint:hover, .waypoint:focus-visible');
      if (target && target.dataset.bearing) projector?.style.setProperty('--preview-bearing', target.dataset.bearing);
      else projector?.style.removeProperty('--preview-bearing');
    }
    const aimEvents = ['pointerover', 'pointerleave', 'focusin', 'focusout'] as const;
    for (const type of aimEvents) surface?.addEventListener(type, aimProjector);
    disclosure?.addEventListener('toggle', aimProjector);

    function outside(event: PointerEvent) {
      if (!header.current?.contains(event.target as Node)) closeMenu();
    }
    function escape(event: KeyboardEvent) {
      if (event.key === 'Escape') closeMenu(true);
    }
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      for (const type of aimEvents) surface?.removeEventListener(type, aimProjector);
      disclosure?.removeEventListener('toggle', aimProjector);
      projector?.style.removeProperty('--preview-bearing');
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, []);

  return <header className="site-header" ref={header} onBlur={event => {
    if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) closeMenu();
  }}>
    <nav className="flight-dock" aria-label={t('Nav.main')} onClick={event => {
      if ((event.target as Element).closest('[data-journey-target],a.language-link')) closeMenu(true);
    }}>
      <button type="button" className="corner-link corner-end" data-journey-target="end" aria-label={t('Nav.end')}>
        <span className="rain-label">{t('Nav.end')}</span>
      </button>
      <button type="button" className="corner-link corner-home" data-journey-target="departure" aria-label={t('Nav.backToStart')}>
        <span className="rain-label">{t('Nav.backToStart')}</span>
      </button>
      <details ref={menu} className="flight-menu">
        <summary>
          <span className="route-open"><span className="rain-label">{t('Nav.routeToggle')}</span></span>
          <span className="route-close">{t('Nav.close')}</span>
        </summary>
        <div className="route-language">
          <span className="hud-close-spacer" aria-hidden="true">{t('Nav.close')}</span>
          <LanguageSwitcher/><SocialLinks/>
        </div>
        <div className="route-panel" ref={panel}>
          <div className="route-track">
            <svg className="route-arc" viewBox="0 0 50 100" preserveAspectRatio="none" aria-hidden="true">
              <path className="route-elapsed" d={elapsedArc(0)}/>
              {stops.map(({id, x, y}) =>
                <path key={id} className="route-leader" d={`M${x} ${y}h1.4l1.1 -0.7h1.9`}/>
              )}
            </svg>
            <ol className="route-stops" aria-label={t('Nav.route')}>
              {stops.map(({id, label, seconds, bearing, x, y}, index) =>
                <li key={id} style={{'--stop-x': `${x * 2}%`, '--stop-y': `${y}%`, '--stop-index': index} as CSSProperties}>
                  <button type="button" className="waypoint" data-bearing={`${bearing}deg`} data-journey-target={id}>
                    <time dateTime={`PT${seconds}S`}>00:{String(seconds).padStart(2, '0')}</time>
                    <span>{label}</span>
                  </button>
                </li>
              )}
            </ol>
          </div>
        </div>
      </details>
    </nav>
  </header>;
}
