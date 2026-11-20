"use client";

import { useCallback, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export function NewsImage({
  src,
  alt,
  fallback,
  openOriginal = false,
}: {
  src: string;
  alt: string;
  fallback?: ReactNode;
  openOriginal?: boolean;
}) {
  const [image, setImage] = useState<"loading" | "failed" | number>("loading");
  const checkImage = useCallback((image: HTMLImageElement | null) => {
    // Cached or failed images can finish before React attaches its listeners.
    if (!image?.complete) return;
    setImage(
      image.naturalWidth && image.naturalHeight ? image.naturalWidth / image.naturalHeight : "failed",
    );
  }, []);

  if (image === "failed") return fallback ?? null;
  const loading = image === "loading";

  const preview = (
    <span
      className={cn(
        "relative mx-auto block overflow-hidden rounded-lg bg-muted ring-1 ring-border",
        loading && "aspect-[16/10]",
      )}
      style={loading ? undefined : { width: `min(100%, ${image * 28}rem)` }}
    >
      {loading && (
        <span aria-hidden="true" className="absolute inset-0 bg-border/35 motion-safe:animate-pulse" />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element -- Load signed attachment URLs directly. */}
      <img
        ref={checkImage}
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className={loading ? "invisible absolute inset-0 size-full" : "block h-auto w-full"}
        onLoad={(event) => checkImage(event.currentTarget)}
        onError={() => setImage("failed")}
      />
    </span>
  );

  return openOriginal ? (
    <a
      href={src}
      target="_blank"
      rel="noreferrer"
      aria-label={"Open " + alt}
      className="block min-w-0 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 sm:basis-0"
      style={{ flexGrow: loading ? 1 : image }}
    >
      {preview}
    </a>
  ) : preview;
}
