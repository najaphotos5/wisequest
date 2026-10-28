# The original WiseQuest website (wisequest.home.blog)

This branch is a **snapshot of the original WordPress site**, https://wisequest.home.blog/, as it was before WiseQuest was rebuilt (branch `main`, live at https://wisequest.org/). It is kept so that every page can be compared with how it started.

- **Captured:** 2026-11-25, from the live old site. Its newest page edit is dated 2026-10-28, which is also this commit's author date.
- **Never merged into `main`.** It shares no history with it (an orphan branch).

## What is here

| Folder | What |
|---|---|
| `html/` | Every page exactly as the old site served it (HTML, without its CSS/JS) |
| `content/` | The page text as Markdown (front matter: title, old URL, last modified), made with `scripts/scrape.ts` on main |
| `screenshots/` | A full-page desktop screenshot of every page (1280 px wide, JPEG) |
| `api/` | The raw WordPress REST API data for all pages and posts |
| `index.json` | One entry per page: slug, title, old URL, **new URL on wisequest.org**, last modified, file paths |

The old site's images and PDFs are not duplicated here: they were already imported into `public/wp/` on `main`.

## Compare with the current site

```bash
npm run original -- /learn/jesus/            # on main: the old URL and a summary of what changed
npm run original -- /learn/jesus/ --full     # the full text diff
git show original-site:content/jesus.md      # the old page text
```

## Pages (36)

