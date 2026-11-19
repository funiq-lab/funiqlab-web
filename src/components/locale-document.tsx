import type {ReactNode} from 'react';
import {NextIntlClientProvider} from 'next-intl';
import {getMessages, getTranslations, setRequestLocale} from 'next-intl/server';
import type {Metadata, Viewport} from 'next';
import {routing, type Locale} from '@/i18n/routing';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@/styles/voyage.css';

export const viewport: Viewport = {themeColor: '#030407', colorScheme: 'dark'};

const canonicalPaths: Record<Locale, string> = {en: '/en/', zh: '/zh/'};

export async function localeMetadata(locale: Locale): Promise<Metadata> {
  const t = await getTranslations({locale, namespace: 'Meta'});
  const shareImage = {url:'/og-image.jpg',width:1200,height:630,alt:t('imageAlt')};
  return {
    metadataBase: new URL('https://funiqlab.com'),
    title: t('title'), description: t('description'),
    alternates: {
      canonical: canonicalPaths[locale],
      languages: {...canonicalPaths, 'x-default': '/'},
    },
    openGraph: {
      type: 'website', title: t('title'), description: t('description'),
      siteName: 'FuniqLab', locale: locale === 'zh' ? 'zh_CN' : 'en_US',
      url: canonicalPaths[locale], images: [shareImage],
    },
    twitter: {card: 'summary_large_image', title: t('title'), description:t('description'), images:[shareImage]},
    icons: {icon: '/favicon.svg'},
  };
}

export async function LocaleDocument({locale, children}: {locale: Locale; children: ReactNode}) {
  setRequestLocale(locale);
  const messages = await getMessages({locale});
  const t = await getTranslations({locale, namespace: 'Nav'});
  return (
    <html lang={locale} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <div className="application">
            <button type="button" className="skip-link" data-journey-target="projects">{t('skip')}</button>
            {children}
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

export function localeParams() {
  return routing.locales.map(locale => ({locale}));
}
