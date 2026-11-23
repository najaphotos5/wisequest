import Link from "next/link";
import { site } from "@/lib/site";

/** "The Emblem": navy seal with a gold ring, 8-point star and an open book radiating light. */
export function LogoMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={`shrink-0 ${className}`} aria-hidden="true">
      <circle cx="60" cy="60" r="58" fill="#14213d" />
      <circle cx="60" cy="60" r="52" fill="none" stroke="#e3b04b" strokeWidth="1.6"/><circle cx="60" cy="60" r="49" fill="none" stroke="#e3b04b" strokeWidth=".6" opacity=".6"/><polygon points="60.0,13.3 73.7,27.0 93.0,27.0 93.0,46.3 106.7,60.0 93.0,73.7 93.0,93.0 73.7,93.0 60.0,106.7 46.3,93.0 27.0,93.0 27.0,73.7 13.3,60.0 27.0,46.3 27.0,27.0 46.3,27.0" fill="none" stroke="#e3b04b" strokeWidth="1" strokeLinejoin="round" opacity=".35"/><g stroke="#e3b04b" strokeWidth="2.2" strokeLinecap="round"><path d="M60 42V28"/><path d="M50 44l-5-11"/><path d="M70 44l5-11"/><path d="M42 48l-9-8"/><path d="M78 48l9-8"/></g><path d="M29 82c10-6 21-6 30-1V52c-9-6-20-6-30 0Z" fill="#fdf6e3" stroke="#e3b04b" strokeWidth="1.6" strokeLinejoin="round"/><path d="M91 82c-10-6-21-6-30-1V52c9-6 20-6 30 0Z" fill="#fdf6e3" stroke="#e3b04b" strokeWidth="1.6" strokeLinejoin="round"/><g fill="none" stroke="#e3b04b" strokeWidth="1" opacity=".75"><path d="M35 60c7-3.5 14-3.5 20-.5M35 66c7-3.5 14-3.5 20-.5M35 72c7-3.5 14-3.5 20-.5"/><path d="M85 60c-7-3.5-14-3.5-20-.5M85 66c-7-3.5-14-3.5-20-.5M85 72c-7-3.5-14-3.5-20-.5"/></g>
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label={`${site.name} home`}>
      <LogoMark />
      <span className="leading-tight">
        <span className="block font-serif text-xl font-bold tracking-tight">{site.name}</span>
        <span className="hidden text-[10px] uppercase tracking-[0.12em] text-muted sm:block lg:hidden xl:block">{site.title}</span>
      </span>
    </Link>
  );
}
