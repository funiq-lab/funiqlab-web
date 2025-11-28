import type { MarkdownHeading } from "astro";
import { getCollection } from "astro:content";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import type {
  DocsEntry,
  HeadingHierarchy,
  MenuItem,
  MenuItemWithDraft,
} from "@/lib/types";

import { menuItems, sideNavMenuOrder } from "@/config";
import {
  DEFAULT_LOCALE,
} from "@/i18n/config";
import { getSlugWithoutLocale, isLocaleKey, translateFor } from "@/i18n/utils";
import { UnsupportedLocale } from "@/i18n/errors";

// for shadcn components
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Fetch the collection with type
export const docs: DocsEntry[] = await getCollection("docs");

// Helper function to capitalize the first letter of a string
export const capitalizeFirstLetter = (str: string) => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Helper function to sort items according to sideNavMenuOrder
function sortItems(
  items: MenuItemWithDraft[],
  orderMap: Map<string, number>,
): MenuItemWithDraft[] {
  return items.slice().sort((a, b) => {
    const aIndex = orderMap.get(a.id) ?? Infinity;
    const bIndex = orderMap.get(b.id) ?? Infinity;
    return aIndex - bIndex;
  });
}

export function filterItems(items: DocsEntry[], locale:string = DEFAULT_LOCALE) {
  return items.filter(item => item.id.startsWith(locale)).map(item => (
    {
      ...item,
      id: item.id.replace(`${locale}/`, ""), 
      slug:locale === DEFAULT_LOCALE ?  item.slug.replace(`${locale}/`, "") : item.slug,
    }
  ) as DocsEntry);
}

// Function to build nested menu structure
export function buildMenu(items: DocsEntry[], locale: string = DEFAULT_LOCALE): MenuItem[] {
  const filteredItems = filterItems(items, locale);
  const t = translateFor(locale);
  const menu: MenuItemWithDraft[] = [];

  // Create a map to quickly look up the order of all items
  const orderMap = new Map(
    sideNavMenuOrder.map((item, index) => [item, index]),
  );

  // Helper function to sort top-level items
  function sortTopLevel(items: MenuItemWithDraft[]): MenuItemWithDraft[] {
    // Use id (without locale) for filtering and comparison
    const topLevelItems = items.filter((item) => !item.id.includes("/"));
    const nestedItems = items.filter((item) => item.id.includes("/"));

    // Sort top-level items
    const sortedTopLevelItems = sortItems(topLevelItems, orderMap);

    // Sort nested items by their respective parent folders
    const nestedMenu: MenuItemWithDraft[] = [];
    nestedItems.forEach((item) => {
      const idParts = item.id.split("/");
      const slugParts = item.slug.split("/");
      let currentLevel = nestedMenu;

      // Traverse and insert items into the correct position
      idParts.forEach((part: string, index: number) => {
        const currentId = idParts.slice(0, index + 1).join("/");
        const currentSlug = slugParts.slice(0, index + 1).join("/");
        
        let existingItem = currentLevel.find(
          (i) => i.id === currentId,
        );

        if (!existingItem) {
          existingItem = {
            title: capitalizeFirstLetter(part),
            id: currentId,
            slug: currentSlug,
            draft: item.draft,
            children: [],
          };
          currentLevel.push(existingItem);
        }
        currentLevel = existingItem.children;
      });
    });

    // For each top-level item, attach sorted nested items
    sortedTopLevelItems.forEach((item) => {
      if (item.children) {
        item.children = sortItems(item.children, orderMap);
      }
    });

    return sortedTopLevelItems;
  }

  filteredItems.forEach((item) => {
    const idParts = item.id.split("/"); // Split id (without locale) into parts
    const slugParts = item.slug.split("/"); // Split slug (with locale) into parts
    let currentLevel = menu;

    // Traverse the menu structure based on folder depth
    idParts.forEach((part: string, index: number) => {
      const currentId = idParts.slice(0, index + 1).join("/");
      const currentSlug =  slugParts.slice(0, index + (locale === DEFAULT_LOCALE ? 1 : 2)).join("/");
      
      let existingItem = currentLevel.find(
        (i) => i.id === currentId,
      );

      if (!existingItem) {
        existingItem = {
          title:
            index === idParts.length - 1
              ? item.data.title || ""
              : t(`paths.${part}`),
          id: currentId,
          slug: currentSlug,
          draft: item.data.draft,
          children: [],
        };
        currentLevel.push(existingItem);
      } else {
        // Update title if necessary
        if (index === idParts.length - 1) {
          existingItem.title = item.data.title || "";
        }
      }

      currentLevel = existingItem.children;
    });
  });

  // Sort top-level items based on menu_order and attach nested items
  const topLevelMenu = sortTopLevel(menu);

  return topLevelMenu;
}

// Function to build breadcrumb structure
export function buildBreadcrumbs(
  slug: string,
  locale: string = DEFAULT_LOCALE,
): { title: string; link: string }[] {
  const parts = getSlugWithoutLocale(slug).split("/");
  const t = translateFor(locale);
  const breadcrumbs: { title: string; link: string }[] = [];
  let currentPath = "";

  parts.forEach((part) => {
    if (part) {
      currentPath += `/${part}`;
      breadcrumbs.push({
        title: t(`paths.${part}`),
        link: locale === DEFAULT_LOCALE ? `${currentPath}` : `/${locale}${currentPath}`,
      });
    }
  });

  return breadcrumbs;
}

// create headings for ToC
export function createHeadingHierarchy(headings: MarkdownHeading[]) {
  const topLevelHeadings: HeadingHierarchy[] = [];

  headings.forEach((heading) => {
    const h = {
      ...heading,
      subheadings: [],
    };

    if (h.depth >= 2) {
      topLevelHeadings.push(h);
    } else {
      let parent = topLevelHeadings[topLevelHeadings.length - 1];
      if (parent) {
        parent.subheadings.push(h);
      }
    }
  });

  return topLevelHeadings;
}


export function getMenuItemsByLocale(locale: string = DEFAULT_LOCALE) {
  const t = translateFor(locale);
  return menuItems.map((item) => ({
    title: t(item.titleKey),
    href: locale === DEFAULT_LOCALE ? item.href : `/${locale}${item.href}`,
  }));
}


export function matchPath(
  pathname: string,
  herf: string,
  locale: string = DEFAULT_LOCALE,
): boolean {
  if (!isLocaleKey(locale)) throw new UnsupportedLocale(locale);

  const pathWithoutLocale = getSlugWithoutLocale(pathname);
  const herfWithoutLocale = getSlugWithoutLocale(herf);

  return pathWithoutLocale === herfWithoutLocale;
}