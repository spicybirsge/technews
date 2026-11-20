"use client";

import { LoaderCircle, RefreshCw, Settings } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useInfiniteScroll } from "react-infinite-scroll-component";

import { NewsCard } from "@/components/news-card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchNews, type NewsCategory, type NewsPage } from "@/lib/news";

const categoryOptions = [
  { value: "all", label: "No Filter" },
  { value: "nerds-ai", label: "AI News" },
  { value: "nerds", label: "General Tech News" },
] satisfies { value: NewsCategory; label: string }[];
const themeOptions = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];
const storageKey = "tech-news-category";
const categoryChangeEvent = "tech-news-category-change";
let unavailableStorageCategory: NewsCategory | undefined;

function isNewsCategory(value: string | null): value is NewsCategory {
  return categoryOptions.some((option) => option.value === value);
}

function getStoredCategory(): NewsCategory {
  if (unavailableStorageCategory) return unavailableStorageCategory;
  try {
    const saved = window.localStorage.getItem(storageKey);
    return isNewsCategory(saved) ? saved : "all";
  } catch {
    return "all";
  }
}

function subscribeToCategory(notify: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === storageKey || event.key === null) notify();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(categoryChangeEvent, notify);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(categoryChangeEvent, notify);
  };
}

function saveCategory(category: NewsCategory) {
  try {
    window.localStorage.setItem(storageKey, category);
    unavailableStorageCategory = undefined;
  } catch {
    unavailableStorageCategory = category;
  }
  window.dispatchEvent(new Event(categoryChangeEvent));
}

export function NewsFeed() {
  const category = useSyncExternalStore<NewsCategory | null>(
    subscribeToCategory,
    getStoredCategory,
    () => null,
  );

  return (
    <>
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-tight">Latest stories</h2>
        <NewsSettings category={category} />
      </div>
      {category === null ? <NewsLoading /> : <CategoryFeed key={category} category={category} />}
    </>
  );
}

function NewsSettings({ category }: { category: NewsCategory | null }) {
  const { theme, setTheme } = useTheme();

  return (
    <Dialog>
      <DialogTrigger
        aria-label="Settings"
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 cursor-pointer text-muted-foreground"
          />
        }
      >
        <Settings className="size-5" aria-hidden="true" />
      </DialogTrigger>
      <DialogContent className="gap-5 p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <SettingsSelect
          id="news-category"
          label="Filter news by"
          options={categoryOptions}
          value={category ?? "all"}
          onValueChange={(value) => {
            if (isNewsCategory(value)) saveCategory(value);
          }}
        />
        <SettingsSelect
          id="news-theme"
          label="Theme"
          options={themeOptions}
          value={theme ?? "system"}
          onValueChange={(value) => {
            if (value) setTheme(value);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function SettingsSelect({
  id,
  label,
  options,
  value,
  onValueChange,
}: {
  id: string;
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onValueChange: (value: string | null) => void;
}) {
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      <Select items={options} value={value} onValueChange={onValueChange}>
        <SelectTrigger id={id} className="w-full border-border bg-background px-3 data-[size=default]:h-10">
          <SelectValue />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false} className="p-1">
          {options.map(({ value, label }) => (
            <SelectItem key={value} value={value} className="pl-2.5">
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function NewsLoading() {
  return (
    <p role="status" className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
      <LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden="true" />
      Loading stories…
    </p>
  );
}

function CategoryFeed({ category }: { category: NewsCategory }) {
  const [page, setPage] = useState<NewsPage | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const requestInFlight = useRef<AbortController | null>(null);
  const items = page?.items ?? [];
  const hasMore = Boolean(page?.nextCursor);

  useEffect(() => {
    const controller = new AbortController();
    fetchNews({ category, signal: controller.signal })
      .then((incoming) => {
        if (!controller.signal.aborted) setPage(incoming);
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => {
      controller.abort();
      requestInFlight.current?.abort();
    };
  }, [category]);

  async function loadMore() {
    if (requestInFlight.current || loading || (page && !hasMore)) return;
    const controller = new AbortController();
    requestInFlight.current = controller;
    setLoading(true);

    try {
      const incoming = await fetchNews({
        category,
        cursor: page?.nextCursor ?? undefined,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      const seen = new Set(items.map((item) => item.id));
      const appended = incoming.items.filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
      setPage({ items: [...items, ...appended], nextCursor: incoming.nextCursor });
      setFailed(false);
    } catch {
      if (!controller.signal.aborted) setFailed(true);
    } finally {
      requestInFlight.current = null;
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  const { sentinelRef } = useInfiniteScroll({
    dataLength: items.length,
    hasMore: hasMore && !loading && !failed,
    next: loadMore,
    scrollThreshold: "400px",
  });

  if (loading && !page && !failed) return <NewsLoading />;

  return (
    <>
      <div className="space-y-5">
        {items.map((item) => <NewsCard key={item.id} item={item} />)}
      </div>
      <div ref={sentinelRef} className="mt-8 flex flex-col items-center gap-3">
        {failed && !loading && (
          <p role="alert" className="text-sm text-muted-foreground">
            {items.length ? "Couldn’t load more stories." : "Couldn’t load the news feed."}
          </p>
        )}
        {(hasMore || failed) && (
          <Button type="button" variant="outline" size="lg" onClick={loadMore} disabled={loading}>
            {loading ? (
              <LoaderCircle className="motion-safe:animate-spin" aria-hidden="true" />
            ) : failed ? (
              <RefreshCw aria-hidden="true" />
            ) : null}
            {loading ? "Loading stories…" : failed ? "Try again" : "Load more stories"}
          </Button>
        )}
        {!hasMore && !failed && !loading && (
          <p className="text-sm text-muted-foreground">
            {items.length ? "You’ve reached the end." : "No stories yet."}
          </p>
        )}
      </div>
    </>
  );
}
