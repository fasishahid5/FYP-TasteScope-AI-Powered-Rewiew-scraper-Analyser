const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

// Isolated temp profile so Puppeteer never conflicts with your running Chrome
const getTempProfile = () => {
  const dir = path.join(os.tmpdir(), 'tastescope-puppeteer-profile');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

let _browser = null;
const getBrowser = async () => {
  if (_browser) {
    try { await _browser.version(); return _browser; } catch { _browser = null; }
  }
  _browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    userDataDir: getTempProfile(),
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
      '--disable-infobars',
      '--window-size=1366,900',
      '--lang=en-US',
    ],
    ignoreDefaultArgs: ['--enable-automation'],
  });
  return _browser;
};

// Inject stealth scripts on every new page to avoid bot detection
const stealthify = async (page) => {
  await page.evaluateOnNewDocument(() => {
    // Hide webdriver flag
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    // Fake plugins
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
    // Fake languages
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
    // Fake chrome object
    window.chrome = { runtime: {} };
    // Fake permissions
    const origQuery = window.navigator.permissions && window.navigator.permissions.query;
    if (origQuery) {
      window.navigator.permissions.query = (params) =>
        params.name === 'notifications'
          ? Promise.resolve({ state: Notification.permission })
          : origQuery(params);
    }
  });
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.201 Safari/537.36'
  );
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });
  await page.setViewport({ width: 1366, height: 900 });
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Accept cookie/consent popups
const handleConsent = async (page) => {
  try {
    const accepted = await page.evaluate(() => {
      const btns = [...document.querySelectorAll('button, a')];
      const t = btns.find(el => {
        const txt = (el.innerText || el.textContent || '').toLowerCase().trim();
        return txt === 'accept all' || txt === 'agree' || txt === 'i agree' || txt === 'accept';
      });
      if (t) { t.click(); return true; }
      return false;
    });
    if (accepted) { console.log('[Scraper] Consent accepted'); await sleep(2000); }
  } catch {}
};

// Count reviews visible in DOM
const countReviewsInDOM = (page) => page.evaluate(() => {
  const sels = ['.wiI7pd', '[data-review-id]', '.MyEned', '.rsqaWe'];
  return Math.max(...sels.map(s => document.querySelectorAll(s).length), 0);
});

// Smart scroll that stops when count plateaus
const scrollToLoadReviews = async (page, targetCount = 100) => {
  let lastCount = 0;
  let stale = 0;
  for (let pass = 0; pass < 40; pass++) {
    await page.evaluate(() => {
      const sels = [
        '.m6QErb.DxyBCb.kA9KIf.k7jAl.rqjGif',
        '.m6QErb.DxyBCb.kA9KIf',
        '.m6QErb.DxyBCb',
        '.m6QErb[aria-label]',
        '.m6QErb',
        'div[role="feed"]',
        'div[aria-label*="Reviews"]',
      ];
      for (const s of sels) {
        const el = document.querySelector(s);
        if (el && el.scrollHeight > el.clientHeight + 50) { el.scrollTop += 2000; return; }
      }
      window.scrollBy(0, 1500);
    });
    await sleep(1100);
    const cur = await countReviewsInDOM(page);
    console.log(`[Scraper] Scroll ${pass + 1}: ${cur} reviews`);
    if (cur >= targetCount) break;
    if (cur === lastCount) { stale++; if (stale >= 4) break; } else stale = 0;
    lastCount = cur;
  }
};

const expandReviews = async (page) => {
  try {
    const n = await page.$$eval(
      'button.w8nwRe, button[aria-label*="See more"], .w8nwRe',
      btns => { let c = 0; btns.forEach(b => { try { b.click(); c++; } catch {} }); return c; }
    );
    if (n > 0) await sleep(600);
  } catch {}
};

