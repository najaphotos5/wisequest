"use client";

import { useState } from "react";

/** Lightweight YouTube embed: shows a thumbnail and only loads the player on click. */
export function YouTube({ id, title = "YouTube video" }: { id: string; title?: string }) {
  const [play, setPlay] = useState(false);
  return (
    <figure className="not-prose my-6">
      <div className="relative aspect-video overflow-hidden rounded-xl border border-line bg-surface-2">
        {play ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
            title={title}
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <button type="button" onClick={() => setPlay(true)} className="group absolute inset-0 h-full w-full" aria-label={`Play video: ${title}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" className="h-full w-full object-cover" />
            <span className="absolute inset-0 grid place-items-center bg-black/20 transition group-hover:bg-black/30">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-white/95 shadow-lg">
                <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6 fill-[#0f5c55]" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
              </span>
            </span>
          </button>
        )}
      </div>
      {title !== "YouTube video" && <figcaption className="mt-2 text-sm text-muted">{title}</figcaption>}
    </figure>
  );
}
