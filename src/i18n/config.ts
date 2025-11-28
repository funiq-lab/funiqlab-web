import ENLocale from "./locales/en";
import CNLocale from "./locales/zh";
import type { I18nStrings } from "./types";

export type LocaleProfile = {
  name: string;
  messages: I18nStrings;
  langTag: string;
  direction: "rtl" | "ltr" | "auto";
  googleFontName: string;
  default?: boolean;
};

export type LocaleKey = keyof typeof localeToProfile;

export const localeToProfile = {
  // locale key must be in lowercase
  zh: {
    name: "中文",
    messages: CNLocale,
    langTag: "zh-CN",
    direction: "ltr",
    googleFontName: "Noto+Sans+SC",
  },
  en: {
    name: "English",
    messages: ENLocale,
    langTag: "en-US",
    direction: "ltr",
    googleFontName: "IBM+Plex+Mono",
    default: true,
  },
} satisfies Record<string, LocaleProfile>;

export const SUPPORTED_LOCALES = Object.keys(localeToProfile) as LocaleKey[];

export const DEFAULT_LOCALE =
  SUPPORTED_LOCALES.find(
    key => (localeToProfile[key] as LocaleProfile)?.default === true
  ) ?? SUPPORTED_LOCALES[0];

export const LOCALES_TO_LANG = Object.fromEntries(
  // For Sitemap
  Object.entries(localeToProfile).map(([locale, profile]) => [
    locale,
    profile.langTag,
  ])
) as Record<keyof typeof localeToProfile, string>;
