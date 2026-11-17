"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { site } from "@/lib/site";

type Status = "idle" | "sending" | "sent" | "error";

/**
 * Posts form fields as JSON to site.formEndpoint (Formspree, Web3Forms, …).
 * With no endpoint configured, it opens the visitor's email app instead.
 */
export function Form({ subject, children, submitLabel = "Send" }: { subject: string; children: ReactNode; submitLabel?: string }) {
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    if (data._gotcha) return; // honeypot

    if (!site.formEndpoint) {
      const body = Object.entries(data).map(([k, v]) => `${k}: ${v}`).join("\n");
      window.location.href = `mailto:${site.contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch(site.formEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ _subject: subject, ...data }),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div role="status" className="rounded-2xl bg-brand-soft p-8 text-center">
        <p className="font-serif text-2xl font-semibold">Thank you!</p>
        <p className="mt-2 text-muted">We’ve received your message and will be in touch soon. {site.contact.hours}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {children}
      <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      {status === "error" && (
        <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          Sorry, something went wrong. Please try again{site.contact.email ? ` or email us at ${site.contact.email}` : ""}.
        </p>
      )}
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="btn-primary px-7 py-3 text-base" disabled={status === "sending"}>
          {status === "sending" ? "Sending…" : submitLabel}
        </button>
        <p className="text-xs text-muted">
          We only use your details to reply to you. <Link href="/privacy" className="underline">Privacy</Link>
        </p>
      </div>
    </form>
  );
}

const inputCls = "mt-1 block w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-ink placeholder:text-muted/70 focus:border-brand";

export function Field({ label, name, type = "text", required, hint, ...rest }: { label: string; name: string; type?: string; required?: boolean; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">
        {label} {required ? <span className="text-accent" aria-hidden="true">*</span> : <span className="font-normal text-muted">(optional)</span>}
      </span>
      <input type={type} name={name} required={required} className={inputCls} {...rest} />
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function TextArea({ label, name, required, rows = 4, placeholder }: { label: string; name: string; required?: boolean; rows?: number; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">
        {label} {required ? <span className="text-accent" aria-hidden="true">*</span> : <span className="font-normal text-muted">(optional)</span>}
      </span>
      <textarea name={name} required={required} rows={rows} placeholder={placeholder} className={inputCls} />
    </label>
  );
}
