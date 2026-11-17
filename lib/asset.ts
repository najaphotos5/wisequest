/** Base path when the site is served from a sub-folder (e.g. GitHub Pages: "/wisequest"). */
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Prefix a root-relative file path (images, PDFs) with the base path. next/link does this itself. */
export function asset(path: string) {
  return path.startsWith("/") && !path.startsWith("//") ? `${basePath}${path}` : path;
}
