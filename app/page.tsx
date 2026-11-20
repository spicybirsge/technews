import { Braces } from "lucide-react";
import Image from "next/image";

import { NewsFeed } from "@/components/news-feed";
import icon from "./icon.png";

export default function Home() {
  return (
    <div className="min-h-svh bg-muted/50">
      <header className="border-b bg-background">
        <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
            <div className="flex items-center gap-3.5">
              <Image
                src={icon}
                alt=""
                width={44}
                height={44}
                className="rounded-[24%] dark:ring-1 dark:ring-border"
                unoptimized
              />
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Tech News</h1>
            </div>
            <a
              href="https://news.shaheerahamed.com/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium underline underline-offset-4 hover:text-muted-foreground"
            >
              <Braces className="size-4" aria-hidden="true" />
              API
            </a>
          </div>
          <p className="mt-4 text-base text-muted-foreground">
            Stay updated with what is going on in tech.
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 pt-7 pb-14 sm:px-8 sm:pt-9">
        <NewsFeed />
      </main>
    </div>
  );
}
