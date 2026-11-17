import Link from "next/link";
import { site } from "@/lib/site";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label={`${site.name} home`}>
      <svg viewBox="0 0 32 32" className="h-9 w-9 shrink-0" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="#0fa37f" />
        <path d="M21.5 9.5a7.5 7.5 0 1 0 0 13 6 6 0 1 1 0-13Z" fill="#ffffff" />
        <path d="m22.5 13 .8 1.7 1.9.3-1.4 1.3.3 1.9-1.6-.9-1.7.9.3-1.9-1.3-1.3 1.9-.3Z" fill="#f7b32b" />
      </svg>
      <span className="leading-tight">
        <span className="block font-display text-xl font-bold tracking-tight">{site.name}</span>
        <span className="hidden text-xs text-muted sm:block lg:hidden xl:block">{site.title}</span>
      </span>
    </Link>
  );
}
