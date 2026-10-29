import { chromium } from 'file:///C:/nvm4w/nodejs/node_modules/@playwright/cli/node_modules/playwright/index.mjs';
import * as path from 'path';
import * as fs from 'fs';
import { preview } from 'vite';
import assert from 'assert';

const SCREENSHOT_DIR = path.resolve('.agent/state/phases/10');
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

async function verifyCardTagPreviewsE2E() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' PHASE 10 E2E: CARD TAG TOOLTIPS (DESKTOP) & POPOVERS (MOBILE)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const server = await preview({
    preview: { port: 4198 },
  });
  console.log('✓ Vite preview server running on port 4198');

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
    // Mock API
    await page.route('**/api/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, decks: [] }),
      });
    });

    console.log('1. Navigating to /deck-builder on Mobile Viewport (375x667)...');
    await page.goto('http://localhost:4198/deck-builder', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    // Enter Offline Match
    const mpBtn = page.locator('[data-testid="main-menu-multiplayer-btn"]');
    await mpBtn.click();
    await page.waitForTimeout(600);

    const offlineStageBtn = page.locator('[data-testid="stage-offline-match-btn"]');
    await offlineStageBtn.click();
    await page.waitForTimeout(400);

    const startOfflineBtn = page.locator('[data-testid="start-offline-match-btn"]');
    await startOfflineBtn.click();
    await page.waitForTimeout(1000);

    const chessboard = page.locator('[data-testid="chessboard-grid"]');
    assert(await chessboard.isVisible(), 'FAIL: chessboard-grid is not visible');
    console.log('   ✓ Arena mounted with chessboard');

    // Make standard move 1. e4
    console.log('   Executing move 1. e4...');
    await page.evaluate(() => {
      window.__DECK_CHESS_GAME__.makeMove('e2', 'e4');
    });
    await page.waitForTimeout(400);

    // Attach cardCode R1 to Move 1 for testing previews
    await page.evaluate(() => {
      const turns = window.__DECK_CHESS_GAME__.getRecordedTurns();
      if (turns.length > 0) {
        turns[0].cardCode = 'R1';
        turns[0].cardPieceType = 'rook';
      }
      window.__DECK_CHESS_GAME__.syncState();
    });
    await page.waitForTimeout(400);

    // ==========================================
    // SCENARIO 1: MOBILE VIEWPORT TAP POPOVER
    // ==========================================
    console.log('\n2. Testing Mobile Tap Popover...');
    const mobileStream = page.locator('[data-testid="move-stream-mobile"]');
    assert(await mobileStream.isVisible(), 'FAIL: move-stream-mobile not visible on mobile');

    const mobileTag = mobileStream.locator('[data-testid="card-tag-badge-R1"]');
    assert(await mobileTag.isVisible(), 'FAIL: card-tag-badge-R1 not visible in mobile stream');
    console.log('   ✓ [R1] card tag badge visible in mobile stream');

    // Tap [R1] tag
    console.log('   Tapping [R1] tag...');
    await mobileTag.click();
    await page.waitForTimeout(300);

    // Popover must appear
    const mobilePopover = page.locator('[data-testid="card-tag-popover"]');
    assert(await mobilePopover.isVisible(), 'FAIL: card-tag-popover not visible after tap');
    const popoverText = await mobilePopover.innerText();
    assert(popoverText.includes('Make Way'), `FAIL: Popover missing "Make Way" (got: "${popoverText}")`);
    assert(popoverText.includes('orthogonal line of sight'), `FAIL: Popover missing condition (got: "${popoverText}")`);
    console.log('   ✓ Mobile popover opened cleanly displaying card art, name, and effect rules');

    await safeScreenshot(page, path.join(SCREENSHOT_DIR, 'phase10_mobile_tag_popover.png'));
    console.log('   ✓ Saved mobile screenshot: phase10_mobile_tag_popover.png');

    // Close via close button '✕'
    const closeBtn = mobilePopover.locator('[data-testid="close-popover-btn"]');
    assert(await closeBtn.isVisible(), 'FAIL: close-popover-btn not visible');
    await closeBtn.click();
    await page.waitForTimeout(300);
    assert(!(await mobilePopover.isVisible()), 'FAIL: Popover should close when close button clicked');
    console.log('   ✓ Popover closed via close button');

    // Test outside tap dismissal
    await mobileTag.click();
    await page.waitForTimeout(300);
    assert(await mobilePopover.isVisible(), 'FAIL: Popover did not reopen on tap');

    // Click outside on backdrop
    const backdrop = page.locator('.fixed.inset-0.z-\\[190\\]');
    await backdrop.click({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(300);
    assert(!(await mobilePopover.isVisible()), 'FAIL: Popover should dismiss on outside click');
    console.log('   ✓ Popover dismissed cleanly on outside backdrop tap');

    // ==========================================
    // SCENARIO 2: DESKTOP VIEWPORT HOVER TOOLTIP
    // ==========================================
    console.log('\n3. Switching to Desktop Viewport (1280x800)...');
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(600);

    const moveTable = page.locator('[data-testid="move-table-desktop"]');
    assert(await moveTable.isVisible(), 'FAIL: move-table-desktop not visible on desktop');
    console.log('   ✓ <MoveTableDesktop /> visible on desktop');

    const desktopTag = moveTable.locator('[data-testid="card-tag-badge-R1"]').first();
    assert(await desktopTag.isVisible(), 'FAIL: card-tag-badge-R1 not visible in desktop move table');
    console.log('   ✓ [R1] card tag badge visible in desktop Move Table');

    // Hover over tag
    console.log('   Hovering over desktop [R1] tag...');
    await desktopTag.hover();
    await page.waitForTimeout(300);

    const desktopTooltip = page.locator('[data-testid="card-tag-tooltip"]');
    assert(await desktopTooltip.isVisible(), 'FAIL: card-tag-tooltip not visible on hover');
    const tooltipText = await desktopTooltip.innerText();
    assert(tooltipText.includes('Make Way'), `FAIL: Tooltip missing "Make Way" (got: "${tooltipText}")`);
    console.log('   ✓ Desktop hover tooltip visible with card details');

    await safeScreenshot(page, path.join(SCREENSHOT_DIR, 'phase10_desktop_tag_tooltip.png'));
    console.log('   ✓ Saved desktop screenshot: phase10_desktop_tag_tooltip.png');

    // Move mouse away
    await page.mouse.move(0, 0);
    await page.waitForTimeout(300);
    assert(!(await desktopTooltip.isVisible()), 'FAIL: Tooltip should hide when mouse leaves');
    console.log('   ✓ Desktop tooltip dismissed on mouse leave');

    assert(consoleErrors.length === 0, `FAIL: Console errors detected: ${consoleErrors.join(', ')}`);
    console.log('\n✓ ZERO browser console errors detected');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(' ALL PHASE 10 E2E BROWSER SCENARIOS PASSED 100%');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } finally {
    await browser.close();
    await server.close();
  }
}

verifyCardTagPreviewsE2E().catch((err) => {
  console.error('E2E Verification failed:', err);
  process.exit(1);
});
