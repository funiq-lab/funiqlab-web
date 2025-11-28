import type { I18nStrings } from "../types";

const baseStrings = {
  "site.title": "FuniqLab",
  "site.desc": "Fun and unique",
  "light": "Light",
  "dark": "Dark",
  "system": "System",
  "toggle_theme": "Toggle theme",
};

const ENLocale: I18nStrings = {
  ...baseStrings,
  'nav.home': 'Home',
  'nav.projects': 'Projects',
  'nav.about': 'About',
  'hero.title': 'Explore the Fun',
  'hero.title.highlight': 'Create the Unique',
  'hero.description': 'Discover fun moments in life',
  'hero.description.extra': 'Become your unique self',
  'a11y.languagePicker': "Select language",
  '404.title': 'Page not found',
  '404.description': "The page you're looking for might have been moved or deleted.",
  '404.cta': 'Back to homepage',
  "footer.builtBy": "Built by",
  "footer.sourceCode": "The source code is available on",
};

export default ENLocale;
