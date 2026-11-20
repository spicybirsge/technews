"use client";

import { LoaderCircle, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useInfiniteScroll } from "react-infinite-scroll-component";

import { NewsCard } from "@/components/news-card";
import { Button } from "@/components/ui/button";
import { fetchNews, type NewsCategory, type NewsPage } from "@/lib/news";

export function NewsFeed() {
  return (
    <>
      <h2 className="mb-5 text-xl font-semibold tracking-tight">Latest stories</h2>
      <CategoryFeed category="all" />
    </>
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
