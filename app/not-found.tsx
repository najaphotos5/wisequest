import Link from "next/link";
import { basePath } from "@/lib/asset";

/**
 * Old WordPress file links (/wp-content/uploads/2024/08/name.pdf) now live at
 * /wp/2024-08-name.pdf. GitHub Pages serves this page for any missing URL, so
 * forward those requests before showing "not found".
 */
const wpUploadsRedirect = `(function(){var m=location.pathname.match(/\\/wp-content\\/uploads\\/(\\d{4})\\/(\\d{2})\\/([^/]+)$/);if(m)location.replace(${JSON.stringify(basePath)}+"/wp/"+m[1]+"-"+m[2]+"-"+m[3].toLowerCase());})();`;

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <script dangerouslySetInnerHTML={{ __html: wpUploadsRedirect }} />
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
