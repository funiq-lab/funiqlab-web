import type {ReactNode} from 'react';
import {LocaleDocument, localeMetadata} from '@/components/locale-document';
import {routing} from '@/i18n/routing';

export {viewport} from '@/components/locale-document';
export function generateMetadata() {return localeMetadata(routing.defaultLocale);}

export default function DefaultLayout({children}: {children: ReactNode}) {
  return <LocaleDocument locale={routing.defaultLocale}>{children}</LocaleDocument>;
}
