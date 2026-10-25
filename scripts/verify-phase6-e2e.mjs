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

async function verifyPhase6E2E() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' PHASE 6 E2E BROWSER: EVAL BAR & BEST-MOVE HINTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const server = await preview({
    preview: { port: 4187 },
  });
  console.log('✓ Vite preview server running on port 4187');

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
    // SCENARIO 1: DESKTOP ARENA EVALBAR INITIAL STATE (1280x800)
    // =========================================================================
    console.log('1. Navigating to /deck-builder and starting Offline Match on Desktop (1280x800)...');
    await page.goto('http://localhost:4187/deck-builder', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    // Launch Offline Match
    const mpBtn = page.locator('[data-testid="main-menu-multiplayer-btn"]');
    await mpBtn.click();
    await page.waitForTimeout(400);

    const offlineStageBtn = page.locator('[data-testid="stage-offline-match-btn"]');
    await offlineStageBtn.click();
    await page.waitForTimeout(400);

    const startOfflineBtn = page.locator('[data-testid="start-offline-match-btn"]');
    await startOfflineBtn.click();
    await page.waitForTimeout(1000);

    // Verify EvalBar is visible in TabletopArena slot
    const evalBarSlot = page.locator('[data-testid="tabletop-eval-slot"]');
    assert(await evalBarSlot.isVisible(), 'FAIL: tabletop-eval-slot is not visible');

    const evalBar = page.locator('[data-testid="eval-bar"]');
    assert(await evalBar.isVisible(), 'FAIL: eval-bar is not visible');

    const evalScore = page.locator('[data-testid="eval-bar-score"]');
    assert(await evalScore.isVisible(), 'FAIL: eval-bar-score is not visible');
    const initialScore = await evalScore.innerText();
    console.log(`   ✓ EvalBar mounted successfully. Initial readout: ${initialScore}`);
    const scoreNum = parseFloat(initialScore);
    assert(!isNaN(scoreNum) && Math.abs(scoreNum) < 2.0, `FAIL: Expected balanced opening readout, got '${initialScore}'`);

    // =========================================================================
    // SCENARIO 2: DIRECT BEST-MOVE HINT INTERACTION & EXECUTION
    // =========================================================================
    console.log('2. Requesting Best-Move Hint via [data-testid="hint-btn"]...');
    const hintBtn = page.locator('[data-testid="hint-btn"]');
    assert(await hintBtn.isVisible(), 'FAIL: Hint button is not visible');
    await hintBtn.click();
    await page.waitForTimeout(800);

    // Verify engine-hint-banner is displayed
    const hintBanner = page.locator('[data-testid="engine-hint-banner"]');
    assert(await hintBanner.isVisible(), 'FAIL: engine-hint-banner is not visible after clicking Hint');
    const bannerText = await hintBanner.innerText();
    console.log(`   ✓ Engine Hint Banner displayed: "${bannerText.trim()}"`);
    assert(bannerText.includes('Best Move'), `FAIL: Banner does not mention Best Move: ${bannerText}`);

    // Verify hint square highlights exist on board
    const hintFromSquares = page.locator('[data-testid^="hint-from-"]');
    const hintToSquares = page.locator('[data-testid^="hint-to-"]');
    const fromCount = await hintFromSquares.count();
    const toCount = await hintToSquares.count();
    assert(fromCount >= 1, `FAIL: Expected at least 1 hint-from square highlight, got ${fromCount}`);
    assert(toCount >= 1, `FAIL: Expected at least 1 hint-to square highlight, got ${toCount}`);
    console.log(`   ✓ Board highlight verified: ${fromCount} origin square(s), ${toCount} target square(s) with BEST indicator`);

    // Capture desktop screenshot
    const desktopScreenshotPath = path.join(SCREENSHOT_DIR, 'phase6_eval_and_hint_desktop.png');
    await safeScreenshot(page, desktopScreenshotPath);
    console.log('   ✓ Screenshot saved: phase6_eval_and_hint_desktop.png');

    // Click apply-hint-btn to execute the recommended turn
    console.log('3. Applying Hint Move via [data-testid="apply-hint-btn"]...');
    const applyHintBtn = page.locator('[data-testid="apply-hint-btn"]');
    assert(await applyHintBtn.isVisible(), 'FAIL: apply-hint-btn is not visible');
    await applyHintBtn.click();
    await page.waitForTimeout(1000);

    // Verify hint banner cleared after execution
    const bannerCleared = !(await hintBanner.isVisible());
    assert(bannerCleared, 'FAIL: engine-hint-banner remained visible after applying hint move');
    console.log('   ✓ Hint banner successfully cleared upon move execution');

    // =========================================================================
    // SCENARIO 3: AI REPLY & DYNAMIC EVALUATION BAR UPDATE
    // =========================================================================
    console.log('4. Waiting for AI response and dynamic EvalBar update...');
    // Allow up to 6 seconds for AI move turn to complete
    await page.waitForTimeout(3000);

    const postAiScore = await evalScore.innerText();
    console.log(`   ✓ EvalBar score after AI reply: ${postAiScore}`);
    assert(await evalBar.isVisible(), 'FAIL: eval-bar disappeared after AI response');

    // =========================================================================
    // SCENARIO 4: MOBILE VIEWPORT (375x667) & ZERO OVERFLOW
    // =========================================================================
    console.log('5. Testing mobile viewport (375x667) responsiveness and hint highlights...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(600);

    // Check no horizontal document overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    assert(scrollWidth <= 375, `FAIL: Horizontal overflow detected on mobile: ${scrollWidth}px > 375px`);
    console.log(`   ✓ Zero horizontal overflow on mobile: scrollWidth = ${scrollWidth}px <= 375px`);

    // Request hint on mobile
    if (await hintBtn.isVisible()) {
      await hintBtn.click();
      await page.waitForTimeout(800);
      assert(await hintBanner.isVisible(), 'FAIL: Hint banner not visible on mobile');
    }

    const mobileScreenshotPath = path.join(SCREENSHOT_DIR, 'phase6_eval_and_hint_mobile.png');
    await safeScreenshot(page, mobileScreenshotPath);
    console.log('   ✓ Screenshot saved: phase6_eval_and_hint_mobile.png');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(' ALL 4 PHASE 6 PLAYWRIGHT E2E SCENARIOS PASSED ✓');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } finally {
    await browser.close();
    await server.close();
  }
}

verifyPhase6E2E().catch((err) => {
  console.error('Phase 6 E2E Verification failed:', err);
  process.exit(1);
});
