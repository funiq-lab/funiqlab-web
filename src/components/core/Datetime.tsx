import { Calendar } from "lucide-react";

import type { DatetimesFormatProps, DatetimesProps } from "@/lib/types";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { getLocaleInfo } from "@/i18n/utils";

export default function Datetime({
  locale = DEFAULT_LOCALE,
  hide_datetime,
  hide_time,
  pubDatetime,
  modDatetime,
  className,
}: DatetimesProps) {
  if (hide_datetime) {
    return;
  }
  return (
    <div
      className={`flex items-center text-muted-foreground gap-2 ${className}`}
    >
      <Calendar className="w-[1.2rem]" />
      <div className="italic text-sm">
        <FormattedDatetime
          locale={locale}
          pubDatetime={pubDatetime}
          modDatetime={modDatetime}
          hide_time={hide_time}
        />
      </div>
    </div>
  );
}

function FormattedDatetime({
  locale = DEFAULT_LOCALE,
  pubDatetime,
  modDatetime,
  hide_time,
}: DatetimesFormatProps) {
  const myDatetime: Date = new Date(
    modDatetime && modDatetime > pubDatetime ? modDatetime : pubDatetime,
  );

  const langTag = getLocaleInfo(locale).langTag;
  const date: string = myDatetime.toLocaleDateString(langTag, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const time: string = myDatetime.toLocaleTimeString(langTag, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      <time dateTime={myDatetime.toISOString()}>
        {date}
        {!hide_time && <> {time}</>}
      </time>
    </>
  );
}
