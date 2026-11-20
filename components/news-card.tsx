import { CalendarDays, Cpu, Link2, Paperclip, Sparkles, Tag } from "lucide-react";
import { memo } from "react";
import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import type { NewsItem } from "@/lib/news";

const categories = {
  "nerds-ai": { label: "AI", Icon: Sparkles },
  nerds: { label: "General Tech", Icon: Cpu },
};

const publishedDate = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeZone: "UTC",
});

const markdownComponents: Components = {
  a: ({ href, title, children }) => {
    const external = /^https?:\/\//i.test(href ?? "");
    return (
      <a
        href={href}
        title={title}
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer" : undefined}
      >
        {children}
      </a>
    );
  },
};

function plainHeadline(text: string) {
  return text
    .replace(/<a?:(\w+):\d+>/g, ":$1:")
    .replace(/^#{1,6}\s+/, "")
    .replace(/\[([^\]]+)\]\(<[^>]+>\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getBody(item: NewsItem) {
  const raw = item.raw_content?.trim();
  if (!raw) return "";

  const [firstLine, ...rest] = raw.split(/\r?\n/);
  // The API title usually comes from the first line of the Discord post.
  const body =
    plainHeadline(firstLine) === plainHeadline(item.title) ? rest.join("\n") : raw;

  return body
    .trim()
    .replace(/<a?:(\w+):\d+>/g, ":$1:")
    .replace(/^-#[ \t]+/gm, "");
}

function parseSourceUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url : null;
  } catch {
    return null;
  }
}

function AttachmentLink({ url, name }: { url: string; name: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex max-w-full items-start gap-2 text-muted-foreground underline underline-offset-4 hover:text-foreground"
    >
      <Paperclip className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span className="wrap-anywhere">{name || "Attachment"}</span>
    </a>
  );
}

export const NewsCard = memo(function NewsCard({ item }: { item: NewsItem }) {
  const category = item.category;
  const { label, Icon } =
    category === "nerds" || category === "nerds-ai"
      ? categories[category]
      : { label: category || "Uncategorized", Icon: Tag };
  const title = item.title.replace(/^(?::\w+:\s*)+/, "") || item.title;
  const body = getBody(item);
  const summary = item.raw_content?.trim()
    ? ""
    : item.summary?.replace(/\s+-#\s+/g, "\n\n");
  const sources = [...new Set(item.links)].flatMap((link) => {
    const url = parseSourceUrl(link);
    return url && !body.includes(link) ? [url] : [];
  });
  const attachments = (item.attachments ?? []).filter(({ url }) => parseSourceUrl(url));
  const date = new Date(item.publishedAt);

  return (
    <article>
      <Card className="[--card-spacing:--spacing(5)] sm:[--card-spacing:--spacing(6)]">
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <Badge
              variant={category === "nerds-ai" ? "default" : "secondary"}
              className="h-6 px-2.5"
            >
              <Icon data-icon="inline-start" aria-hidden="true" />
              {label}
            </Badge>
            {Number.isFinite(date.getTime()) && (
              <time
                dateTime={item.publishedAt}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
              >
                <CalendarDays className="size-3.5" aria-hidden="true" />
                {publishedDate.format(date)}
              </time>
            )}
          </div>
          <h3 className="font-heading text-xl leading-snug font-semibold tracking-tight wrap-anywhere sm:text-2xl">
            {title}
          </h3>
        </CardHeader>
        {(body || summary) && (
          <CardContent>
            {body ? (
              <div className="news-markdown text-base leading-relaxed wrap-anywhere">
                <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents} skipHtml>
                  {body}
                </Markdown>
              </div>
            ) : (
              <p className="text-base leading-relaxed wrap-anywhere whitespace-pre-line">
                {summary}
              </p>
            )}
          </CardContent>
        )}
        {(sources.length > 0 || attachments.length > 0) && (
          <CardFooter className="flex-wrap gap-x-5 gap-y-3 text-muted-foreground">
            {sources.map((url) => (
              <a
                key={url.href}
                href={url.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex max-w-full items-start gap-2 underline underline-offset-4 hover:text-foreground"
              >
                <Link2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span className="wrap-anywhere">{url.hostname.replace(/^www\./, "")}</span>
              </a>
            ))}
            {attachments.map(({ url, name }) => (
              <AttachmentLink key={url} url={url} name={name} />
            ))}
          </CardFooter>
        )}
      </Card>
    </article>
  );
});
