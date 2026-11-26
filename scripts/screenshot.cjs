/**
 * Screenshot of the part of a page that changed, for the Telegram before/after replies (task-queue skill, 2c).
 *
 *   node scripts/screenshot.cjs <url> <out.png> --text "<words from changed block 1>" [--text "<block 2>" …] --label Before|After
 *   node scripts/screenshot.cjs <url> <out.png> --selector "<css selector>" --label After       (images, buttons, other non-text changes)
 *   node scripts/screenshot.cjs <url> <out.png> --label After                                  (brand-new page: the top of the page)
 *   options: --width 390 --height 844 (phone, default) · --max-height 2400 · --no-highlight
 *
 * How it frames the change:
 *  - Finds each --text in the article (ignoring menus, header, footer and chapter lists), opening "Show the full page"
 *    on chapter pages, and scrolls sideways inside wide tables so the cell is visible.
 *  - Outlines EVERY matched block in yellow.
 *  - If the blocks fit on one screen: a normal phone screenshot with them centred.
 *  - If they are taller: one LONG screenshot covering all of them (plus a little context), up to --max-height.
 *    Beyond that it is cut and marked "continues below…".
 *  - --label stamps a large BEFORE (red) or AFTER ✓ (green) tag and a coloured strip on the image.
 * Exit codes: 0 ok · 1 error · 2 a --text/--selector was not found (NO screenshot is taken, never send an unrelated picture).
 * Prints one JSON line: { out, mode: "screen"|"long"|"long-cut"|"top", blocks, heightCss }.
 *
 * Needs the `playwright` npm package OUTSIDE the repo (never in package.json):
 *   mkdir -p /tmp/shot && cd /tmp/shot && npm init -y >/dev/null && npm i playwright@1 >/dev/null
 * Uses the preinstalled Chrome (cloud: /usr/bin/google-chrome; macOS: Google Chrome.app).
 */
const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const VALUED = new Set(["--text", "--selector", "--label", "--width", "--height", "--max-height"]);
const positional = args.filter((a, i) => !a.startsWith("--") && !VALUED.has(args[i - 1]));
const [url, out] = positional;
const all = (name) => args.flatMap((a, i) => (a === `--${name}` && args[i + 1] !== undefined ? [args[i + 1]] : []));
const one = (name, def) => all(name).pop() ?? def;
if (!url || !out) {
  console.error('Usage: node scripts/screenshot.cjs <url> <out.png> [--text "<words>" …] [--selector "<css>" …] [--label Before|After]');
  process.exit(1);
}
const texts = all("text");
const selectors = all("selector");
const label = one("label");
const width = Number(one("width", "390"));
const height = Number(one("height", "844"));
const maxHeight = Number(one("max-height", "2400"));
const highlight = !args.includes("--no-highlight");

function loadPlaywright() {
  for (const dir of [process.env.PLAYWRIGHT_DIR, "/tmp/shot", process.cwd()].filter(Boolean)) {
    try {
      return require(require.resolve("playwright", { paths: [dir] }));
    } catch {}
  }
  console.error("playwright not found: run `mkdir -p /tmp/shot && cd /tmp/shot && npm init -y && npm i playwright@1`");
  process.exit(1);
}

