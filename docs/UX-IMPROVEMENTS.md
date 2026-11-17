# WiseQuest: UX review and improvement plan

Reviewed the live site at https://najaphotos5.github.io/wisequest/ (v01.04.000) on 2026-11-16: every page in `content/`, the app pages, and how they look in the browser.

The redesign fixed the biggest problems of the old WordPress site: the menu, broken formatting, empty sections and the missing About/Privacy pages. What's left is mostly **content** rather than layout. The site has **111 embedded videos against 6 written Q&A answers**, several pages are still unedited copies of the old site, and a few pages are off-mission or work against visitor trust.

---

## 1. Summary: the 10 changes with the biggest impact

| # | Change | Why | Effort |
| --- | --- | --- | --- |
| 1 | **Put a real phone/WhatsApp/email on "Talk to us"** (`lib/site.ts` contact fields are empty) | The most interested visitors have no direct way to reach a person | 10 min (owner input) |
| 2 | **Cut videos from 111 to about 25 hand-picked ones**, with at most 3 per page | Video walls bury the text, slow the page and look like a link farm | Medium |
| 3 | **Remove clickbait and off-tone videos** (e.g. "SHOCKING TRUTH REVEALED!", "MY MIND IS BLOWN 😱", "Saudi Arabia does THIS…") | They undermine the calm, trustworthy tone the site is aiming for | Small |
| 4 | **Rethink the Palestine page and move it out of "Learn"** | It is political advocacy (26 videos, inflammatory titles) inside an introduction to Islam | Owner decision |
| 5 | **Rebuild the Jesus comparison as a real table** | The table broke during migration and is now an unreadable column of fragments | Small |
| 6 | **Write 15–20 more Q&A answers** | The Q&A section is the main entry point for seekers but only has 6 answers | Ongoing |
| 7 | **Finish thin pages**: How to Pray (16 words + QR codes), History, AI Insights | They feel unfinished and lead nowhere | Medium |
| 8 | **Show file size on downloads and shrink big PDFs** (the largest are 44 MB, 38 MB and 35 MB) | Mobile visitors download large files without warning | Small |
| 9 | **Make the end-of-article "next steps" specific to each page** | `NextSteps` is the same generic panel everywhere; tailored links (e.g. Jesus → "Does God forgive without blood sacrifice?") keep readers going | Small |
| 10 | **Curate the Stories page**: 6 featured stories with short write-ups, plus "more on YouTube" | 36 thumbnails with no context is overwhelming | Medium |

---

## 2. Visual clutter and the video problem

### What's there now

| Page | Videos | Other notes |
| --- | --- | --- |
| Stories | 36 | 3 grids, 2 "Embedded media" leftovers, 2 non-English titles, 1 untitled video |
| Palestine | 26 (20 YouTube + 6 Vimeo/VideoPress) | 2 "Embedded media" TikTok leftovers, 18 external links |
| The Quran | 12 | 4 "AI" videos at the very top, before the article starts |
| Who is God? | 8 | Includes "HOW THIS LIFE IS DECEIVING EVERY HUMAN BEING IN 2023" and a "How to become Muslim" video that doesn't fit the topic |
| AI Insights | 7 | The page is only a video list (107 words) |
| Muhammad | 6 | |
| Purpose of Life | 5 | 5 videos come **before** the first paragraph |
| History | 4 | The first one is a conversion story, not history |
| Women | 4 | The videos come before the article |
| Homepage, Become Muslim, New Muslims | 3, 2, 2 | Fine |

The 108 unique videos are also inconsistent with each other:
- **Clickbait or ALL-CAPS titles:** about 17 (listed in section 2.3).
- **Arabic-only or mixed titles** on an English page: 5.
- **Untitled:** 2 (stories `O4jjf37I8rU`, palestine `VJKoH0_1pAk`).
- **Repeated across pages:** the same AI and Quran videos appear on both `/learn/quran` and `/learn/ai-insights`, and `scNbiWeA2pM` is on both Stories and History.

