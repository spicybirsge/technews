"use client";

import { CalendarDays } from "lucide-react";
import { useSyncExternalStore } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const relative = new Intl.RelativeTimeFormat("en", { numeric: "always" });
const shortDate = new Intl.DateTimeFormat("en", { dateStyle: "medium" });
const serverDate = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" });
const exactDate = new Intl.DateTimeFormat("en", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
  timeZoneName: "short",
});

// One shared ticking clock for every timestamp on the page, running only while something is subscribed.
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;
let now = Date.now();

function subscribe(listener: () => void) {
  if (listeners.size === 0) {
    now = Date.now();
    timer = setInterval(() => {
      now = Date.now();
      listeners.forEach((notify) => notify());
    }, SECOND);
  }
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) clearInterval(timer);
  };
}

const getSnapshot = () => now;
// No clock on the server, so it renders a stable date and the client takes over after hydration.
const getServerSnapshot = () => null;

function formatPostedTime(date: Date, current: number) {
  const elapsed = Math.max(0, current - date.getTime());

  if (elapsed >= DAY) return shortDate.format(date);
  if (elapsed < SECOND) return "just now";
  if (elapsed < MINUTE) return relative.format(-Math.floor(elapsed / SECOND), "second");
  if (elapsed < HOUR) return relative.format(-Math.floor(elapsed / MINUTE), "minute");
  return relative.format(-Math.floor(elapsed / HOUR), "hour");
}

export function PostedTime({ date }: { date: Date }) {
  const current = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const label = current === null ? serverDate.format(date) : formatPostedTime(date, current);

  return (
    <Tooltip>
      <TooltipTrigger
        delay={150}
        render={
          <time
            dateTime={date.toISOString()}
            tabIndex={0}
            className="inline-flex cursor-default items-center gap-1.5 rounded-sm text-sm text-muted-foreground tabular-nums outline-none transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        }
      >
        <CalendarDays className="size-3.5" aria-hidden="true" />
        {label}
      </TooltipTrigger>
      <TooltipContent side="bottom" align="end" className="px-3 py-2 font-medium">
        {exactDate.format(date)}
      </TooltipContent>
    </Tooltip>
  );
}
