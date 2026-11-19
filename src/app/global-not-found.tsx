import {getTranslations} from 'next-intl/server';
import {routing} from '@/i18n/routing';
import '@/styles/voyage.css';
import Link from 'next/link';

export default async function GlobalNotFound() {
  const t = await getTranslations({locale: routing.defaultLocale, namespace: 'NotFound'});
  return <html lang={routing.defaultLocale}><body><main className="not-found"><h1>{t('title')}</h1><p>{t('description')}</p><Link className="text-link" href="/">{t('back')}</Link></main></body></html>;
}
