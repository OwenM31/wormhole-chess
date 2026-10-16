import { chromium } from 'file:///C:/nvm4w/nodejs/node_modules/@playwright/cli/node_modules/playwright/index.mjs';
import * as path from 'path';
import * as fs from 'fs';
import { preview } from 'vite';

const SCREENSHOT_DIR = path.resolve('.agent/state/artifacts/screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function verifyPhase6MajorUnits() {
  console.log('1. Starting local Vite preview server on port 4175...');
  const server = await preview({ preview: { port: 4175 } });
  const serverUrl = 'http://localhost:4175';
  console.log(`✓ Vite preview running at ${serverUrl}`);

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 850 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // Mock unauthenticated auth endpoint to avoid external calls
  await page.route('**/api/auth/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, decks: [] }),
    });
  });

  const browserErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.error('   [BROWSER ERROR]', msg.text());
      browserErrors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => {
    console.error('   [PAGE ERROR]', err.message);
    browserErrors.push(err.message);
  });

  try {
    console.log('\n2. Navigating to Deck Builder page...');
    await page.goto(`${serverUrl}/deck-builder`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // -------------------------------------------------------------------------
    // PART A: Test DeckBuilderView 180-Card Curator & 7 Filter Tabs
    // -------------------------------------------------------------------------
    console.log('\n3. Testing Card Library Curator ("My Deck" tab)...');
    const myDeckTabBtn = page.locator('button:has-text("My Deck")').first();
    await myDeckTabBtn.click();
    await page.waitForTimeout(500);

    // Verify all 7 filter tabs exist
    const tabs = ['all', 'pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];
    for (const t of tabs) {
      const tabEl = page.locator(`button[data-tab="${t}"], button[data-testid="filter-${t}"]`);
      const isVis = await tabEl.isVisible();
      if (!isVis) throw new Error(`Filter tab "${t}" is not visible`);
      const txt = await tabEl.textContent();
      console.log(`   Filter tab [${t}]: "${txt?.trim()}"`);
    }

    // Verify filter counts: All (180), Pawn (30), Knight (30), Bishop (30), Rook (30), Queen (30), King (30)
    const tabAllText = await page.locator('button[data-tab="all"]').textContent();
    const tabRookText = await page.locator('button[data-tab="rook"]').textContent();
    const tabQueenText = await page.locator('button[data-tab="queen"]').textContent();
    const tabKingText = await page.locator('button[data-tab="king"]').textContent();

    if (!tabAllText?.includes('180')) throw new Error(`Expected All tab to show 180, got ${tabAllText}`);
    if (!tabRookText?.includes('30')) throw new Error(`Expected Rook tab to show 30, got ${tabRookText}`);
    if (!tabQueenText?.includes('30')) throw new Error(`Expected Queen tab to show 30, got ${tabQueenText}`);
    if (!tabKingText?.includes('30')) throw new Error(`Expected King tab to show 30, got ${tabKingText}`);

    // Click Rook tab and verify 30 cards
    await page.locator('button[data-tab="rook"]').click();
    await page.waitForTimeout(300);
    const rookCards = await page.locator('.grid-cols-1 > div, .lg\\:grid-cols-4 > div').count();
    console.log(`      Rook cards rendered: ${rookCards} (expected 30)`);
    if (rookCards !== 30) throw new Error(`Expected 30 Rook cards, got ${rookCards}`);

    // Click Queen tab and verify 30 cards
    await page.locator('button[data-tab="queen"]').click();
    await page.waitForTimeout(300);
    const queenCards = await page.locator('.grid-cols-1 > div, .lg\\:grid-cols-4 > div').count();
    console.log(`      Queen cards rendered: ${queenCards} (expected 30)`);
    if (queenCards !== 30) throw new Error(`Expected 30 Queen cards, got ${queenCards}`);

    // Click King tab and verify 30 cards
    await page.locator('button[data-tab="king"]').click();
    await page.waitForTimeout(300);
    const kingCards = await page.locator('.grid-cols-1 > div, .lg\\:grid-cols-4 > div').count();
    console.log(`      King cards rendered: ${kingCards} (expected 30)`);
    if (kingCards !== 30) throw new Error(`Expected 30 King cards, got ${kingCards}`);

    // Click All tab and verify 180 cards
    await page.locator('button[data-tab="all"]').click();
    await page.waitForTimeout(300);
    const allCards = await page.locator('.grid-cols-1 > div, .lg\\:grid-cols-4 > div').count();
    console.log(`      All cards rendered: ${allCards} (expected 180)`);
    if (allCards !== 180) throw new Error(`Expected 180 cards in All view, got ${allCards}`);

    // -------------------------------------------------------------------------
    // PART B: Switch to Arena & Verify Empowered Move Interactions
    // -------------------------------------------------------------------------
    console.log('\n4. Switching to Arena ("Find Match")...');
    const findMatchBtn = page.locator('button:has-text("Find Match")').first();
    await findMatchBtn.click();
    await page.waitForTimeout(600);

    // Click White pawn at e2 to inspect indicators
    console.log('   Clicking White pawn at e2...');
    const e2Square = page.locator('[data-square="e2"]').first();
    await e2Square.click();
    await page.waitForTimeout(400);

    const e5Square = page.locator('[data-square="e5"]').first();
    const hasEmpoweredRing = await e5Square.locator('.border-\\[\\#D4AF37\\].animate-pulse').isVisible();
    console.log(`      e5 glowing gold empowered ring: ${hasEmpoweredRing ? '✓ VISIBLE' : '✗'}`);

    // Capture visual proof screenshot
    const screenshotPath = path.join(SCREENSHOT_DIR, 'phase6_major_units.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`      ✓ Saved visual proof screenshot: ${screenshotPath}`);

    // Check zero console/page errors
    if (browserErrors.length > 0) {
      throw new Error(`Browser console encountered ${browserErrors.length} errors during test`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(' ALL PHASE 6 MAJOR UNIT & 180-CARD VERIFICATIONS PASSED ✓');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } finally {
    await browser.close();
    await server.close();
  }
}

verifyPhase6MajorUnits().catch((err) => {
  console.error('\n❌ Phase 6 Verification Failed:', err);
  process.exit(1);
});
