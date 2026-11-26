/**
 * Screenshot of the part of a page that changed, for the Telegram "before/after" replies (task-queue skill, 2c).
 *
 *   node scripts/screenshot.cjs <url> <out.png> --text "<words from changed block 1>" [--text "<block 2>" …] --label Before|After [--width 390] [--height 844] [--no-highlight]
 *
 * Finds the text on the page, scrolls it to the middle of the screen, outlines it in yellow and takes the screenshot,
 * so people see exactly what changed (not the top of the page or the footer). Give --text once per changed block:
 * every block is highlighted. --label stamps a large BEFORE (red) or AFTER (green) tag on the image.
 * Exits with code 2 and takes NO screenshot if the text isn't found (never send an unrelated picture).
 * Without --text it captures the top of the page (only for brand-new pages).
 *
 * Needs the `playwright` npm package, installed OUTSIDE the repo (never in package.json):
 *   mkdir -p /tmp/shot && cd /tmp/shot && npm init -y >/dev/null && npm i playwright@1 >/dev/null
 * Uses the preinstalled Chrome (cloud: /usr/bin/google-chrome; macOS: Google Chrome.app).
 */
const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i > -1 ? args[i + 1] : def;
};
const [url, out] = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1].startsWith("--") && args[i - 1] !== "--no-highlight"));
if (!url || !out) {
  console.error('Usage: node scripts/screenshot.cjs <url> <out.png> --text "<changed words>" [--width 390] [--height 844]');
  process.exit(1);
}
const texts = args.flatMap((a, i) => (a === "--text" && args[i + 1] ? [args[i + 1]] : []));
const label = opt("label");
const width = Number(opt("width", "390"));
const height = Number(opt("height", "844"));
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
    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    // No smooth scrolling (the site uses it), so the screenshot isn't taken mid-scroll.
    await page.addStyleTag({ content: "html, body { scroll-behavior: auto !important; } *, *::before, *::after { transition: none !important; animation: none !important; }" });

    if (texts.length) {
      // Open collapsed article views ("Show the full page") so the text can be found anywhere on the page.
      const opened = await page.evaluate(() => {
        for (const b of document.querySelectorAll("button")) if (/show the full page/i.test(b.textContent || "")) return b.click(), true;
        return false;
      });
      if (opened) await page.waitForTimeout(800); // let the reader show every chapter
      // Find the smallest visible block that contains the words (paragraph, list item, table row, heading…).
      const found = await page.evaluate(
        ({ needles, highlight }) => {
          const norm = (s) => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ").trim().toLowerCase();
          const blocks = [...document.querySelectorAll("p, li, blockquote, td, th, h1, h2, h3, h4, figcaption, [role=row], [role=cell], .prose > div")];
          const hits = [];
          const missing = [];
          for (const needle of needles) {
            const want = norm(needle);
            const hit = blocks.filter((el) => el.offsetParent !== null && norm(el.textContent || "").includes(want)).sort((a, b) => (a.textContent || "").length - (b.textContent || "").length)[0];
            if (hit) hits.push(hit);
            else missing.push(needle);
          }
          if (missing.length) return { missing };
          for (const hit of hits) {
            if (!highlight) break;
            hit.style.outline = "3px solid #f5b301";
            hit.style.outlineOffset = "4px";
            hit.style.borderRadius = "6px";
            hit.style.background = "rgba(255, 213, 79, 0.25)";
          }
          // Centre the whole group of changed blocks (from the top of the first to the bottom of the last).
          const top = Math.min(...hits.map((h) => h.getBoundingClientRect().top + scrollY));
          const bottom = Math.max(...hits.map((h) => h.getBoundingClientRect().bottom + scrollY));
          scrollTo({ top: Math.max(0, (top + bottom) / 2 - innerHeight / 2), behavior: "instant" });
          return { missing, tall: bottom - top > innerHeight - 140 };
        },
        { needles: texts, highlight },
      );
      if (found.missing.length) {
        console.error(`Text not found on ${url}: ${found.missing.map((t) => `"${t}"`).join(", ")}. No screenshot taken.`);
        process.exit(2);
      }
      if (found.tall) console.error("Note: the changed blocks are taller than the screen; use fewer --text values or a taller --height.");
      await page.waitForLoadState("networkidle").catch(() => {}); // images that load once in view
      await page.waitForTimeout(600);
    }
    if (label) {
      // A large BEFORE / AFTER tag, so the two images can't be confused even without the caption.
      const after = /^after$/i.test(label);
      await page.evaluate(
        ({ text, color }) => {
          const tag = document.createElement("div");
          tag.textContent = text;
          tag.setAttribute("style", `position:fixed;z-index:2147483647;left:50%;bottom:18px;transform:translateX(-50%);padding:10px 26px;border-radius:999px;background:${color};color:#fff;font:800 22px/1 system-ui,-apple-system,Segoe UI,Arial,sans-serif;letter-spacing:.12em;box-shadow:0 6px 18px rgba(0,0,0,.25)`);
          document.body.appendChild(tag);
          const bar = document.createElement("div");
          bar.setAttribute("style", `position:fixed;z-index:2147483646;left:0;right:0;top:0;height:8px;background:${color}`);
          document.body.appendChild(bar);
        },
        { text: after ? "AFTER ✓" : "BEFORE", color: after ? "#1a7f37" : "#c0392b" },
      );
    }
    fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
    await page.screenshot({ path: out });
    console.log(`saved ${out}`);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