| Old page | Now on wisequest.org | Last edited on the old site |
|---|---|---|
| [Understanding Islam: Core Beliefs and Principles](https://wisequest.home.blog/) | [/](https://wisequest.org/) | 2025-12-03 |
| [Home](https://wisequest.home.blog/) | [/](https://wisequest.org/) |  |
| [Prophet Muhammad (peace be upon him)](https://wisequest.home.blog/2025/12/19/prophet-muhammad-peace-be-upon-him/) | [/learn/muhammad](https://wisequest.org/learn/muhammad) | 2025-12-19 |
| [Mohammad peace & blessings be upon him](https://wisequest.home.blog/2025/12/24/mohammad-peace-blessings-be-upon-him/) | [/learn/muhammad](https://wisequest.org/learn/muhammad) | 2025-12-24 |
| [Answering Dr. Todd Phillips: Why God does not allow us to see Him (in this life)?](https://wisequest.home.blog/2026/10/28/answer-to-dr-todd-phillips-why-god-does-not-allow-us-to-see-him-in-this-life/) | [/learn/why-cant-we-see-god](https://wisequest.org/learn/why-cant-we-see-god) | 2026-10-28 |
| [Arabic 101](https://wisequest.home.blog/2742-2/) | [/](https://wisequest.org/) | 2026-04-18 |
| [Brief New Muslim Guide – Mobile Phone friendly](https://wisequest.home.blog/887-2/) | [/new-muslims](https://wisequest.org/new-muslims) | 2023-08-05 |
| [AI Insights: Unbiased Analysis & Commentary](https://wisequest.home.blog/ai/) | [/learn/ai-insights](https://wisequest.org/learn/ai-insights) | 2025-04-09 |
| [Answering Dr. Todd Phillips: Why God does not allow us to see Him (in this life)?](https://wisequest.home.blog/answering-dr-todd-phillips-why-god-does-not-allow-us-to-see-him-in-this-life/) | [/learn/why-cant-we-see-god](https://wisequest.org/learn/why-cant-we-see-god) | 2026-10-28 |
| [Mosques](https://wisequest.home.blog/area-mosques/) | [/local/mosques](https://wisequest.org/local/mosques) | 2025-08-26 |
| [Brief New Muslim Guide](https://wisequest.home.blog/brief-new-muslim-guide/) | [/new-muslims](https://wisequest.org/new-muslims) | 2023-08-05 |
| [Contact Us](https://wisequest.home.blog/contact/) | [/contact](https://wisequest.org/contact) | 2025-11-24 |
| [Daees Resources](https://wisequest.home.blog/daees-resources/) | [/get-involved/dawah-toolkit](https://wisequest.org/get-involved/dawah-toolkit) | 2026-07-22 |
| [Discover Islam](https://wisequest.home.blog/discover-islam/) | [/resources](https://wisequest.org/resources) | 2025-08-26 |
| [Español](https://wisequest.home.blog/espanol/) | [/es](https://wisequest.org/es) | 2023-03-14 |
| [El Corán: Guía Espiritual y Conocimiento Humano](https://wisequest.home.blog/espanol/700-2/) | [/es](https://wisequest.org/es) | 2025-12-03 |
| [Handouts Quran 101](https://wisequest.home.blog/handouts-quran-101/) | [/local/quran-101/handouts](https://wisequest.org/local/quran-101/handouts) | 2025-05-24 |
| [History](https://wisequest.home.blog/history/) | [/learn/history](https://wisequest.org/learn/history) | 2025-04-09 |
| [Steps to Embrace Islam: A Simple Guide](https://wisequest.home.blog/how-to-become-a-muslim/) | [/become-muslim](https://wisequest.org/become-muslim) | 2026-02-23 |
| [Exploring the truth about Jesus in Islam and Christianity](https://wisequest.home.blog/jesus/) | [/learn/jesus](https://wisequest.org/learn/jesus) | 2025-06-04 |
| [Links and Resources](https://wisequest.home.blog/links-and-resources/) | [/new-muslims](https://wisequest.org/new-muslims) | 2025-08-26 |
| [Explore the Holy Quran](https://wisequest.home.blog/local-info/) | [/local](https://wisequest.org/local) | 2025-06-03 |
| [Get a Free Quran Translation by Mail](https://wisequest.home.blog/local-info/request-quran/) | [/resources/free-quran](https://wisequest.org/resources/free-quran) | 2025-11-24 |
| [Access / Download The Holy Quran and ebooks in Your Preferred Language](https://wisequest.home.blog/media/) | [/resources](https://wisequest.org/resources) | 2026-08-07 |
| [Muhammad](https://wisequest.home.blog/muhammad/) | [/learn/muhammad](https://wisequest.org/learn/muhammad) | 2025-10-26 |
| [Understanding the Mercy of Prophet Muhammad PBUH](https://wisequest.home.blog/muhammad/understanding-the-mercy-of-prophet-muhammad-pbuh/) | [/learn/muhammad/teachings](https://wisequest.org/learn/muhammad/teachings) | 2025-12-03 |
| [New Muslim Guide](https://wisequest.home.blog/new-muslim-guide/) | [/new-muslims](https://wisequest.org/new-muslims) | 2023-08-05 |
| [From Doubt to Faith: Personal Accounts of Discovering Islam](https://wisequest.home.blog/new-muslims-stories/) | [/stories](https://wisequest.org/stories) | 2025-04-09 |
| [The Facts The Mainstream Media Don’t Want You To Know](https://wisequest.home.blog/peace/) | [/learn/palestine](https://wisequest.org/learn/palestine) | 2024-06-16 |
| [Discovering Your Purpose in Life](https://wisequest.home.blog/purpose-of-life/) | [/purpose-of-life](https://wisequest.org/purpose-of-life) | 2025-04-09 |
| [Q&A](https://wisequest.home.blog/qa/) | [/qa](https://wisequest.org/qa) | 2025-08-26 |
| [Understanding Quran: Proof of Divine Revelation](https://wisequest.home.blog/quran/) | [/learn/quran](https://wisequest.org/learn/quran) | 2025-12-03 |
| [Welcome to Islam: A New Muslim’s Toolkit](https://wisequest.home.blog/resources-for-new-muslim/) | [/new-muslims](https://wisequest.org/new-muslims) | 2026-01-20 |
| [How to Pray](https://wisequest.home.blog/salah-prayer-guide/) | [/new-muslims/how-to-pray](https://wisequest.org/new-muslims/how-to-pray) | 2025-03-12 |
| [Supplications](https://wisequest.home.blog/supplications/) | [/new-muslims](https://wisequest.org/new-muslims) | 2023-08-05 |
| [Gender Equality in Islam](https://wisequest.home.blog/women-in-islam/) | [/learn/women](https://wisequest.org/learn/women) | 2025-04-09 |
