import {setRequestLocale} from 'next-intl/server';
import {languagePreferenceKey, routing} from '@/i18n/routing';
import {Portfolio} from '@/components/portfolio';

// Return to an explicitly chosen language on subsequent visits.
const selectLanguage = `(() => {
  const supported = ${JSON.stringify(routing.locales)};
  const fallback = ${JSON.stringify(routing.defaultLocale)};
  let preference;
  try { preference = localStorage.getItem(${JSON.stringify(languagePreferenceKey)}); } catch {}
  const locale = supported.includes(preference) ? preference : fallback;
  if (locale !== fallback) location.replace('/' + locale + '/' + location.search);
})();`;

export default function HomePage() {
  setRequestLocale(routing.defaultLocale);
  return <>
    <script dangerouslySetInnerHTML={{__html: selectLanguage}}/>
    <Portfolio locale={routing.defaultLocale}/>
  </>;
}
