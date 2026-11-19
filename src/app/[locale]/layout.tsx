import {hasLocale} from 'next-intl';
import {notFound} from 'next/navigation';
import type {ReactNode} from 'react';
import {LocaleDocument, localeMetadata, localeParams} from '@/components/locale-document';
import {routing} from '@/i18n/routing';

export {viewport} from '@/components/locale-document';
export const generateStaticParams = localeParams;
export const dynamicParams = false;

type Props = {params: Promise<{locale: string}>; children: ReactNode};

export async function generateMetadata({params}: Omit<Props, 'children'>) {
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  return localeMetadata(locale);
}

export default async function LocaleLayout({params, children}: Props) {
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  return <LocaleDocument locale={locale}>{children}</LocaleDocument>;
}
