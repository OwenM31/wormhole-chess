import { chromium } from 'file:///C:/nvm4w/nodejs/node_modules/@playwright/cli/node_modules/playwright/index.mjs';
import * as path from 'path';
import * as fs from 'fs';
import { preview } from 'vite';
import assert from 'assert';

const SCREENSHOT_DIR = path.resolve('.agent/state/artifacts/screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function safeScreenshot(page, destPath) {
  const buf = await page.screenshot();
  for (let i = 0; i < 5; i++) {
    try {
      fs.writeFileSync(destPath, buf);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 400));
    }
  }
  fs.writeFileSync(destPath, buf);
}

async function verifyPhase5UiAndEnergy() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' PHASE 5 E2E UI, LIVE SHOWCASE & ZERO-ENERGY VERIFICATION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const server = await preview({
    preview: { port: 4185 },
  });
  console.log('✓ Vite preview server running on port 4185');

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  try {
    // Mock auth API
    await page.route('**/api/auth/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, decks: [] }),
      });
    });

    // =========================================================================
    // SCENARIO 1: HOME PAGE ZERO-ENERGY & PURGED COPY
    // =========================================================================
    console.log('1. Checking HomePage for zero-energy invariant & purged copy...');
    await page.goto('http://localhost:4185/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    const bodyText = await page.evaluate(() => document.body.innerText);
    assert(!bodyText.includes('ENERGY 3/3'), 'FAIL: ENERGY 3/3 pill still found on HomePage');
    assert(!bodyText.includes('3 energy per turn'), 'FAIL: "3 energy per turn" subtitle text still found on HomePage');
    assert(!bodyText.includes('3 energy'), 'FAIL: "3 energy" text still found on HomePage');
    console.log('   ✓ Zero energy pills or energy subtitle text on HomePage');

    // =========================================================================
    // SCENARIO 2: LIVE 36-CARD SHOWCASE WITH REAL CARDS
    // =========================================================================
    console.log('2. Verifying Live 36-Card Showcase with real PlayingCard components...');
    const showcaseContainer = page.locator('[data-testid="home-showcase-roster"]');
    await showcaseContainer.waitFor({ state: 'visible', timeout: 5000 });

    const cardP2 = page.locator('[data-testid="showcase-card-P2"]');
    const cardN1 = page.locator('[data-testid="showcase-card-N1"]');
    const cardB1 = page.locator('[data-testid="showcase-card-B1"]');
    const cardR1 = page.locator('[data-testid="showcase-card-R1"]');
    const cardQ2 = page.locator('[data-testid="showcase-card-Q2"]');
    const cardK2 = page.locator('[data-testid="showcase-card-K2"]');

    await cardP2.waitFor({ state: 'visible', timeout: 5000 });
    await cardN1.waitFor({ state: 'visible', timeout: 5000 });
    await cardB1.waitFor({ state: 'visible', timeout: 5000 });
    await cardR1.waitFor({ state: 'visible', timeout: 5000 });
    await cardQ2.waitFor({ state: 'visible', timeout: 5000 });
    await cardK2.waitFor({ state: 'visible', timeout: 5000 });

    const p2Text = await cardP2.innerText();
    assert(p2Text.includes('Attack Head On'), 'FAIL: P2 card did not display "Attack Head On"');
    console.log('   ✓ P2 card renders with renamed title "Attack Head On"');

    const n1Text = await cardN1.innerText();
    assert(n1Text.includes('Adrenaline Jump'), 'FAIL: N1 card did not display "Adrenaline Jump"');
    console.log('   ✓ N1 card renders with title "Adrenaline Jump"');

    const r1Text = await cardR1.innerText();
    assert(r1Text.includes('Make Way'), 'FAIL: R1 card did not display "Make Way"');
    console.log('   ✓ R1 card renders with title "Make Way"');

    // Verify vector art images inside cards
    const cardImages = await showcaseContainer.locator('img').count();
    assert(cardImages >= 6, `FAIL: Expected at least 6 card illustration images inside showcase, got ${cardImages}`);
    const firstImgSrc = await showcaseContainer.locator('img').first().getAttribute('src');
    assert(firstImgSrc.includes('/assets/cards/'), `FAIL: Image src does not link to card asset: ${firstImgSrc}`);
    console.log(`   ✓ Showcase renders ${cardImages} vector illustration images linking to canonical SVG assets`);

    // Verify primary CTA reads "Enter Deck Builder Matchmaking →"
    const primaryCta = page.locator('.home-btn-primary');
    const primaryCtaText = await primaryCta.innerText();
    assert(primaryCtaText.includes('Enter Deck Builder Matchmaking'), 'FAIL: Primary CTA does not mention Matchmaking');
    console.log('   ✓ Primary CTA button updated to "Enter Deck Builder Matchmaking →"');

    // Capture desktop showcase screenshot
    await safeScreenshot(page, path.join(SCREENSHOT_DIR, 'phase5_home_desktop_showcase.png'));
    console.log('   ✓ Screenshot captured: phase5_home_desktop_showcase.png');

    // =========================================================================
    // SCENARIO 3: MATCHMAKING RENAME & NAVIGATION
    // =========================================================================
    console.log('3. Navigating to Deck Builder and verifying Matchmaking Stage rename...');
    await primaryCta.click();
    await page.waitForTimeout(600);

    const menuMultiplayerBtn = page.locator('[data-testid="main-menu-multiplayer-btn"]');
    await menuMultiplayerBtn.waitFor({ state: 'visible', timeout: 5000 });
    const menuBtnText = await menuMultiplayerBtn.innerText();
    assert(menuBtnText.includes('Deck Builder Matchmaking · Offline & Online'), 'FAIL: Subtext under Multiplayer button is missing Matchmaking rename');
    console.log('   ✓ Main menu subtext verified: "Deck Builder Matchmaking · Offline & Online"');

    // Click into Matchmaking stage
    await menuMultiplayerBtn.click();
    await page.waitForTimeout(600);

    const matchmakingTitle = page.locator('[data-testid="matchmaking-lobby-title"]');
    await matchmakingTitle.waitFor({ state: 'visible', timeout: 5000 });
    const titleText = await matchmakingTitle.innerText();
    assert(titleText.includes('Deck Builder Matchmaking'), 'FAIL: Stage breadcrumb title does not read Deck Builder Matchmaking');
    console.log('   ✓ Stage breadcrumb header verified: "Deck Builder Matchmaking"');

    // Verify character backdrop stage is rendered with warm styling
    const backdropStage = page.locator('[data-testid="character-backdrop-stage"]');
    await backdropStage.waitFor({ state: 'visible', timeout: 5000 });
    const backdropText = await backdropStage.innerText();
    assert(backdropText.toUpperCase().includes('MATCHMAKING ROOM'), 'FAIL: Backdrop does not mention Matchmaking Room');
    console.log('   ✓ Character backdrop subtitle verified: "Living Hero · Matchmaking Room"');

    // Capture matchmaking stage screenshot
    await safeScreenshot(page, path.join(SCREENSHOT_DIR, 'phase5_matchmaking_stage.png'));
    console.log('   ✓ Screenshot captured: phase5_matchmaking_stage.png');

    // =========================================================================
    // SCENARIO 4: MOBILE RESPONSIVENESS (375x667)
    // =========================================================================
    console.log('4. Verifying mobile viewport (375x667) horizontal overflow...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:4185/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    const homeOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth + 1;
    });
    assert(!homeOverflow, 'FAIL: Horizontal scroll overflow detected on mobile HomePage');
    console.log('   ✓ Mobile HomePage has zero horizontal overflow (375px)');

    await page.goto('http://localhost:4185/deck-builder', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    const deckOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth + 1;
    });
    assert(!deckOverflow, 'FAIL: Horizontal scroll overflow detected on mobile Deck Builder');
    console.log('   ✓ Mobile Deck Builder Main Menu has zero horizontal overflow (375px)');

    await safeScreenshot(page, path.join(SCREENSHOT_DIR, 'phase5_mobile_home.png'));
    console.log('   ✓ Screenshot captured: phase5_mobile_home.png');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(' ALL PHASE 5 VERIFICATION ASSERTIONS PASSED (4/4 SCENARIOS)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } finally {
    await browser.close();
    await server.close();
  }
}

verifyPhase5UiAndEnergy()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Phase 5 Verification Failed:', err);
    process.exit(1);
  });
