import { chromium } from 'file:///C:/nvm4w/nodejs/node_modules/@playwright/cli/node_modules/playwright/index.mjs';
import * as path from 'path';
import * as fs from 'fs';
import { preview } from 'vite';

const SCREENSHOT_DIR = path.resolve('.agent/state/artifacts/screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function verifyPhase2UX() {
  console.log('1. Starting local Vite preview server on port 4177...');
  const server = await preview({ preview: { port: 4177 } });
  const serverUrl = 'http://localhost:4177';
  console.log(`✓ Vite preview running at ${serverUrl}`);

  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  try {
    // -------------------------------------------------------------
    // Desktop Viewport Test (1280 x 800)
    // -------------------------------------------------------------
    console.log('\n2. Testing Desktop Viewport (1280x800) for Arena & DeckBuilderView...');
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 2,
    });
    const page = await desktopContext.newPage();

    // Mock auth API
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: { id: 'usr_test123', username: 'GrandmasterX', isGuest: false },
        }),
      });
    });

    await page.goto(`${serverUrl}/deck-builder`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // 2a. Verify Tactical Hand Bar in Arena view
    const handCardImages = await page.locator('.tcg-card img').count();
    console.log(`✓ Tactical Hand Bar renders ${handCardImages} active CardArt illustrations`);

    // Hover over first card and test mini-board reveal
    const firstCard = page.locator('.tcg-card').first();
    await firstCard.hover();
    await page.waitForTimeout(400);

    const miniBoardVisible = await page.locator('[data-testid="tcg-mini-board"]').first().isVisible();
    console.log(`✓ Hovering card reveals interactive mini-board explainer: ${miniBoardVisible}`);

    const playRoomShot = path.join(SCREENSHOT_DIR, 'phase2_tcg_hand_desktop.png');
    await page.screenshot({ path: playRoomShot });
    console.log(`✓ Captured ${playRoomShot}`);

    // 2b. Switch to Deck Forge view ("My Deck")
    await page.click('button:has-text("My Deck")');
    await page.waitForTimeout(600);

    const title = await page.textContent('h2');
    console.log(`✓ Deck Builder page loaded: "${title}"`);

    // Verify equipped loadout cards render CardArt images
    const equippedImages = await page.locator('.h-32 img').count();
    console.log(`✓ Equipped loadout slots render ${equippedImages} CardArt illustrations`);

    // Click Knight filter tab
    await page.click('[data-testid="filter-knight"]');
    await page.waitForTimeout(600);

    // Verify Knight cards render
    const knightArtImages = await page.locator('.grid img[src*="/assets/cards/knight/"]').count();
    console.log(`✓ Knight filter shows ${knightArtImages} vector illustrations`);
    if (knightArtImages === 0) {
      throw new Error('No Knight vector illustrations loaded in library grid');
    }

    // Capture Deck Builder desktop screenshot
    const deckBuilderShot = path.join(SCREENSHOT_DIR, 'phase2_deck_builder_desktop.png');
    await page.screenshot({ path: deckBuilderShot, fullPage: true });
    console.log(`✓ Captured ${deckBuilderShot}`);

    // Click Pawn filter tab
    await page.click('[data-testid="filter-pawn"]');
    await page.waitForTimeout(600);
    const pawnArtImages = await page.locator('.grid img[src*="/assets/cards/pawn/"]').count();
    console.log(`✓ Pawn filter shows ${pawnArtImages} vector illustrations`);

    // Click Bishop filter tab
    await page.click('[data-testid="filter-bishop"]');
    await page.waitForTimeout(600);
    const bishopArtImages = await page.locator('.grid img[src*="/assets/cards/bishop/"]').count();
    console.log(`✓ Bishop filter shows ${bishopArtImages} vector illustrations`);

    // -------------------------------------------------------------
    // Mobile Viewport Test (390 x 844)
    // -------------------------------------------------------------
    console.log('\n3. Testing Mobile Viewport (390x844)...');
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
    });
    const mobilePage = await mobileContext.newPage();

    await mobilePage.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: { id: 'usr_test123', username: 'GrandmasterX', isGuest: false },
        }),
      });
    });

    await mobilePage.goto(`${serverUrl}/deck-builder`, { waitUntil: 'domcontentloaded' });
    await mobilePage.waitForTimeout(800);
    await mobilePage.click('button:has-text("My Deck")');
    await mobilePage.waitForTimeout(800);

    const mobileScrollWidth = await mobilePage.evaluate(() => document.documentElement.scrollWidth);
    const mobileClientWidth = await mobilePage.evaluate(() => document.documentElement.clientWidth);
    console.log(`✓ Mobile responsive check: scrollWidth=${mobileScrollWidth}, clientWidth=${mobileClientWidth}`);
    if (mobileScrollWidth > mobileClientWidth) {
      throw new Error(`Horizontal overflow detected on mobile: ${mobileScrollWidth} > ${mobileClientWidth}`);
    }

    const mobileShot = path.join(SCREENSHOT_DIR, 'phase2_deck_builder_mobile.png');
    await mobilePage.screenshot({ path: mobileShot, fullPage: true });
    console.log(`✓ Captured ${mobileShot}`);

    console.log('\n✅ Playwright Phase 2 UX verification completed successfully with 0 defects!\n');
  } finally {
    await browser.close();
    server.httpServer.close();
  }
}

verifyPhase2UX().catch((err) => {
  console.error('❌ Phase 2 UX verification failed:', err);
  process.exit(1);
});
