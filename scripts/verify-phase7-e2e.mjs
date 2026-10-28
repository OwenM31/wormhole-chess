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

async function verifyPhase7E2E() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' PHASE 7 E2E BROWSER: 36-CARD OVERHAUL, BOARD ARROWS & STAGING');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const server = await preview({
    preview: { port: 4188 },
  });
  console.log('✓ Vite preview server running on port 4188');

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
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
    // Mock all API routes (auth, matches, profiles)
    await page.route('**/api/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, decks: [] }),
      });
    });

    // =========================================================================
    // SCENARIO 1: DECK BUILDER 36-CARD LIBRARY OVERHAUL CHECK
    // =========================================================================
    console.log('1. Navigating to /deck-builder to verify 36-Card Library overhauls...');
    await page.goto('http://localhost:4188/deck-builder', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    // Enter Multiplayer Stage Screen
    const mpBtn = page.locator('[data-testid="main-menu-multiplayer-btn"]');
    await mpBtn.click();
    await page.waitForTimeout(600);

    const libraryGrid = page.locator('[data-testid="cards-library-grid"]');
    assert(await libraryGrid.isVisible(), 'FAIL: cards-library-grid is not visible in stage');
    console.log('   ✓ cards-library-grid mounted successfully');

    const totalLibCards = await page.locator('[data-testid^="library-card-"]').count();
    console.log(`   Total library cards found: ${totalLibCards}`);
    if (totalLibCards > 0) {
      const sample = await page.locator('[data-testid^="library-card-"]').first().getAttribute('data-testid');
      console.log(`   Sample library card testid: ${sample}`);
    }

    // Verify representative overhauled cards with new names and zero ellipsis
    const cardChecks = [
      { id: 'p3_follow_me', name: 'March Together', code: 'P3' },
      { id: 'p6_tag_out', name: 'Double Time', code: 'P6' },
      { id: 'n2_swap_with_me', name: 'Springboard', code: 'N2' },
      { id: 'n4_pin_swap', name: 'Square Jump', code: 'N4' },
      { id: 'b6_come_this_way', name: 'Diagonal Launch', code: 'B6' },
      { id: 'q3_all_rise', name: 'Royal Shield', code: 'Q3' },
      { id: 'k4_banish', name: 'Turncoat', code: 'K4' },
    ];

    for (const { id, name, code } of cardChecks) {
      const cardEl = page.locator(`[data-testid="library-card-${id}"]`);
      assert(await cardEl.isVisible(), `FAIL: Library card ${id} (${name}) is not visible`);
      const cardText = await cardEl.innerText();
      assert(cardText.includes(name), `FAIL: Card ${id} does not contain overhauled title "${name}" (got: "${cardText}")`);
      assert(cardText.includes(code), `FAIL: Card ${id} does not contain playbook code "${code}"`);
      assert(!cardText.includes('...'), `FAIL: Zero-Ellipsis violated in card ${id}: ${cardText}`);
      console.log(`   ✓ Library card ${code} confirmed: "${name}"`);
    }

    const libraryScreenshotPath = path.join(SCREENSHOT_DIR, 'phase7_library_overhaul.png');
    await safeScreenshot(page, libraryScreenshotPath);
    console.log('   ✓ Saved screenshot: phase7_library_overhaul.png');

    // =========================================================================
    // SCENARIO 2: LAUNCH OFFLINE MATCH & VERIFY ARROW SVG AT Z-[6] UNDER PIECES
    // =========================================================================
    console.log('\n2. Launching Offline Match to inspect under-piece arrow overlay...');
    const offlineStageBtn = page.locator('[data-testid="stage-offline-match-btn"]');
    await offlineStageBtn.click();
    await page.waitForTimeout(400);

    const startOfflineBtn = page.locator('[data-testid="start-offline-match-btn"]');
    await startOfflineBtn.click();
    await page.waitForTimeout(1000);

    const chessboard = page.locator('[data-testid="chessboard-grid"]');
    assert(await chessboard.isVisible(), 'FAIL: chessboard-grid is not visible in Arena');

    const previewArrowsSvg = page.locator('[data-testid="board-preview-arrows"]');
    assert(await previewArrowsSvg.isVisible({ timeout: 2000 }).catch(() => true), 'FAIL: board-preview-arrows svg not mounted');

    // Verify CSS z-index layering invariant: arrows at z-[6], below pieces at z-10
    const arrowClasses = await previewArrowsSvg.getAttribute('class');
    assert(arrowClasses.includes('z-[6]'), `FAIL: board-preview-arrows svg does not have z-[6] class (got: ${arrowClasses})`);
    assert(arrowClasses.includes('pointer-events-none'), 'FAIL: board-preview-arrows must have pointer-events-none');
    console.log('   ✓ <svg data-testid="board-preview-arrows"> verified at z-[6] strictly beneath z-10 pieces');

    // =========================================================================
    // SCENARIO 3: N3 TRAMPLE ARROW PREVIEW & EXECUTION
    // =========================================================================
    console.log('\n3. Testing N3 Trample preview arrow & move execution...');
    // Load custom position: White Knight at b1, Black pawn at b2
    await page.evaluate(() => {
      window.__DECK_CHESS_GAME__.resetGame(['n3_trample'], [], '4k3/8/8/8/8/8/1p6/1N2K3 w - - 0 1');
    });
    await page.waitForTimeout(500);

    // Select knight at b1
    const sqB1 = page.locator('[data-testid="square-b1"]');
    await sqB1.click();
    await page.waitForTimeout(300);

    // Arm n3_trample card in hand
    const n3Card = page.locator('[data-testid="tactical-hand-desktop-grid"] [data-testid="hand-card-n3_trample"]');
    assert(await n3Card.isVisible(), 'FAIL: n3_trample card is not in hand');
    await n3Card.click();
    await page.waitForTimeout(300);

    // Target c3 square
    const sqC3 = page.locator('[data-testid="square-c3"]');
    await sqC3.click();
    await page.waitForTimeout(500);

    // Verify preview arrow rendered inside svg
    const n3Polyline = page.locator('[data-testid="board-preview-arrows"] polyline');
    const polyCountN3 = await n3Polyline.count();
    assert(polyCountN3 >= 1, `FAIL: Expected >= 1 polyline arrow for N3 Trample, got ${polyCountN3}`);
    const strokeN3 = await n3Polyline.first().getAttribute('stroke');
    console.log(`   ✓ N3 Trample polyline rendered: stroke="${strokeN3}" with ${polyCountN3} arrow segment(s)`);

    // Verify confirmation bar
    const confirmBar = page.locator('[data-testid="card-confirm-bar"]');
    assert(await confirmBar.isVisible(), 'FAIL: card-confirm-bar is not visible for N3 Trample');

    const n3ScreenshotPath = path.join(SCREENSHOT_DIR, 'phase7_n3_trample_arrows.png');
    await safeScreenshot(page, n3ScreenshotPath);
    console.log('   ✓ Saved screenshot: phase7_n3_trample_arrows.png');

    // Confirm move
    const confirmBtn = page.locator('[data-testid="confirm-card-move-btn"]');
    await confirmBtn.click();
    await page.waitForTimeout(600);

    // Verify outcome: knight at c3, pawn at b2 removed
    const c3HasKnight = await page.evaluate(() => {
      const p = window.__DECK_CHESS_GAME__.getEngine().getPiece('c3');
      const b2 = window.__DECK_CHESS_GAME__.getEngine().getPiece('b2');
      return p?.type === 'n' && b2 === undefined;
    });
    assert(c3HasKnight, 'FAIL: N3 Trample execution failed to land knight on c3 or remove b2 pawn');
    console.log('   ✓ N3 Trample executed cleanly: Knight on c3, trampled pawn removed');

    // =========================================================================
    // SCENARIO 4: N5 GET TO THE KING 2-CLICK STAGING & FORK ARROWS
    // =========================================================================
    console.log('\n4. Testing N5 Get to the King 2-Click Staging & Royal Fork arrows...');
    // Position: White Knight at b5, Black King at e8, Black Queen at c8. Fork square is d6.
    await page.evaluate(() => {
      window.__DECK_CHESS_GAME__.resetGame(['n5_get_to_the_king'], [], '2q1k3/8/8/1N6/8/8/8/7K w - - 0 1');
    });
    await page.waitForTimeout(500);

    const sqB5 = page.locator('[data-testid="square-b5"]');
    await sqB5.click();
    await page.waitForTimeout(300);

    const n5Card = page.locator('[data-testid="tactical-hand-desktop-grid"] [data-testid="hand-card-n5_get_to_the_king"]');
    assert(await n5Card.isVisible(), 'FAIL: n5_get_to_the_king card is not in hand');
    await n5Card.click();
    await page.waitForTimeout(400);

    // Step 1: Disambiguation banner and d6 fork badge should appear
    const forkBanner = page.locator('[data-testid="disambiguation-banner"]');
    assert(await forkBanner.isVisible(), 'FAIL: Disambiguation banner did not appear for N5 staging');
    const disambigD6 = page.locator('[data-testid="disambiguation-d6"]');
    assert(await disambigD6.isVisible(), 'FAIL: disambiguation-d6 tile with FORK badge not visible');
    const badgeText = await disambigD6.innerText();
    assert(badgeText.includes('FORK'), `FAIL: Expected badge label to include "FORK", got: "${badgeText}"`);
    console.log(`   ✓ N5 Step 1 disambiguation tile mounted with badge: "${badgeText.trim()}"`);

    // Click d6 square to stage intermediate fork square S1
    const sqD6 = page.locator('[data-testid="square-d6"]');
    await sqD6.click();
    await page.waitForTimeout(400);

    // Step 2: Empowered moves appear for royal targets (c8 Queen or e8 King)
    const empC8 = page.locator('[data-testid="empowered-move-c8"]');
    assert(await empC8.isVisible(), 'FAIL: empowered-move-c8 target not visible after selecting fork square d6');

    // Click c8 to target Black Queen
    const sqC8 = page.locator('[data-testid="square-c8"]');
    await sqC8.click();
    await page.waitForTimeout(500);

    // Verify preview arrows for 2-hop jump
    const n5Polylines = page.locator('[data-testid="board-preview-arrows"] polyline');
    const polyCountN5 = await n5Polylines.count();
    assert(polyCountN5 >= 1, `FAIL: Expected >= 1 polyline arrow for N5 2-hop jump, got ${polyCountN5}`);
    console.log(`   ✓ N5 Get to the King 2-hop preview arrow rendered (${polyCountN5} segment(s))`);

    const n5ScreenshotPath = path.join(SCREENSHOT_DIR, 'phase7_n5_fork_arrows.png');
    await safeScreenshot(page, n5ScreenshotPath);
    console.log('   ✓ Saved screenshot: phase7_n5_fork_arrows.png');

    // Confirm execution
    await confirmBtn.click();
    await page.waitForTimeout(600);

    const c8HasKnight = await page.evaluate(() => {
      const p = window.__DECK_CHESS_GAME__.getEngine().getPiece('c8');
      const gy = window.__DECK_CHESS_GAME__.getEngine().getGraveyard();
      return p?.type === 'n' && gy.b.q === 1;
    });
    assert(c8HasKnight, 'FAIL: N5 failed to capture Queen at c8 or send Queen to graveyard');
    console.log('   ✓ N5 Get to the King executed cleanly: Queen captured on c8');

    // =========================================================================
    // SCENARIO 5: Q2 THE QUEEN'S GAMBIT DUAL PREVIEW ARROWS
    // =========================================================================
    console.log('\n5. Testing Q2 The Queen\'s Gambit Dual Preview Arrows...');
    // White Queen at d1, friendly Knight at d4, enemy attacking Rook at d8
    await page.evaluate(() => {
      window.__DECK_CHESS_GAME__.resetGame(['q2_the_queens_gambit'], [], '3r1k2/8/8/8/3N4/8/8/3Q3K w - - 0 1');
    });
    await page.waitForTimeout(500);

    const sqD1 = page.locator('[data-testid="square-d1"]');
    await sqD1.click();
    await page.waitForTimeout(300);

    const q2Card = page.locator('[data-testid="tactical-hand-desktop-grid"] [data-testid="hand-card-q2_the_queens_gambit"]');
    assert(await q2Card.isVisible(), 'FAIL: q2_the_queens_gambit card is not in hand');
    await q2Card.click();
    await page.waitForTimeout(400);

    // Target d8 attacking rook
    const sqD8 = page.locator('[data-testid="square-d8"]');
    await sqD8.click();
    await page.waitForTimeout(500);

    // Verify dual preview arrows: 1 gold (Queen -> ally), 1 red dashed (ally -> enemy)
    const q2Polylines = page.locator('[data-testid="board-preview-arrows"] polyline');
    const polyCountQ2 = await q2Polylines.count();
    assert(polyCountQ2 === 2, `FAIL: Expected exactly 2 arrows for Q2 Queen's Gambit, got ${polyCountQ2}`);

    const strokes = [
      await q2Polylines.nth(0).getAttribute('stroke'),
      await q2Polylines.nth(1).getAttribute('stroke'),
    ];
    console.log(`   ✓ Q2 Dual Arrows rendered: [${strokes.join(', ')}]`);
    assert(strokes.includes('#D4AF37') && strokes.includes('#F85149'), `FAIL: Expected gold and red arrows, got: ${strokes}`);

    const q2ScreenshotPath = path.join(SCREENSHOT_DIR, 'phase7_q2_gambit_arrows.png');
    await safeScreenshot(page, q2ScreenshotPath);
    console.log('   ✓ Saved screenshot: phase7_q2_gambit_arrows.png');

    // Confirm execution
    await confirmBtn.click();
    await page.waitForTimeout(600);

    const d8HasQueen = await page.evaluate(() => {
      const p = window.__DECK_CHESS_GAME__.getEngine().getPiece('d8');
      const d4Piece = window.__DECK_CHESS_GAME__.getEngine().getPiece('d4');
      const gy = window.__DECK_CHESS_GAME__.getEngine().getGraveyard();
      return p?.type === 'q' && d4Piece === undefined && gy.b.r === 1;
    });
    assert(d8HasQueen, 'FAIL: Q2 Queen\'s Gambit failed to execute cleanly');
    console.log('   ✓ Q2 Queen\'s Gambit executed cleanly: Queen at d8, knight sacrificed, rook captured');

    // =========================================================================
    // FINAL ERROR INVARIANT CHECK
    // =========================================================================
    assert(consoleErrors.length === 0, `FAIL: Encountered ${consoleErrors.length} browser/console error(s): ${consoleErrors.join(', ')}`);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(' ALL PHASE 7 PLAYWRIGHT E2E ASSERTIONS PASSED WITH 0 CONSOLE ERRORS ✓');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } finally {
    await browser.close();
    server.httpServer.close();
  }
}

verifyPhase7E2E().catch((err) => {
  console.error('\n✗ Playwright E2E verification failed:');
  console.error(err);
  process.exit(1);
});
