import * as React from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";

interface LanguagePickerProps {
  currentLocale: string;
  locales: Array<{
    code: string;
    name: string;
    href: string;
  }>;
  ariaLabel?: string;
}

export function LanguagePicker({
  currentLocale,
  locales,
  ariaLabel = "Select language",
}: LanguagePickerProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="min-w-[1.2rem]">
          <Button variant="ghost" size="icon" aria-label={ariaLabel}>
            <Languages className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">{ariaLabel}</span>
          </Button>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((locale) => (
          <DropdownMenuItem key={locale.code} asChild>
            <a
              href={locale.href}
              className={
                locale.code === currentLocale ? "font-semibold" : undefined
              }
            >
              {locale.name}
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