(async () => {
  const { chromium } = loadPlaywright();
  const exe = [process.env.CHROME_PATH, "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/opt/pw-browsers/chromium", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].find((p) => p && fs.existsSync(p));
  const browser = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
  try {
    const page = await (await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2 })).newPage();
    // "load", then a short wait for the network to settle (pages with video embeds never go fully idle).
    await page.goto(url, { waitUntil: "load", timeout: 60000 });
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.addStyleTag({ content: "html, body { scroll-behavior: auto !important; } *, *::before, *::after { transition: none !important; animation: none !important; }" });

    const wanted = texts.length + selectors.length;
    if (wanted) {
      // Chapter pages: show every chapter so the text can be found anywhere.
      const opened = await page.evaluate(() => {
        for (const b of document.querySelectorAll("button")) if (/show the full page/i.test(b.textContent || "")) return b.click(), true;
        return false;
      });
      if (opened) await page.waitForTimeout(800);
      // Load lazy images everywhere first, so the layout doesn't move after we measure it.
      await page.evaluate(async () => {
        for (const img of document.querySelectorAll("img[loading=lazy]")) img.loading = "eager";
        for (let y = 0; y < document.body.scrollHeight; y += innerHeight) scrollTo(0, y), await new Promise((r) => setTimeout(r, 60));
        scrollTo(0, 0);
      });
      await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
    }

    const found = await page.evaluate(
      ({ texts, selectors, highlight }) => {
        const norm = (s) => (s || "").replace(/[‘’ʼ]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-").replace(/\s+/g, " ").trim().toLowerCase();
        const outside = (el) => el.closest("header, footer, nav, aside, [role=navigation], [aria-label='Page feedback'], ol.sticky");
        const visible = (el) => {
          const r = el.getBoundingClientRect();
          return el.offsetParent !== null && r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden";
        };
        const blocks = [...document.querySelectorAll("p, li, blockquote, td, th, h1, h2, h3, h4, h5, figcaption, [role=row], [role=cell], [role=rowheader], dt, dd, summary, .prose > div")];
        const hits = [];
        const missing = [];
        for (const needle of texts) {
          const want = norm(needle);
          const cands = blocks.filter((el) => visible(el) && norm(el.textContent).includes(want));
          // Prefer the article over menus/footer, then the smallest block that contains the words.
          cands.sort((a, b) => !!outside(a) - !!outside(b) || (a.textContent || "").length - (b.textContent || "").length);
          if (cands[0]) hits.push(cands[0]);
          else missing.push(`text "${needle}"`);
        }
        for (const sel of selectors) {
          const el = [...document.querySelectorAll(sel)].find(visible);
          if (el) hits.push(el);
          else missing.push(`selector "${sel}"`);
        }
        if (missing.length) return { missing };
        // Wide tables scroll sideways on phones: bring each matched cell into view horizontally.
        for (const h of hits) {
          let p = h.parentElement;
          while (p && p !== document.body) {
            const cs = getComputedStyle(p);
            if (/(auto|scroll)/.test(cs.overflowX) && p.scrollWidth > p.clientWidth) {
              const pr = p.getBoundingClientRect();
              // Columns frozen on the left (position: sticky) cover part of the table: start the cell just right of them.
              const row = h.closest("[role=row], tr") || h.parentElement;
              let frozen = 0;
              for (const c of row.children) {
                if (c !== h && getComputedStyle(c).position === "sticky") frozen = Math.max(frozen, c.getBoundingClientRect().right - pr.left);
              }
              if (getComputedStyle(h).position === "sticky") break; // a frozen cell is always visible
              const hr = h.getBoundingClientRect();
              const free = pr.width - frozen;
              const target = hr.width <= free ? pr.left + frozen + (free - hr.width) / 2 : pr.left + frozen + 4;
              p.scrollLeft += hr.left - target;
              break;
            }
            p = p.parentElement;
          }
        }
        if (highlight)
          for (const h of hits) {
            h.style.outline = "3px solid #f5b301";
            h.style.outlineOffset = "3px";
            h.style.borderRadius = "6px";
            h.style.background = "rgba(255, 213, 79, 0.25)";
          }
        const headerH = (document.querySelector("header")?.getBoundingClientRect().height ?? 64) || 64;
        const top = Math.min(...hits.map((h) => h.getBoundingClientRect().top + scrollY)) - 12;
        const bottom = Math.max(...hits.map((h) => h.getBoundingClientRect().bottom + scrollY)) + 12;
        return { missing, top, bottom, headerH, docH: document.documentElement.scrollHeight, blocks: hits.length };
      },
      { texts, selectors, highlight },
    );

    if (found.missing && found.missing.length) {
      console.error(`Not found on ${url}: ${found.missing.join(", ")}. No screenshot taken.`);
      process.exit(2);
    }

    let mode = "top";
    let clip = null;
    let span = height;
    if (wanted) {
      const need = found.bottom - found.top;
      const room = height - found.headerH - 80; // space under the sticky header, above the label tag
      if (need <= room) {
        mode = "screen";
        const y = Math.max(0, (found.top + found.bottom) / 2 - (height + found.headerH - 70) / 2);
        await page.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), y);
      } else {
        // Long screenshot of the whole changed area (+ context), capped at maxHeight.
        const ctx = 90;
        const y = Math.max(0, found.top - ctx);
        span = Math.min(found.bottom + ctx + 70, found.docH) - y;
        mode = span > maxHeight ? "long-cut" : "long";
        span = Math.min(span, maxHeight);
        clip = { x: 0, y, width, height: span };
      }
    }

    // Labels and the "continues" note are placed in page coordinates inside the captured area.
    await page.evaluate(
      ({ label, mode, clip }) => {
        const add = (style, text) => {
          const d = document.createElement("div");
          d.setAttribute("style", `position:absolute;z-index:2147483647;${style}`);
          if (text) d.textContent = text;
          document.body.appendChild(d);
          return d;
        };
        document.body.style.position = "relative";
        const areaTop = clip ? clip.y : scrollY;
        const areaH = clip ? clip.height : innerHeight;
        // In a long capture the sticky header would float over the content: hide it.
        if (clip) for (const h of document.querySelectorAll("header")) h.style.visibility = "hidden";
        if (mode === "long-cut") {
          add(`left:0;right:0;top:${areaTop + areaH - 170}px;height:170px;background:linear-gradient(rgba(255,255,255,0),#fff 65%)`, "");
          add(`left:0;right:0;top:${areaTop + areaH - 118}px;text-align:center;font:600 15px/1.4 system-ui,Arial,sans-serif;color:#5d6670`, "… the change continues below");
        }
        if (label) {
          const after = /^after$/i.test(label);
          const color = after ? "#1a7f37" : "#c0392b";
          add(`left:0;right:0;top:${areaTop}px;height:8px;background:${color}`, "");
          add(
            `left:50%;transform:translateX(-50%);top:${areaTop + areaH - 64}px;padding:10px 26px;border-radius:999px;background:${color};color:#fff;font:800 22px/1 system-ui,-apple-system,Segoe UI,Arial,sans-serif;letter-spacing:.12em;box-shadow:0 6px 18px rgba(0,0,0,.25);white-space:nowrap`,
            after ? "AFTER ✓" : "BEFORE",
          );
        }
      },
      { label, mode, clip },
    );
    await page.waitForTimeout(300);

    fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
    if (clip) await page.screenshot({ path: out, fullPage: true, clip });
    else await page.screenshot({ path: out });
    console.log(JSON.stringify({ out, mode, blocks: found.blocks ?? 0, heightCss: clip ? Math.round(span) : height }));
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