### Why it hurts
- **Reading order.** On Quran, Purpose of Life and Women, a block of video thumbnails comes before the first sentence. Visitors see "watch these" before they know what the page is about.
- **Trust.** Thumbnails like "JOE ROGAN CONVERTS TO ISLAM" and titles like "Israel is a Terrorist State" make the site look like a content aggregator. They also make the careful written articles look less credible.
- **Choice overload.** When people face 36 equal options, they tend to pick none. A few clearly recommended choices get far more views.
- **Third parties.** Every video is a third-party opinion that the site seems to endorse, and links can break or change at any time.

### Recommended rules (add these to the update-site skill)
1. **At most 3 videos per article**, placed **after** the text in a "Watch" section. The Stories page is the only exception.
2. **Every video gets a one-line note saying why it's worth watching**, e.g. "A former youth minister explains what changed his mind (12 min)". This needs a new optional `note` prop on `<YouTube>`.
3. **Use a clean title.** Show our own short title instead of the YouTube title, e.g. `title="Joshua Evans: from youth minister to Muslim"`.
4. **No clickbait, ALL CAPS, emoji, politics or attacks on other faiths** in anything we show.
5. **Show the length** (e.g. "12 min") so visitors know what they're committing to.
6. **No duplicates across pages.** Link to the other page instead.
7. **Keep a list of approved videos** in `data/videos.json` (id, title, note, minutes, speaker, topic). Pages refer to videos by id, so the site can be reviewed in one place and re-used consistently.

### Videos to remove or replace first
| Page | Video | Reason |
| --- | --- | --- |
| Quran, AI Insights | "SHOCKING TRUTH REVEALED! Is the Quran Actually Preserved?" | Clickbait |
| AI Insights | "MY MIND IS BLOWN 😱 unbelievable word miracles…", "Top 5 Mind-Blowing ChatGPT Answers…" | Clickbait |
| Who is God? | "HOW THIS LIFE IS DECEIVING EVERY HUMAN BEING IN 2023" | Clickbait and dated |
| Stories | "Former Christian Minister Converts to Islam and Saudia Arabia does THIS…" | Clickbait, misspelled |
| Stories | "Shock US Celebrity Conversions…" (Joe Rogan thumbnail) | Misleading thumbnail |
| Stories | "LISTEN TO THIS Hollywood Actor…", "Why hasn't anyone told us about this!?" | Clickbait |
| Stories | "'They Lied to Me About Islam.' [Americans Uncover Devastating Truths about Israeli Propaganda]" | Political; not a conversion story |
| Stories | Arabic-titled videos (`YXqqsNbaV2I`, `WKk9cb1tfNY`) | Wrong language for the page |
| Stories | Untitled `O4jjf37I8rU` | Unknown content |
| Palestine | Most of the list (see section 4) | |
| Muhammad | "Prophecies of Prophet Mohammed in Bible by Ortodox Jew Rabbi" | Misspelled title; check the claim before showing it |

---

## 3. Page-by-page review

### Homepage (`app/page.tsx`)
**Works well:** the clear hero with two actions, the essentials cards, the journey cards, and the Quran 101 and free Quran panels.

Improvements:
- **It's long: 9 sections.** Cut "Discover Islam" (it repeats the Learn page) or merge it with "Start with the essentials". Aim for about 6 sections.
- **The "From doubt to faith" video strip** loads 3 YouTube thumbnails on the homepage. Replace it with 3 **story cards** (photo, name, one-line quote, link to /stories). That's lighter, faster, and gives the stories a human face.
- **Show the next Quran 101 date** ("Next session: Wed, Nov 19, 7 PM"), not just "Wednesdays".
- **Add a slim trust line** near the bottom: "Run by local volunteers in Greater Sacramento with ICNA Sacramento · No pressure, no cost · Your questions are private".
- **Make the "Talk to someone" action specific:** "Call or text us", with the number shown, once the owner adds it.

