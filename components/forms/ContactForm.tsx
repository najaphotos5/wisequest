"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Field, Form, TextArea } from "./Form";

const reasons = [
  { value: "questions", label: "I have questions about Islam" },
  { value: "become-muslim", label: "I want to become Muslim" },
  { value: "new-muslim", label: "I'm a new Muslim and would like support" },
  { value: "visit", label: "I'd like to visit a mosque or attend Quran 101" },
  { value: "counseling", label: "I'd like spiritual counseling" },
  { value: "volunteer", label: "I'd like to volunteer" },
  { value: "other", label: "Something else" },
];

export function ContactForm() {
  const params = useSearchParams();
  const initial = reasons.some((r) => r.value === params.get("reason")) ? params.get("reason")! : "questions";
  const [reason, setReason] = useState(initial);

  return (
    <Form subject="New message from WiseQuest contact form" submitLabel="Send message">
      <fieldset>
        <legend className="text-sm font-semibold">How can we help?</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {reasons.map((r) => (
            <label key={r.value} className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-surface p-3 text-sm has-[:checked]:border-brand has-[:checked]:bg-brand-soft">
              <input type="radio" name="reason" value={r.label} checked={reason === r.value} onChange={() => setReason(r.value)} className="mt-0.5 accent-[var(--brand)]" />
              {r.label}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" name="name" required autoComplete="name" />
        <Field label="Email" name="email" type="email" required autoComplete="email" />
        <Field label="Phone" name="phone" type="tel" autoComplete="tel" hint="Only if you'd like a call or text back." />
        <label className="block">
          <span className="text-sm font-semibold">Best way to reach you</span>
          <select name="preferred_contact" className="mt-1 block w-full rounded-xl border border-line bg-surface px-4 py-2.5">
            <option>Email</option>
            <option>Text message</option>
            <option>Phone call</option>
          </select>
        </label>
      </div>
      <TextArea label="Your message" name="message" required={reason === "other"} placeholder="Ask anything. There are no silly questions." />
    </Form>
  );
}
