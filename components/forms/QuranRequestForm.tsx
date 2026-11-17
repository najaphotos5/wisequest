"use client";

import { Field, Form } from "./Form";

export function QuranRequestForm() {
  return (
    <Form subject="Free Quran request" submitLabel="Send me a free Quran">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" name="name" required autoComplete="name" />
        <Field label="Email" name="email" type="email" required autoComplete="email" />
      </div>
      <Field label="Street address" name="address" required autoComplete="street-address" />
      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="City" name="city" required autoComplete="address-level2" />
        <Field label="State" name="state" required autoComplete="address-level1" />
        <Field label="ZIP" name="zip" required autoComplete="postal-code" inputMode="numeric" />
      </div>
      <Field label="Phone" name="phone" type="tel" autoComplete="tel" />
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="also_send_books" value="yes" className="mt-1 accent-[var(--brand)]" />
        Please also include an introductory book about Islam or Prophet Muhammad ﷺ.
      </label>
    </Form>
  );
}
