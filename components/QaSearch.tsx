"use client";

import Fuse from "fuse.js";
import Link from "next/link";
import { ImageCard } from "./visual";
import { useMemo, useState } from "react";
import type { QaEntry } from "@/lib/qa";

export function QaSearch({ entries }: { entries: QaEntry[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const categories = useMemo(() => [...new Set(entries.map((e) => e.category))].sort(), [entries]);
  const fuse = useMemo(() => new Fuse(entries, { keys: ["title", "description", "category"], threshold: 0.4 }), [entries]);

  const results = (query ? fuse.search(query).map((r) => r.item) : entries).filter((e) => !category || e.category === category);

  return (
    <div>
      <label className="block">
        <span className="sr-only">Search questions</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search questions, e.g. “suffering” or “Jesus”"
          className="w-full rounded-full border border-line bg-surface px-6 py-3.5 text-lg shadow-sm focus:border-[#f18a1c]"
        />
      </label>
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter by topic">
        {[null, ...categories].map((c) => (
          <button
            key={c ?? "all"}
            type="button"
            aria-pressed={category === c}
            onClick={() => setCategory(c)}
            className="rounded-full border-2 border-line bg-white px-4 py-1.5 font-display text-sm font-medium aria-pressed:border-[#f18a1c] aria-pressed:bg-[#f18a1c] aria-pressed:text-white"
          >
            {c ?? "All topics"}
          </button>
        ))}
      </div>
      <p className="sr-only" aria-live="polite">{results.length} questions found</p>
      <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((e) => (
          <li key={e.href}>
            <ImageCard href={e.href} image={e.image} section="Q&A" title={e.title} body={e.description} />
          </li>
        ))}
      </ul>
      {results.length === 0 && (
        <p className="mt-8 text-muted">
          No matches yet. <Link href="/contact" className="font-semibold text-brand">Ask us your question</Link> and we’ll answer personally.
        </p>
      )}
    </div>
  );
}
