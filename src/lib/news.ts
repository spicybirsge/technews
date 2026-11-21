const NEWS_ENDPOINT = "https://news.shaheerahamed.com/v1/news";
const PAGE_SIZE = 12;

export type NewsCategory = "all" | "nerds" | "nerds-ai";

export type NewsItem = {
  id: string;
  title: string;
  publishedAt: string;
  category?: string | null;
  summary?: string | null;
  raw_content?: string | null;
  links?: string[];
  attachments?: { url: string; name: string; contentType?: string | null }[];
};

export type NewsPage = {
  items: NewsItem[];
  nextCursor: string | null;
};

export async function fetchNews({
  category = "all",
  cursor,
  signal,
}: {
  category?: NewsCategory;
  cursor?: string;
  signal?: AbortSignal;
} = {}): Promise<NewsPage> {
  const url = new URL(NEWS_ENDPOINT);
  url.searchParams.set("limit", String(PAGE_SIZE));
  if (category !== "all") url.searchParams.set("category", category);
  if (cursor) url.searchParams.set("cursor", cursor);

  const controller = new AbortController();
  const abortFromCaller = () => controller.abort(signal?.reason);
  if (signal?.aborted) abortFromCaller();
  else signal?.addEventListener("abort", abortFromCaller, { once: true });

  const timeout = setTimeout(() => {
    controller.abort(new DOMException("The operation timed out.", "TimeoutError"));
  }, 10_000);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`News API returned HTTP ${response.status}`);

    const page: NewsPage = await response.json();
    if (
      !Array.isArray(page?.items) ||
      (page.nextCursor !== null && typeof page.nextCursor !== "string") ||
      (cursor && cursor === page.nextCursor)
    ) {
      throw new Error("Invalid news page");
    }

    return page;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abortFromCaller);
  }
}
