'use client';

import {Languages} from 'lucide-react';
import {useLocale, useTranslations} from 'next-intl';
import {languagePreferenceKey, routing} from '@/i18n/routing';

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations('Nav');
  const nextLocale = routing.locales.find(candidate => candidate !== locale)!;
  const label = t('switchLanguage');
  return <a href={`/${nextLocale}/`} className="language-link" lang={nextLocale} aria-label={label} title={label} hrefLang={nextLocale} onClick={() => {
    try {localStorage.setItem(languagePreferenceKey, nextLocale);} catch { /* Storage is optional. */ }
  }}><Languages size={15} aria-hidden="true" /></a>;
}
