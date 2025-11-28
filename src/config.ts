import type { SocialObjects } from "@/lib/types";

export const SITE = {
  website: "https://www.funiqlab.com",
  author: "FuniqLab",
  desc: "Fun and unique",
  title: "FuniqLab",
  ogImage: "og-image.png",
  repo: "https://github.com/funiq-lab",
};


export const menuItems: { titleKey: string; href: string }[] = [
  // {
  //   titleKey: "docs",
  //   href: "/getting-started/introduction",
  // },
];

// Just works with top-level folders and files. For files, don't add extension as it looks for the slug, and not the file name.
export const sideNavMenuOrder: string[] = [
  "getting-started",
  "getting-started/introduction.mdx",
];

// Don't delete anything. You can use 'true' or 'false'.
// These are global settings
export const docconfig = {
  hide_table_of_contents: false,
  hide_breadcrumbs: false,
  hide_side_navigations: false,
  hide_datetime: false,
  hide_time: true,
  hide_search: false,
  hide_repo_button: false,
  hide_author: true,
};

// Set your social. It will appear in footer. Don't change the `name` value.
export const Socials: SocialObjects = [
  {
    name: "Github",
    href: "https://github.com/yellinzero/",
    linkTitle: ` ${SITE.title} on Github`,
    active: true,
  },
  {
    name: "Mail",
    href: "mailto:funiq.products@gmail.com",
    linkTitle: `Send an email to ${SITE.title}`,
    active: true,
  },
  {
    name: "Twitter",
    href: "https://x.com/FuniqLab",
    linkTitle: `${SITE.title} on X`,
    active: true,
  },
  {
    name: "Discord",
    href: "https://discord.gg/YzhKmPZy",
    linkTitle: `${SITE.title} on Discord`,
    active: true,
  },
];