### Start Here (`/start`, `/start/god`, `/purpose-of-life`)
- `/start` is solid and has key points and chapters.
- **`/start/god`:** cut the 8 videos at the bottom to 2. Several are off-topic ("How to Become Muslim: Step-by-Step Guide", "4500 Religions – I Chose Islam") or clickbait.
- **`/purpose-of-life`:**
  - Move the 5 videos below the text.
  - Rewrite the headings, which are whole Quran verses ("## “Was there not a period of time…” The Quran, Chapter 76, Verse 1"). Use short headings and put the verse in a `<Verse>` block.
  - Replace "Click below to listen…".
- **Missing:** a short **"Five Pillars"** page of its own. The homepage links to `/start#five-pillars`, but each pillar deserves a short paragraph and a link.
- **Missing:** an **"Articles of Faith"** page (belief in God, angels, books, prophets, the Last Day, destiny). It's a core part of "what Muslims believe" and isn't covered anywhere.

### Learn
- **`/learn/quran`:**
  - It opens with 4 AI videos before the article. Remove them; the article itself ("5 Facts…") is strong.
  - The bottom grid of 8 "proof" videos is too many, and several titles are shouty. Keep 2.
  - Replace "Click here" links.
- **`/learn/muhammad`:**
  - The quote headings are long citations ("### Michael H. Hart, The 100: A Ranking of… p. 33:"). Use a `<Verse>`-style quote card with the person's name and the source in the caption.
  - Cut the videos to 2 or 3.
