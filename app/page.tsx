import Image from "next/image";
import icon from "./icon.png";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-3xl flex-col items-start justify-center gap-5 px-6 py-16">
      <Image
        src={icon}
        alt=""
        width={48}
        height={48}
        className="rounded-lg ring-1 ring-border"
        unoptimized
      />
      <div className="space-y-2">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Tech News
        </h1>
        <p className="text-lg text-muted-foreground">
          Tech news shared by the Face’s Attic Discord community.
        </p>
      </div>
      <a
        href="https://news.shaheerahamed.com/"
        className="text-sm font-medium underline underline-offset-4"
      >
        Read the original feed
      </a>
    </main>
  );
}
