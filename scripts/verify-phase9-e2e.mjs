import { chromium } from 'file:///C:/nvm4w/nodejs/node_modules/@playwright/cli/node_modules/playwright/index.mjs';
import * as path from 'path';
import * as fs from 'fs';
import { preview } from 'vite';
import assert from 'assert';

const SCREENSHOT_DIR = path.resolve('.agent/state/phases/9');
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

async function verifyPhase9E2E() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' PHASE 9 E2E BROWSER: MOVE STREAM & DESKTOP 2-COLUMN TABLE REWIND');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const server = await preview({
    preview: { port: 4199 },
  });
  console.log('✓ Vite preview server running on port 4199');

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 375, height: 667 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.error(`   [Browser Error] ${msg.text()}`);
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
    console.error(`   [Page Error] ${err.message}`);
  });

  try {
    // Mock API endpoints
    await page.route('**/api/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, decks: [] }),
      });
    });

    // =========================================================================
    // SCENARIO 1: MOBILE VIEWPORT (375x667)
    // =========================================================================
    console.log('1. Navigating to /deck-builder on Mobile Viewport (375x667)...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:4199/deck-builder', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    // Enter match
    const mpBtn = page.locator('[data-testid="main-menu-multiplayer-btn"]');
    await mpBtn.click();
    await page.waitForTimeout(600);

    const offlineStageBtn = page.locator('[data-testid="stage-offline-match-btn"]');
    await offlineStageBtn.click();
    await page.waitForTimeout(400);

    const startOfflineBtn = page.locator('[data-testid="start-offline-match-btn"]');
    await startOfflineBtn.click();
    await page.waitForTimeout(1000);

    // Verify chessboard and mobile move stream container
    const chessboard = page.locator('[data-testid="chessboard-grid"]');
    assert(await chessboard.isVisible(), 'FAIL: chessboard-grid is not visible');
    console.log('   ✓ Chessboard mounted successfully in Arena');

    const mobileStream = page.locator('[data-testid="move-stream-mobile"]');
    assert(await mobileStream.isVisible(), 'FAIL: move-stream-mobile is not visible on mobile');
    console.log('   ✓ <MoveStreamMobile /> is visible on mobile (< lg)');

    // Play 1. e4 and wait for AI bot to make Black's reply
    console.log('   Executing move 1. e4 and awaiting AI bot reply...');
    await page.evaluate(() => {
      window.__DECK_CHESS_GAME__.makeMove('e2', 'e4');
    });
    await page.waitForFunction(
      () => window.__DECK_CHESS_GAME__.getRecordedTurns().length >= 2,
      { timeout: 6000 }
    );
    await page.waitForTimeout(300);

    // Verify scroll position on mobile: window.scrollY === 0
    const scrollY = await page.evaluate(() => window.scrollY);
    assert(scrollY === 0, `FAIL: Expected window.scrollY === 0, got ${scrollY}`);
    console.log(`   ✓ Mobile scroll anchored without page jumping (window.scrollY === ${scrollY})`);

    // Verify move stream items appear
    const turns = await page.evaluate(() => window.__DECK_CHESS_GAME__.getRecordedTurns());
    const blackMoveSan = turns[1].san;
    const moveText = await mobileStream.innerText();
    assert(moveText.includes('1. e4'), `FAIL: Move stream does not contain "1. e4" (got: "${moveText}")`);
    assert(moveText.includes(blackMoveSan), `FAIL: Move stream does not contain "${blackMoveSan}" (got: "${moveText}")`);
    console.log(`   ✓ Move stream rendered notation "1. e4" and "${blackMoveSan}"`);

    // Test stepping backward (‹)
    console.log('   Testing step backward (‹) to Move 1 (1. e4)...');
    const prevBtn = page.locator('[data-testid="stream-prev-btn"]');
    assert(await prevBtn.isEnabled(), 'FAIL: stream-prev-btn should be enabled after moves');
    await prevBtn.click();
    await page.waitForTimeout(300);

    // Verify viewing history banner is visible on the board
    const historyBanner = page.locator('[data-testid="viewing-history-banner"]');
    assert(await historyBanner.isVisible(), 'FAIL: viewing-history-banner should be visible while viewing history');
    console.log('   ✓ Viewing history banner displayed on board');

    // Verify state: activeMoveIndex is 0
    const activeIndex1 = await page.evaluate(() => window.__DECK_CHESS_GAME__.getActiveMoveIndex());
    assert(activeIndex1 === 0, `FAIL: Expected activeMoveIndex === 0 after 1 step back, got ${activeIndex1}`);
    console.log('   ✓ Stepped backward to move index 0');

    // Step backward again to starting board (index -1)
    await prevBtn.click();
    await page.waitForTimeout(300);
    const activeIndexStart = await page.evaluate(() => window.__DECK_CHESS_GAME__.getActiveMoveIndex());
    assert(activeIndexStart === -1, `FAIL: Expected activeMoveIndex === -1, got ${activeIndexStart}`);
    console.log('   ✓ Stepped backward to starting position (index -1)');

    // Step forward (›)
    console.log('   Testing step forward (›) back to latest move...');
    const nextBtn = page.locator('[data-testid="stream-next-btn"]');
    assert(await nextBtn.isEnabled(), 'FAIL: stream-next-btn should be enabled while viewing history');
    await nextBtn.click(); // to index 0
    await page.waitForTimeout(200);
    await nextBtn.click(); // to index 1 (Live)
    await page.waitForTimeout(300);

    const isLive = await page.evaluate(() => !window.__DECK_CHESS_GAME__.isViewingHistory());
    assert(isLive, 'FAIL: Expected return to Live after stepping to latest move');
    console.log('   ✓ Stepped forward back to Live mode');

    const mobileScreenshot = path.join(SCREENSHOT_DIR, 'phase9_mobile_move_stream.png');
    await safeScreenshot(page, mobileScreenshot);
    console.log('   ✓ Saved mobile screenshot: phase9_mobile_move_stream.png');

    // =========================================================================
    // SCENARIO 2: DESKTOP VIEWPORT (1280x800)
    // =========================================================================
    console.log('\n2. Switching to Desktop Viewport (1280x800)...');
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(600);

    const moveTable = page.locator('[data-testid="move-table-desktop"]');
    assert(await moveTable.isVisible(), 'FAIL: move-table-desktop is not visible on desktop');
    console.log('   ✓ <MoveTableDesktop /> is visible in Right Column on desktop (>= lg)');

    // Play Move 2. d4 on desktop
    console.log('   Playing Move 2. d4 on desktop...');
    await page.evaluate(() => {
      window.__DECK_CHESS_GAME__.makeMove('d2', 'd4');
    });
    await page.waitForTimeout(300);

    // Verify table headers: Turn, White, Black and move cells
    const tableText = await moveTable.innerText();
    assert(tableText.includes('TURN'), 'FAIL: Move table missing TURN header');
    assert(tableText.includes('WHITE'), 'FAIL: Move table missing WHITE header');
    assert(tableText.includes('BLACK'), 'FAIL: Move table missing BLACK header');
    assert(tableText.includes('e4'), 'FAIL: Move table missing "e4"');
    assert(tableText.includes('d4'), 'FAIL: Move table missing "d4"');
    console.log('   ✓ 2-column table headers (Turn | White | Black) and move rows confirmed');

    // Test cell-by-cell clicking: Jump to Move 1 (e4)
    console.log('   Clicking cell for Move 1 (e4)...');
    const move1Btn = page.locator('[data-testid="move-table-desktop"] button:has-text("e4")');
    await move1Btn.click();
    await page.waitForTimeout(300);

    const activeIndexClick = await page.evaluate(() => window.__DECK_CHESS_GAME__.getActiveMoveIndex());
    assert(activeIndexClick === 0, `FAIL: Expected activeMoveIndex === 0 after clicking e4 cell, got ${activeIndexClick}`);
    console.log('   ✓ Clicked Move 1 cell: jumped to move index 0');

    // Verify cell-by-cell green highlight box styling
    const isCellHighlighted = await move1Btn.evaluate((el) => {
      return el.className.includes('border-[#3FB950]') || el.className.includes('bg-[#3FB950]/20');
    });
    assert(isCellHighlighted, 'FAIL: Move 1 cell should have #3FB950 green highlight border');
    console.log('   ✓ Active move cell displays tactical green (#3FB950) highlight border');

    // Test read-only guard: board clicks do not execute moves while viewing history
    const sqD2 = page.locator('[data-testid="square-d2"]');
    if (await sqD2.isVisible()) {
      await sqD2.click();
      await page.waitForTimeout(200);
      const activeAfterClick = await page.evaluate(() => window.__DECK_CHESS_GAME__.getActiveMoveIndex());
      assert(activeAfterClick === 0, 'FAIL: Board click while viewing history should be read-only');
      console.log('   ✓ Read-only guard confirmed: board clicks do not mutate history');
    }

    // Test keyboard ArrowRight navigation
    console.log('   Testing keyboard navigation (ArrowRight)...');
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);

    const activeIndexAfterKey = await page.evaluate(() => window.__DECK_CHESS_GAME__.getActiveMoveIndex());
    assert(activeIndexAfterKey === 1, `FAIL: Expected activeMoveIndex === 1 after ArrowRight, got ${activeIndexAfterKey}`);
    console.log('   ✓ ArrowRight stepped forward to move index 1');

    // Test Return to Live button in table bottom transport bar
    const tableLiveBtn = page.locator('[data-testid="table-live-btn"]');
    assert(await tableLiveBtn.isVisible(), 'FAIL: table-live-btn is not visible');
    await tableLiveBtn.click();
    await page.waitForTimeout(300);

    const isLiveAfterClick = await page.evaluate(() => !window.__DECK_CHESS_GAME__.isViewingHistory());
    assert(isLiveAfterClick, 'FAIL: table-live-btn did not restore Live mode');
    console.log('   ✓ [ LIVE ] transport button restored Live state');

    const desktopScreenshot = path.join(SCREENSHOT_DIR, 'phase9_desktop_move_table.png');
    await safeScreenshot(page, desktopScreenshot);
    console.log('   ✓ Saved desktop screenshot: phase9_desktop_move_table.png');

    // Verify 0 uncaught errors
    const fatalErrors = consoleErrors.filter(
      (e) => !e.includes('favicon') && !e.includes('WebSocket') && !e.includes('404')
    );
    assert(fatalErrors.length === 0, `FAIL: Uncaught console errors: ${fatalErrors.join(', ')}`);
    console.log('   ✓ 0 uncaught console or runtime errors');

    console.log('\n======================================================');
    console.log(' Phase 9 E2E Verification PASSED (Mobile + Desktop)');
    console.log('======================================================\n');
  } finally {
    await browser.close();
    await server.close();
  }
}

verifyPhase9E2E().catch((err) => {
  console.error('\n❌ E2E VERIFICATION FAILED:', err);
  process.exit(1);
});
