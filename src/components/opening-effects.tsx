'use client';

import {useEffect, useState} from 'react';
import DecryptedText from './react-bits/DecryptedText';

export function DecryptedLabel({text}: {text: string}) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setActive(!preference.matches && !document.hidden && !document.documentElement.dataset.openingRain);
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {attributes:true, attributeFilter:['data-opening-rain']});
    document.addEventListener('visibilitychange', update);
    preference.addEventListener('change', update);
    update();

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', update);
      preference.removeEventListener('change', update);
    };
  }, []);

  return active ? <DecryptedText
    text={text}
    initiallyRevealed
    animateOn="inViewHover"
    loop
    loopDelay={2800}
    sequential
    speed={75}
    characters="01"
    scrambleColor="var(--hud-highlight)"
  /> : <span className="opening-hud-ink">{text}</span>;
}

export function ScrollPrompt({text}: {text: string}) {
  return <button type="button" className="journey-hint" data-journey-target="next" aria-label={text}>
    <span className="rain-label">{text}</span>
  </button>;
}
