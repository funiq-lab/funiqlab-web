import type { I18nStrings } from "@/i18n/types";

const baseStrings = {
  "site.title": "FuniqLab",
  "site.desc": "有趣且独特",
  "light": "浅色",
  "dark": "深色",
  "system": "系统",
  "toggle_theme": "切换主题",
};

const CNLocale: I18nStrings = {
  ...baseStrings,
  'nav.home': '首页',
  'nav.projects': '项目',
  'nav.about': '关于',
  'hero.title': '探索有趣',
  'hero.title.highlight': '创造独特',
  'hero.description': '发现生活中的有趣瞬间',
  'hero.description.extra': '成为独一无二的自己',
  "a11y.languagePicker": "选择语言",
  "404.title": "页面未找到",
  "404.description": "您访问的页面可能已被移动或删除。",
  "404.cta": "返回首页",
    "footer.builtBy": "构建者",
  "footer.sourceCode": "源代码托管于",
};

export default CNLocale;
