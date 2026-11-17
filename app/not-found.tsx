import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-accent">Page not found</p>
      <h1 className="mt-2 font-serif text-4xl font-semibold">This page has moved</h1>
      <p className="mt-4 text-muted">We recently rebuilt our website, so some addresses changed. Try one of these:</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-primary">Home</Link>
        <Link href="/learn" className="btn-ghost">Learn</Link>
        <Link href="/qa" className="btn-ghost">Q&A</Link>
        <Link href="/contact" className="btn-ghost">Contact</Link>
      </div>
    </div>
  );
}