const extractReviews = async (page) => page.evaluate(() => {
  const found = new Set();

  // Reject Google metadata strings — these look like structured data, not human writing
  const isMetadata = (t) => {
    // Patterns like "Food: 5 Service: 5" or "Order type Dine in Price per person"
    if (/Food:\s*\d|Service:\s*\d|Atmosphere:\s*\d/.test(t)) return true;
    if (/Order type (Dine|Delivery|Takeaway|Drive)/i.test(t)) return true;
    if (/Price per person/i.test(t)) return true;
    if (/Meal type (Breakfast|Lunch|Dinner|Brunch)/i.test(t)) return true;
    if (/Wait time Up to/i.test(t)) return true;
    if (/Group size/i.test(t)) return true;
    // Too many colons + digits = structured data
    const colonDigits = (t.match(/:\s*\d/g) || []).length;
    if (colonDigits >= 2) return true;
    return false;
  };

  const add = (text) => {
    const t = (text || '').replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
    if (t.length >= 25 && t.length <= 2000 && !isMetadata(t)) found.add(t);
  };

  // Primary: actual review text containers
  document.querySelectorAll('.wiI7pd').forEach(el => add(el.innerText));
  document.querySelectorAll('.MyEned span').forEach(el => add(el.innerText));
  document.querySelectorAll('[data-review-id]').forEach(c => {
    c.querySelectorAll('span[dir].wiI7pd, span.wiI7pd').forEach(s => add(s.innerText));
  });
  document.querySelectorAll('div[data-review-id] span[dir]').forEach(el => add(el.innerText));

  return Array.from(found);
});

// Wait for place panel to fully mount, then open Reviews section
const clickReviewsTab = async (page) => {
  // Wait for tabs OR the rating button to appear (whichever comes first)
  try {
    await page.waitForFunction(
      () => document.querySelectorAll('button[role="tab"]').length >= 2
        || [...document.querySelectorAll('button')].some(b => /\d[\d,]* reviews?/i.test(b.innerText || ''))
        || document.querySelector('.F7nice, .UY7F9') !== null,
      { timeout: 20000 }
    );
    await sleep(600);
  } catch {
    console.log('[Scraper] Timed out waiting for place content');
  }

  const tabLabels = await page.evaluate(() =>
    [...document.querySelectorAll('button[role="tab"]')].map(el => el.innerText.replace(/\s+/g,' ').trim())
  );
  console.log(`[Scraper] Tabs: ${JSON.stringify(tabLabels)}`);

  // Strategy 1: Click the "[N] reviews" button in the rating header
  // Works for ALL places regardless of whether they have a Reviews tab
  try {
    const ratingClick = await page.evaluate(() => {
      const all = [...document.querySelectorAll('button, a, span[role="link"], div[role="button"]')];
      const t = all.find(el => /\d[\d,]* reviews?$/i.test((el.innerText || '').trim()));
      if (t) { t.click(); return (t.innerText || '').trim(); }
      return null;
    });
    if (ratingClick) {
      console.log(`[Scraper] Clicked rating button: "${ratingClick}"`);
      await sleep(2500);
      const ok = await page.waitForSelector('.wiI7pd, [data-review-id], .MyEned, .jJc9Ad', { timeout: 8000 })
        .then(() => true).catch(() => false);
      if (ok) { console.log('[Scraper] Reviews loaded via rating button'); return true; }
    }
  } catch {}

  // Strategy 2: "More reviews (N)" button
  try {
    const moreBtn = await page.evaluate(() => {
      const all = [...document.querySelectorAll('button, a')];
      const t = all.find(el => /more reviews/i.test(el.innerText || ''));
      if (t) { t.click(); return (t.innerText || '').trim(); }
      return null;
    });
    if (moreBtn) {
      console.log(`[Scraper] Clicked "${moreBtn}"`);
      await sleep(2500);
      const ok = await page.waitForSelector('.wiI7pd, [data-review-id], .MyEned', { timeout: 8000 })
        .then(() => true).catch(() => false);
      if (ok) { console.log('[Scraper] Reviews loaded via More reviews'); return true; }
    }
  } catch {}

  // Strategy 3: button[role="tab"] whose text includes "review"
  try {
    const tabs = await page.$$('button[role="tab"]');
    for (const tab of tabs) {
      const txt = await tab.evaluate(el =>
        (el.innerText || el.getAttribute('aria-label') || '').replace(/\s+/g,' ').toLowerCase()
      );
      if (txt.includes('review')) {
        await tab.click();
        console.log(`[Scraper] Clicked tab: "${txt}"`);
        await sleep(2500);
        const ok = await page.waitForSelector('.wiI7pd, [data-review-id], .MyEned', { timeout: 8000 })
          .then(() => true).catch(() => false);
        if (ok) { console.log('[Scraper] Reviews loaded via tab'); return true; }
      }
    }
  } catch {}

  // Strategy 4: aria-label="Reviews for X"
  try {
    const el = await page.$('[aria-label*="Reviews for" i]');
    if (el) { await el.click(); await sleep(2500); return true; }
  } catch {}

  // Strategy 5: text-match any element
  try {
    const clicked = await page.evaluate(() => {
      const all = [...document.querySelectorAll('button, [role="tab"], [role="button"]')];
      const t = all.find(el => /^reviews?(\s|\d|$)/i.test((el.innerText || '').trim()));
      if (t) { t.click(); return (t.innerText || '').trim(); }
      return null;
    });
    if (clicked) { console.log(`[Scraper] Text-match: "${clicked}"`); await sleep(2500); return true; }
  } catch {}

  console.log('[Scraper] All strategies exhausted — extracting from current view');
  return false;
};