- **`/learn/jesus`: broken, fix first.**
  - The comparison table (Aspect / Islamic View / Jesus' View / Paul & Church) was flattened into a single column of bold fragments, so it can't be read.
  - Rebuild it as a real table (or one card per row on mobile).
  - Remove the decorative QR code image.
  - The tone of the "Paul & Church ❌" column will feel confrontational to the Christian readers this page is for. Consider presenting it as "What the Quran says / What the Gospels record", with a respectful introduction, and dropping the ❌ marks.
  - The page ends with a stray "Charts:" label.
- **`/learn/women`:** good content. Move the 4 videos below the article.
- **`/learn/history`:** 66 words, a Palestine PDF, and 4 videos (one of them a conversion story). Either:
  - (a) write a real page ("Muslim contributions to science and civilization": the House of Wisdom, Al-Andalus, algebra, medicine), keeping "How Islam Saved Western Civilization" and the 1001 Inventions film; or
  - (b) remove it from the menu until it's written.
- **`/learn/ai-insights`: recommend removing.** It's only videos, mostly clickbait, and duplicates the Quran page. "What ChatGPT says" isn't a credible source for a faith site, and it may age badly. If the owner wants to keep the idea, write one short article ("Can AI judge scripture?") with 1–2 videos.
- **Missing topics** that seekers commonly search for:
  - Islam and science (an empty section on the old site)
  - Islam and other faiths / Abraham and the prophets
  - Life after death
  - Ramadan and Eid explained
  - Jihad, extremism and what Islam says about violence
  - Hijab, dress and modesty
  - Common misconceptions

### Palestine (`/learn/palestine`): owner decision needed
This is the most important content decision on the site.
- It sits under **Learn**, next to the Quran and Muhammad ﷺ, but it's mostly political advocacy:
  - headings like "STOP The Genocide, Act Now!" and "The Facts The Mainstream Media Don't want you to know";
  - 26 videos, including "Israel is a Terrorist State", "How Israel STOLE Palestine" and "I'm embarrassed to be an American";
  - 2 TikTok embeds that no longer display.
- **UX risk:** a visitor exploring Islam from the "Learn" menu lands on content that reads as political. That can confirm the misconceptions the rest of the site is trying to correct. It's also the page most likely to put off a curious Christian or Jewish visitor.
- **Options:**
  1. **Recommended:** move it out of "Learn" to its own clearly labeled page (e.g. "Justice & Palestine", linked from the footer or About). Rewrite it around the **Islamic principles** (justice, protecting innocent life, Quran 4:135 and 5:8 are already quoted). Keep 3–5 carefully chosen, sourced, respectful resources, and drop the inflammatory titles.
  2. Keep it as is but out of the main navigation.
  3. Remove it from this site and link to a dedicated organization.

### Q&A (`/qa`)
- **Only 6 answers.** The index pads the list with links to articles, which is fine, but seekers expect dozens of short answers.
- **Write 15–20 short answers (150–400 words each)** to the most-searched questions:
  - Do Muslims worship a different God?
  - Who is Allah?
  - What do Muslims believe about Jesus?
  - Why do Muslim women wear hijab?
  - Does Islam promote violence?
  - What is jihad?
  - What is Sharia?
  - Do I have to change my name?
  - Can I become Muslim if my family isn't?
  - Do I need to learn Arabic?
  - What happens to people who never heard of Islam?
  - Why pray five times a day?
  - Is music allowed?
  - Can Muslims celebrate Thanksgiving or Christmas with family?
  - What is Ramadan?
  - What's the difference between Sunni and Shia?
- **Use one template per answer:** a short answer first (2–3 sentences), then the details, sources, and "Still have questions? Ask us".
- **Make an empty search useful:** when a search finds nothing, offer "Ask this question" and pre-fill the contact form with it.
- The `does-god-care-about-us` answer is 1,523 words. Consider splitting it, or adding a short answer at the top.

### Stories (`/stories`)
- 36 thumbnails in 3 unexplained grids, 2 "Embedded media" leftovers, and a heading made of a "click here" sentence.
- **Redesign:**
  - Choose **6 featured stories**, each with a photo/thumbnail, name, background ("former Baptist minister"), a one-line quote, and the video length.
  - Add filters by background: Christian, Jewish, no religion, other.
  - End with "More stories on YouTube".
- **Add local or written testimonials** (with permission) from Sacramento-area new Muslims. These are more relatable than celebrity videos and unique to this site.

### New Muslims
- **`/new-muslims`:** the roadmap is good.
  - Rename and describe the 6 downloads. There are three overlapping new-Muslim guides of 21–38 MB each; keep **one** recommended guide and an "also available" list.
  - Pair the 2 videos with short notes.
- **`/new-muslims/how-to-pray`: needs a rewrite.**
  - It's 16 words, a PDF, two large QR codes and two raw app-store URLs.
  - QR codes are pointless on a page already open on a phone, and raw URLs look broken.
  - Replace them with:
    - a 5-step visual overview of the prayer (times, wudu, the movements, what to say);
    - "Start simple: what to do in your first week";
    - the PDF booklet;
    - App Store / Google Play **badges**;
    - one short "how to pray" video.
- **Missing:**
  - a "Your first 30 days" checklist;
  - "How to tell your family" guidance;
  - a "Find a mentor" form;
  - a New Muslims WhatsApp/community circle, if one exists.

### Become Muslim (`/become-muslim`)
- This is strong: clear steps, the Shahada in Arabic, transliteration and translation, and "Would you like someone with you?".
- **Add:**
  - an **audio button** so people can hear the Shahada pronounced;
  - a direct "Call/text us to say it with someone" button (once contact details exist);
  - reassurance that "You don't need to change your name, know Arabic, or be perfect first".
- Move the 2 videos below "What happens next?" so the main path isn't interrupted.

### Local (`/local`, `/local/mosques`)
- **Sacramento has said "Schedule to be announced" for a long time.** Either set a date, or hide that card and show only "Sign up to hear about new locations".
- **Add a map** (a static image or embedded map) of the mosques and the Quran 101 location.
- For each mosque, say whether it has **sisters' facilities** and a **new-Muslim program**.
- **Quran 101:** add "What to expect" (format, length, whether a Quran is provided, whether everyone is welcome, what to wear), a photo of the entrance, and parking notes.
- **Fix the address conflict:** the old site lists both "Foothills Blvd" and "Foothill Blvd 95661" (already a README TODO).

### Resources (`/resources`)
- Well organized. Two issues:
  - The "200 Golden Hadith (Arabic)" PDF is **44 MB** and Arabic-only on an English page. Move it to an "Arabic resources" list with a size warning, or remove it.
  - The "Other languages" link lists are dense walls of text. Show them as compact language chips or a dropdown.
- **Downloads should show size and page count** ("PDF · 2.1 MB · 40 pages"). This needs a change to the `<Download>` component, which can read the file size at build time.
- **Compress large PDFs.** Most could be 5–10× smaller with no visible loss, using something like `gs -sDEVICE=pdfwrite -dPDFSETTINGS=/ebook`.

### Get Involved and the Dawah toolkit
- **Toolkit:**
  - The download titles are file names ("2025 06 wp 1749543139159", "Free Quran sign Creator msg 2", "Copy of Free Quran sign WhyIslam").
  - One file is a `.docx` and two are phone screenshots.
  - Rename every item, add a one-line description, and group them as Handbooks / Signs / Handouts.
  - The toolkit is for volunteers, not seekers; keep it out of the main navigation (it already is).
- **Get Involved:**
  - Add the volunteer roles with their time commitment.
  - Add "Host a booth" and "Mail Qurans" as concrete sign-ups.

### Español (`/es`)
- Good to have. Make it easy to find: add an **"Español"** link in the header (top-right) or footer, and a link back to English.

### About, Privacy, Contact
- **About:** add real names or photos of the team (or at least "a team of local volunteers"), the affiliation wording, and **who reviews the religious content**. People decide whether to trust a site like this based on these details.
- **Contact:**
  - Until `NEXT_PUBLIC_FORM_ENDPOINT` is set, submitting a form opens the visitor's email app. With no email set in `lib/site.ts`, that email has **no recipient**, so the message can't be sent. Many visitors, especially on shared or work computers, have no email app set up at all. **This is the most important practical fix.**
  - Show the expected response time near the button (the "We usually reply within 24 hours" text exists in `lib/site.ts`).

---

## 4. Tone, consistency and trust

- **Use one voice.** The rewritten pages (Start, Become Muslim, New Muslims) are warm and calm. Migrated pages still have WordPress-era headings ("STOP The Genocide, Act Now!", "Click the here link below…", "5 Facts That **Prove**…"). Rewrite them to match the calm voice.
- **"Proof" language:** headings like "5 Facts That Prove the Quran Is From God" and video titles like "Strongest PROOF" can feel pushy to skeptics. "5 reasons people find the Quran remarkable" invites the reader in instead.
- **Respect for other faiths:** keep comparisons factual and kind, especially on the Jesus page. The audience is often Christian.
- **Sources:** quotes in long articles should have a reference (Quran surah:ayah, hadith collection and number). The `sources:` front matter field exists but no page uses it yet. Show a "Sources" box at the end of articles.
- **Dates:** show "Last reviewed: month year" on articles to signal the content is maintained.
- **Remove leftovers** from the WordPress migration:
  - "Embedded media" links (on Stories and Palestine);
  - 18 "click here" links across the content;
  - 62 raw URLs shown as link text;
  - empty-alt content images (in Women, Muhammad, Jesus, How to Pray and 4 Q&A files).

---

## 5. Navigation and structure

- The **Learn** menu mixes core topics (Quran, Muhammad ﷺ, Jesus, Women) with weak or off-mission ones (History, AI Insights). Keep Learn to strong pages only.
- **Suggested Learn menu:** The Quran · Prophet Muhammad ﷺ · His Teachings · Jesus in Islam · Women in Islam · Islam & Science (new) · Life After Death (new).
- **Add "Five Pillars" and "Articles of Faith"** under Start Here once those pages exist.
- **Show related reading** at the end of each article: 3 cards picked by topic. `NextSteps` already appears on every article, but its links are generic; add an optional `related:` front matter list so each page can point to the most relevant next read.
- **Make the Learn index page more than a grid:** group the pages ("Understand the basics", "The Prophets", "Life & society") and show the reading time on each card.

---

## 6. Reading experience

- **Chapters mode** works well. Next steps:
  - Show "~3 min" per chapter in the chapter list.
  - Remember the last chapter read (a localStorage "Continue reading" prompt).
  - Add chapters to `learn/quran` and `learn/muhammad` once the videos are moved below the text.
- **Line length and spacing are good.** Verse blocks look great; use `<Verse>` everywhere verses appear (many migrated pages still have verses as plain paragraphs).
- **Add a "Listen" (text-to-speech) or audio option** for key pages. Many seekers prefer listening.
- **Print / save as PDF:** add a print stylesheet so that printed pages show all chapters and hide the menus.

---

## 7. Accessibility and performance

- **Videos:** each lite-YouTube embed shows a thumbnail from YouTube. They're already lazy-loaded, but the Stories page still has 40 images. Cutting the number of videos helps most.
- **Alt text:** decorative card images correctly use `alt=""`. Content images inside articles need real descriptions (see section 4).
- **Downloads:** say "PDF" and the size inside the link text, for screen readers too.
- **Colour contrast:** check white text on the orange (Q&A, `#f18a1c`) and cyan (Start Here, `#00a6d6`) section colours. Both are probably below WCAG AA for normal-size text, so darken them slightly where they're used behind text.
- **Mobile:**
  - The chapter dropdown hasn't been checked on a real phone yet.
  - Check the header at 360px.
  - Make sure tap targets are at least 44px.
- **`public/wp` is about 250 MB.** GitHub Pages has a 1 GB limit, so it's fine for now, but compressing the PDFs (section 3, Resources) also makes downloads faster.

---

## 8. Features worth adding

| Feature | Value | Notes |
| --- | --- | --- |
| Click-to-call / WhatsApp button (floating on mobile) | High | Needs contact info |
| "Ask a question" pre-filled from a failed Q&A search | High | Small change to `QaSearch` |
| Upcoming events list (Quran 101 dates, open mosque days) | High | `data/events.json` + homepage card |
| Newsletter / "Notify me" signup | Medium | Replaces the old WordPress subscribe widget |
| Shahada audio | Medium | One small MP3 |
| Curated `data/videos.json` | Medium | Enforces the video rules |
| Story cards with real local testimonials | Medium | Needs permission from participants |
| Download size/page count on `<Download>` | Medium | Build-time `fs.stat` |
| Site-wide search (not just Q&A) | Medium | Extend the Fuse index to all pages |
| Privacy-friendly analytics (e.g. Plausible, GoatCounter) | Medium | Shows which pages people actually use; update the privacy page |
| Dark mode | Low | Tokens are already in `globals.css` |

---

## 9. Suggested order of work

**Phase 1: quick wins (1–2 days)**
1. Owner: add contact email/phone/WhatsApp and the form endpoint.
2. Remove the clickbait and off-topic videos listed in section 2. Move the remaining videos below the text on Quran, Purpose of Life, Women and God.
3. Fix the Jesus table.
4. Remove AI Insights from the menu (or the site).
5. Clean up the "Embedded media" leftovers, the "click here" links and the raw URLs.
6. Rename the Dawah toolkit downloads.

**Phase 2: structure and content (1–2 weeks)**
1. Decide on the Palestine page (section 3).
2. Rewrite How to Pray, and History or remove it.
3. Redesign Stories as 6 featured stories.
4. Add file sizes to downloads and compress the PDFs.
5. Write the first 10 new Q&A answers.
6. Replace the homepage video strip with story cards.

**Phase 3: growth (ongoing)**
1. New pages: Five Pillars, Articles of Faith, Islam & Science, Life After Death.
2. Events list, newsletter, privacy-friendly analytics.
3. Local testimonials, Shahada audio, mosque map.
4. A content review pass: sources, "last reviewed" dates, `curated: true` on every page.

---

## 10. Decisions needed from the owner

- [ ] Contact details to publish (email, phone/text, WhatsApp) and a form provider.
- [ ] Palestine page: move, rewrite, or remove? (Section 3)
- [ ] AI Insights: remove or rewrite?
- [ ] History: write it properly, or remove it for now?
- [ ] Which 6 conversion stories to feature?
- [ ] Is it OK to cap videos at 3 per article?
- [ ] Who reviews the religious content, and can they be named on the About page?
- [ ] The Sacramento Quran 101 schedule, or hide that card.
