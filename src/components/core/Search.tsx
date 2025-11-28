import Fuse, { type FuseResult, type IFuseOptions } from "fuse.js";
import { useState, useMemo, useEffect } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

import { Search as SearchIcon } from "lucide-react";

import type { DocsEntry } from "@/lib/types";
import { capitalizeFirstLetter, docs, filterItems } from "@/lib/utils";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { translateFor } from "@/i18n/utils";

function extractHeaders(body: string): string[] {
  const headers = [];
  const lines = body.split("\n");
  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.*)/);
    if (match) {
      headers.push(match[2]);
    }
  }
  return headers;
}

const options: IFuseOptions<DocsEntry> = {
  includeScore: true,
  threshold: 0.5,
  location: 0,
  distance: 100,
  includeMatches: true,
  minMatchCharLength: 2,
  useExtendedSearch: true,
  findAllMatches: true,
  keys: [
    // { name: "id", weight: 2.5 },
    // { name: "slug", weight: 2.5 },
    { name: "body", weight: 1 },
    {
      name: "title",
      weight: 2,
      getFn: (docs: DocsEntry) => docs.data.title,
    },
    {
      name: "description",
      weight: 1.75,
      getFn: (docs: DocsEntry) => docs.data.description || "",
    },
    {
      name: "tags",
      weight: 1.5,
      getFn: (docs: DocsEntry) => docs.data.tags.join(" ") || "",
    },
    {
      name: "headers",
      weight: 2,
      getFn: (docs: DocsEntry) => extractHeaders(docs.body).join(" "),
    },
  ],
};

export function Search({ locale = DEFAULT_LOCALE }: { locale?: string }) {
  const filteredDocs = filterItems(docs, locale);
  const t = translateFor(locale);
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const fuse: Fuse<DocsEntry> = useMemo(
    () => new Fuse(filteredDocs, options),
    [filteredDocs],
  );
  const results: FuseResult<DocsEntry>[] = useMemo(
    () => fuse.search(searchValue),
    [fuse, searchValue],
  );

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Helper function to get highlighted match snippet
  const getMatchSnippet = (result: FuseResult<DocsEntry>) => {
    console.log(result)
    if (!result.matches || result.matches.length === 0) return null;

    // Get the first match
    const firstMatch = result.matches[0];
    if (
      !firstMatch.value ||
      !firstMatch.indices ||
      firstMatch.indices.length === 0
    )
      return null;

    const value = firstMatch.value;
    const firstIndices = firstMatch.indices[0];
    const [start, end] = firstIndices;

    // Calculate context window (show some chars before and after)
    const contextLength = 40;
    const snippetStart = Math.max(0, start - contextLength);
    const snippetEnd = Math.min(value.length, end + contextLength + 1);

    // Build snippet with ellipsis
    const prefix = snippetStart > 0 ? "..." : "";
    const suffix = snippetEnd < value.length ? "..." : "";
    const snippet = value.slice(snippetStart, snippetEnd);

    // Calculate highlight position within snippet
    const highlightStart = start - snippetStart;
    const highlightEnd = end - snippetStart + 1;

    return {
      prefix,
      before: snippet.slice(0, highlightStart),
      highlight: snippet.slice(highlightStart, highlightEnd),
      after: snippet.slice(highlightEnd),
      suffix,
    };
  };

  return (
    <div className="">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="icon" variant="ghost">
            <SearchIcon className="w-[1.2rem] h-[1.2rem]" />
          </Button>
        </DialogTrigger>
        <DialogContent
          className="flex max-h-1/2 md:mx-0 p-0 overflow-hidden"
        >
          <VisuallyHidden>
            <DialogTitle>{t("search")}</DialogTitle>
            <DialogHeader>
              <DialogDescription asChild>
                <div></div>
              </DialogDescription>
            </DialogHeader>
          </VisuallyHidden>

          <div className="flex flex-col overflow-hidden p-2 w-full">
            <Input
              placeholder={`${t("search")} ...`}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
            {searchValue && results.length === 0 && (
              <div className="mt-4 px-4 py-8 text-center text-muted-foreground">
                {t("no_results_found")}
              </div>
            )}
            {results.length > 0 && (
              <ScrollArea className="relative md:max-h-dynamic_search mt-4 [&>[data-radix-scroll-area-viewport]>div]:!block">
                <ul className="list-none m-0">
                  {results.map((result) => {
                    const { item, refIndex } = result;
                    const snippet = getMatchSnippet(result);

                    return (
                      <li
                        className="px-4 m-0 py-2 hover:rounded text-foreground bg-background hover:text-primary-foreground hover:bg-primary transition-colors"
                        key={refIndex}
                      >
                        <a
                          href={`/${item.slug}`}
                          className="no-underline hover:text-primary-foreground block"
                          onClick={() => setOpen(false)}
                        >
                          <div className="font-medium mb-1">
                            {item.data.title ||
                              capitalizeFirstLetter(
                                item.slug.split("/").pop() || "",
                              )}
                          </div>
                          {snippet && (
                            <div className="text-sm opacity-80">
                              {snippet.prefix}
                              {snippet.before}
                              <span className="font-semibold bg-primary/20">
                                {snippet.highlight}
                              </span>
                              {snippet.after}
                              {snippet.suffix}
                            </div>
                          )}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
