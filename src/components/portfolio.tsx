import {ArrowUpRight} from 'lucide-react';
import {getTranslations} from 'next-intl/server';
import {coreProjects, film} from '@/data/portfolio';
import type {Locale} from '@/i18n/routing';
import {ScrollPrompt} from './opening-effects';
import {HudFrame} from './hud-frame';
import {FlightNavigation} from './flight-navigation';
import {JourneyController} from './journey-controller';
import {JourneyStartup} from './journey-startup';
import {OpeningRain} from './opening-rain';
import {ProjectOrbit} from './project-orbit';

export async function Portfolio({locale}: {locale: Locale}) {
  const t = await getTranslations({locale});
  return <div className="portfolio">
    <JourneyStartup/>
    <OpeningRain/>
    <div className="frame-corners" aria-hidden="true"><span/><span/><span/><span/></div>
    <HudFrame side="left"/>
    <HudFrame side="right"/>
    <FlightNavigation/>
    <main id="voyage" className="cinema at-start" aria-label={t('Meta.title')}>
      <div className="film-media" aria-hidden="true">
        <div className="fallback-frame"/>
        <video className="journey-video" muted playsInline preload="none" tabIndex={-1}/>
        <canvas className="paused-film-frame"/>
        <div className="film-shade"/>
      </div>
      <div className="narrative">
        <div className="motion-node first-credit" data-motion="opening">
          <h1 className="opening-wordmark">{t('Journey.title')}</h1>
          <p><span>{t('Journey.mission')}</span><code>〈 U-4H8N-2R6V 〉</code></p>
        </div>
        <article className="motion-node crew-credit" data-motion="crew">
          <h2><span className="type-window"><span className="type-ink">Yellin</span></span></h2>
          <p className="role">{t('Journey.crewRole')}</p>
          <p className="flight-position"><code>U-4H8N-2R6V</code><span>{t('Journey.crewPosition')}</span></p>
          <p className="transmission corner-quoted">{t('Journey.crewTransmission')}</p>
        </article>
        {coreProjects.map(project => <article key={project.id}
          className="motion-node project-credit" data-motion={project.id}>
          <h2><a href={project.url} target="_blank" rel="noopener noreferrer">
            <span className="type-window"><span className="type-ink">{t(`Projects.${project.id}.name`)}</span></span><ArrowUpRight size={18} aria-hidden="true"/>
          </a></h2>
          <p className="transmission corner-quoted">{t(`Projects.${project.id}.transmission`)}</p>
        </article>)}
        <div className="motion-node blackout-line" data-motion="question">
          <p className="corner-quoted">{t('Journey.question')}</p>
        </div>
        <div className="motion-node earth-credit" data-motion="ending">
          <h2><span className="type-window"><span className="type-ink">{t('Journey.endingTitle')}</span></span></h2>
          <button className="ending-invitation" type="button"
            popoverTarget="project-orbit" aria-haspopup="dialog"><span className="invitation-content">
              <span className="invitation-label">{t('Journey.more')}</span>
              <i className="invitation-rule" aria-hidden="true"/>
            </span></button>
        </div>
      </div>
      <JourneyController sources={film}/>
    </main>
    <div className="flight-readout" aria-hidden="true">
      <div className="film-clock"><span data-film-clock>00:00</span><span> / 00:30</span></div>
      <div className="film-scale"><i/></div>
    </div>
    <ScrollPrompt text={t('Journey.scrollPrompt')}/>
    <ProjectOrbit/>
    <div className="voyage-distance" aria-hidden="true"/>
    <noscript><style>{'.voyage-distance{display:none}.cinema{position:relative;height:auto;overflow:visible}.film-media{position:fixed;opacity:.2}.narrative{position:relative;padding:120px 6vw}.motion-node{position:relative!important;inset:auto!important;transform:none!important;visibility:visible!important;opacity:1!important;width:auto!important;margin-bottom:90px}.journey-hint,.flight-readout{display:none}.type-ink{transform:none!important}.first-credit{color:white}'}</style></noscript>
  </div>;
}