const scrapeGoogleMapsReviews = async ({ placeId, placeName, address = '' }, maxReviews = 100) => {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await stealthify(page);

    // Build search URL — more reliable than place_id redirect in headless mode
    // Use placeName+address for human-like search, add placeId as hint in query
    const searchQuery = encodeURIComponent(`${placeName} ${address}`.trim());
    const searchUrl = `https://www.google.com/maps/search/${searchQuery}?hl=en`;

    console.log(`[Scraper] Navigating to search: ${searchUrl}`);
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 35000 });
    await sleep(1500);
    await handleConsent(page);
    await sleep(500);

    // Click the best-matching place result (prefer name match over first result)
    const clicked = await page.evaluate((targetName) => {
      const nameLower = (targetName || '').toLowerCase();
      const links = [
        ...document.querySelectorAll('[data-result-index] a[href*="/maps/place/"]'),
        ...document.querySelectorAll('a.hfpxzc[href*="/maps/place/"]'),
        ...document.querySelectorAll('a[href*="/maps/place/"]'),
      ].filter(a =>
        !a.closest('[data-is_ad]') && !a.closest('.CbkFzd') && !a.closest('.sponsoredResult')
      );
      if (!links.length) return false;
      // Find best name match
      const scored = links.map(a => {
        const card = a.closest('[aria-label], .Nv2PK, .bfdHYd') || a;
        const label = (card.getAttribute('aria-label') || card.innerText || a.href || '').toLowerCase();
        // Count how many words of placeName appear in the label
        const words = nameLower.split(/\s+/).filter(Boolean);
        const matches = words.filter(w => label.includes(w)).length;
        return { a, score: matches / words.length };
      });
      scored.sort((a, b) => b.score - a.score);
      const best = scored[0];
      // Only pick a name-matched result if score > 0.5, else fall back to first
      const target = (best && best.score > 0.5) ? best.a : links[0];
      target.click();
      return true;
    }, placeName);

    if (clicked) {
      console.log('[Scraper] Clicked first search result');
      try {
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
      } catch {
        await sleep(4000); // navigation may not fire for panel-only changes
      }
      await sleep(1500);
    } else {
      console.log('[Scraper] No search result found — trying place_id URL');
      // Fallback to place_id URL
      if (placeId) {
        await page.goto(
          `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(placeId)}&hl=en`,
          { waitUntil: 'networkidle2', timeout: 25000 }
        );
        await sleep(3000);
        await handleConsent(page);
      }
    }

    console.log(`[Scraper] On: ${page.url()}`);

    await clickReviewsTab(page);

    // Sort by Newest
    try {
      const sortBtn = await page.$('button[aria-label*="Sort"], button[data-value="sort"]');
      if (sortBtn) {
        await sortBtn.click(); await sleep(800);
        const opts = await page.$$('li[role="menuitemradio"], div[role="menuitem"], li[role="option"]');
        for (const opt of opts) {
          const txt = await opt.evaluate(el => el.innerText.toLowerCase());
          if (txt.includes('newest') || txt.includes('recent')) {
            await opt.click(); await sleep(1500);
            console.log('[Scraper] Sorted by Newest');
            break;
          }
        }
      }
    } catch {}

    await scrollToLoadReviews(page, maxReviews);
    await expandReviews(page);
    await sleep(400);

    const reviews = await extractReviews(page);
    const unique = [...new Set(reviews)].slice(0, maxReviews);
    console.log(`[Scraper] Done: ${unique.length} reviews for "${placeName}"`);
    return unique;
  } catch (err) {
    console.error('[Scraper] Fatal:', err.message);
    return [];
  } finally {
    await page.close().catch(() => {});
  }
};

module.exports = { scrapeGoogleMapsReviews };
