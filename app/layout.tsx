import type { Metadata } from "next";
import { Kanit, Open_Sans, Source_Serif_4, Amiri } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Analytics } from "@/components/Analytics";
import { DevMode } from "@/components/DevMode";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { site } from "@/lib/site";
import "./globals.css";

const display = Kanit({ variable: "--font-display", subsets: ["latin"], weight: ["500", "600", "700"] });
const body = Open_Sans({ variable: "--font-body", subsets: ["latin"] });
const serif = Source_Serif_4({ variable: "--font-serif", subsets: ["latin"] });
const amiri = Amiri({ variable: "--font-amiri", subsets: ["arabic", "latin"], weight: ["400", "700"] });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.title} | ${site.name}`, template: `%s | ${site.name}` },
  description: site.description,
  openGraph: { siteName: site.name, type: "website", locale: "en_US" },
  alternates: { languages: { es: "/es" } },
};

/** Build stamp for dev mode: version, build time and git commit. */
const build = {
  version: readFileSync("VERSION", "utf8").trim(),
  builtAt: new Date().toISOString(),
  commit: process.env.GITHUB_SHA ?? (() => { try { return execSync("git rev-parse HEAD").toString().trim(); } catch { return ""; } })(),
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: site.name,
  alternateName: site.title,
  url: site.url,
  areaServed: site.region,
  ...(site.contact.email && { email: site.contact.email }),
  ...(site.contact.phone && { telephone: site.contact.phone }),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} ${serif.variable} ${amiri.variable} font-sans antialiased`}>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 btn-primary">
          Skip to content
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <Analytics />
        <DevMode />
        <script type="application/json" id="wq-build" dangerouslySetInnerHTML={{ __html: JSON.stringify(build) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      </body>
    </html>
  );
}
