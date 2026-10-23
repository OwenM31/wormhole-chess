import { chromium } from 'file:///C:/nvm4w/nodejs/node_modules/@playwright/cli/node_modules/playwright/index.mjs';
import * as path from 'path';
import * as fs from 'fs';
import { preview } from 'vite';

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

async function verifyPhase4GameplayFixes() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' PHASE 4 GAMEPLAY FIXES & E2E BROWSER VALIDATION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('1. Starting local Vite preview server on port 4182...');
  const server = await preview({ preview: { port: 4182 } });
  const serverUrl = 'http://localhost:4182';
  console.log(`✓ Vite preview running at ${serverUrl}`);

  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  try {
    // -------------------------------------------------------------------------
    // GAME 1: Piece-First Moves, Card Arm/Disarm, and Divert Clicks
    // -------------------------------------------------------------------------
    console.log('\n2. Testing Desktop Viewport (1280x800)...');
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    const page = await desktopContext.newPage();

    // Mock auth API
    await page.route('**/api/auth/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, decks: [] }),
      });
    });

    console.log('3. Navigating to /deck-builder...');
    await page.goto(`${serverUrl}/deck-builder`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    console.log('4. Entering Multiplayer Stage and starting Offline Match...');
    const multiplayerBtn = page.locator('[data-testid="main-menu-multiplayer-btn"]');
    await multiplayerBtn.click();
    await page.waitForTimeout(600);

    const offlineBtn = page.locator('[data-testid="stage-offline-match-btn"]');
    await offlineBtn.click();
    await page.waitForTimeout(400);

    const startMatchBtn = page.locator('[data-testid="start-offline-match-btn"]');
    await startMatchBtn.click();
    await page.waitForTimeout(800);

    // Verify Arena is mounted
    const board = page.locator('[data-testid="chessboard-grid"]');
    if (!(await board.isVisible())) {
      throw new Error('Chessboard grid is not visible in Arena');
    }
    console.log('   ✓ In-game Arena and Chessboard loaded successfully');

    // -------------------------------------------------------------------------
    // TEST CASE 1: Card Arming & Re-tap Disarm
    // -------------------------------------------------------------------------
    console.log('\n5. [TEST CASE 1] Card Arming & Re-tap Disarm Toggle:');
    const c1Square = page.locator('[data-testid="square-c1"]');
    await c1Square.click();
    await page.waitForTimeout(300);

    // Locate Let Me Through card
    const b1Card = page.locator('[data-testid="tactical-hand-desktop-grid"] [data-testid="hand-card-b1_let_me_through"]');
    if (!(await b1Card.isVisible())) {
      throw new Error('b1_let_me_through card not found in tactical hand bar');
    }

    const activeForPiece = await b1Card.getAttribute('data-active-for-piece');
    console.log(`   b1_let_me_through data-active-for-piece="${activeForPiece}"`);
    if (activeForPiece !== 'true') {
      throw new Error('Expected b1_let_me_through to be active for piece c1');
    }

    // Arm the card by tapping it
    console.log('   Arming card by clicking in hand...');
    await b1Card.click();
    await page.waitForTimeout(300);

    const armedState = await b1Card.getAttribute('data-selected');
    console.log(`   b1_let_me_through data-selected="${armedState}"`);
    if (armedState !== 'true') {
      throw new Error('Expected b1_let_me_through to be selected/armed');
    }

    // Verify empowered rings appear on board
    const empoweredB2 = page.locator('[data-testid="empowered-move-b2"]');
    const empoweredD2 = page.locator('[data-testid="empowered-move-d2"]');
    if (!(await empoweredB2.isVisible()) || !(await empoweredD2.isVisible())) {
      throw new Error('Expected empowered move rings on b2 and d2 when card is armed');
    }
    console.log('   ✓ Empowered rings are visible on b2 and d2');

    // Capture armed card screenshot
    const cardArmedScreenshotPath = path.join(SCREENSHOT_DIR, 'phase4_gameplay_card_armed.png');
    await safeScreenshot(page, cardArmedScreenshotPath);
    console.log(`   ✓ Saved screenshot: ${cardArmedScreenshotPath}`);

    // Re-tap same card to disarm
    console.log('   Re-tapping card in hand to disarm...');
    await b1Card.click();
    await page.waitForTimeout(300);

    const disarmedState = await b1Card.getAttribute('data-selected');
    console.log(`   b1_let_me_through data-selected="${disarmedState}"`);
    if (disarmedState !== 'false') {
      throw new Error('Expected b1_let_me_through to be disarmed on re-tap');
    }
    if (await empoweredB2.isVisible()) {
      throw new Error('Expected empowered rings to disappear after card disarm');
    }
    console.log('   ✓ Card successfully disarmed, empowered rings disappeared');

    // -------------------------------------------------------------------------
    // TEST CASE 2: Divert Click (Auto-Disarm on Friendly Piece Click)
    // -------------------------------------------------------------------------
    console.log('\n6. [TEST CASE 2] Divert Click (Auto-Disarm on Friendly Piece Click):');
    // Arm card again
    await c1Square.click();
    await page.waitForTimeout(200);
    await b1Card.click();
    await page.waitForTimeout(300);
    if ((await b1Card.getAttribute('data-selected')) !== 'true') {
      throw new Error('Failed to re-arm card for divert test');
    }

    // Click friendly pawn at e2
    console.log('   Clicking friendly pawn at e2 while card is armed...');
    const e2Square = page.locator('[data-testid="square-e2"]');
    await e2Square.click();
    await page.waitForTimeout(300);

    // Verify card auto-disarmed
    const divertCardState = await b1Card.getAttribute('data-selected');
    console.log(`   b1_let_me_through data-selected="${divertCardState}"`);
    if (divertCardState !== 'false') {
      throw new Error('Expected card to auto-disarm when clicking unrelated piece');
    }

    // Verify pawn e2 standard moves are displayed
    const legalMoveE3 = page.locator('[data-testid="legal-move-e3"]');
    const legalMoveE4 = page.locator('[data-testid="legal-move-e4"]');
    if (!(await legalMoveE3.isVisible()) || !(await legalMoveE4.isVisible())) {
      throw new Error('Expected standard move dots on e3 and e4 for pawn e2');
    }
    console.log('   ✓ Card auto-disarmed and pawn e2 standard moves displayed');

    // -------------------------------------------------------------------------
    // TEST CASE 3: Piece-First Standard Move (Instant Execution & No Hijacking)
    // -------------------------------------------------------------------------
    console.log('\n7. [TEST CASE 3] Piece-First Standard Move (Instant Execution):');
    const e3Square = page.locator('[data-testid="square-e3"]');
    console.log('   Clicking destination square e3...');
    await e3Square.click();
    await page.waitForTimeout(400);

    // Confirm bar must NEVER appear for standard moves
    const confirmBar = page.locator('[data-testid="card-confirm-bar"]');
    if (await confirmBar.isVisible()) {
      throw new Error('Confirm bar erroneously popped up for a standard chess move!');
    }
    console.log('   ✓ Standard move executed instantly without card confirm bar');

    // Capture standard move screenshot
    const standardMoveScreenshotPath = path.join(SCREENSHOT_DIR, 'phase4_gameplay_standard_move.png');
    await safeScreenshot(page, standardMoveScreenshotPath);
    console.log(`   ✓ Saved screenshot: ${standardMoveScreenshotPath}`);

    // -------------------------------------------------------------------------
    // TEST CASE 4: Empowered Move Execution & Spent Card Reordering
    // -------------------------------------------------------------------------
    console.log('\n8. [TEST CASE 4] Empowered Move Execution & Spent Card Reordering:');
    // Navigate back to stage and start clean match
    const backToStageBtn = page.locator('[data-testid="back-to-stage-btn"]');
    await backToStageBtn.click();
    await page.waitForTimeout(500);

    await offlineBtn.click();
    await page.waitForTimeout(300);
    await startMatchBtn.click();
    await page.waitForTimeout(800);

    // Now execute card move: c1 -> Let Me Through -> b2
    const freshC1 = page.locator('[data-testid="square-c1"]');
    await freshC1.click();
    await page.waitForTimeout(300);

    const freshB1Card = page.locator('[data-testid="tactical-hand-desktop-grid"] [data-testid="hand-card-b1_let_me_through"]');
    await freshB1Card.click();
    await page.waitForTimeout(300);

    console.log('   Selecting empowered destination b2...');
    const freshB2 = page.locator('[data-testid="square-b2"]');
    await freshB2.click();
    await page.waitForTimeout(400);

    // Verify card confirm bar is now visible
    const cardConfirmBar = page.locator('[data-testid="card-confirm-bar"]');
    if (!(await cardConfirmBar.isVisible())) {
      throw new Error('Expected card confirm bar to appear for staged card move');
    }
    console.log('   ✓ Card move staged, confirm bar visible');

    // Click confirm button
    const confirmBtn = page.locator('[data-testid="confirm-card-move-btn"]');
    await confirmBtn.click();
    await page.waitForTimeout(800);

    // Inspect hand cards order
    const allHandCards = page.locator('[data-testid="tactical-hand-desktop-grid"] [data-testid^="hand-card-"]');
    const cardCount = await allHandCards.count();
    console.log(`   Hand card count: ${cardCount}`);

    // Check the last card in the hand
    const lastCard = allHandCards.nth(cardCount - 1);
    const lastCardId = await lastCard.getAttribute('data-card-id');
    const lastCardSpent = await lastCard.getAttribute('data-spent');
    console.log(`   Last hand card: id="${lastCardId}", spent="${lastCardSpent}"`);

    if (lastCardId !== 'b1_let_me_through' || lastCardSpent !== 'true') {
      throw new Error(`Expected b1_let_me_through to shift to hand tail and be marked spent, got id=${lastCardId}, spent=${lastCardSpent}`);
    }
    console.log('   ✓ Played card shifted to tail of hand and is marked spent');

    // Capture spent card reorder screenshot
    const spentReorderScreenshotPath = path.join(SCREENSHOT_DIR, 'phase4_gameplay_spent_reorder.png');
    await safeScreenshot(page, spentReorderScreenshotPath);
    console.log(`   ✓ Saved screenshot: ${spentReorderScreenshotPath}`);

    await desktopContext.close();

    // -------------------------------------------------------------------------
    // TEST CASE 5: Mobile 375px Horizontal Scroll & Zero Squish
    // -------------------------------------------------------------------------
    console.log('\n9. [TEST CASE 5] Mobile 375px Horizontal Scroll & Zero Squish:');
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 812 },
      isMobile: true,
      hasTouch: true,
    });
    const mobilePage = await mobileContext.newPage();

    await mobilePage.route('**/api/auth/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, decks: [] }),
      });
    });

    await mobilePage.goto(`${serverUrl}/deck-builder`, { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(600);

    const mMultiplayerBtn = mobilePage.locator('[data-testid="main-menu-multiplayer-btn"]');
    await mMultiplayerBtn.click();
    await mobilePage.waitForTimeout(600);

    const mOfflineBtn = mobilePage.locator('[data-testid="stage-offline-match-btn"]');
    await mOfflineBtn.click();
    await mobilePage.waitForTimeout(300);

    const mStartMatchBtn = mobilePage.locator('[data-testid="start-offline-match-btn"]');
    await mStartMatchBtn.click();
    await mobilePage.waitForTimeout(800);

    const mobileHandRow = mobilePage.locator('[data-testid="tactical-hand-mobile-row"]');
    if (!(await mobileHandRow.isVisible())) {
      throw new Error('Tactical Hand mobile row is not visible');
    }

    const { handScrollWidth, handClientWidth } = await mobileHandRow.evaluate((el) => ({
      handScrollWidth: el.scrollWidth,
      handClientWidth: el.clientWidth,
    }));
    console.log(`   Mobile Tactical Hand: scrollWidth=${handScrollWidth}px, clientWidth=${handClientWidth}px`);
    if (handScrollWidth <= handClientWidth) {
      throw new Error(`Expected mobile hand row to scroll horizontally (scrollWidth ${handScrollWidth} > clientWidth ${handClientWidth})`);
    }

    const mCards = mobileHandRow.locator('[data-testid^="hand-card-"]');
    const mCardCount = await mCards.count();
    for (let i = 0; i < mCardCount; i++) {
      const box = await mCards.nth(i).boundingBox();
      if (!box || box.width < 88) {
        throw new Error(`Mobile card ${i} is compressed: width=${box?.width ?? 0}px (min 88px)`);
      }
    }
    console.log('   ✓ All mobile cards maintain uncompressed readability (>= 88px)');

    await mobileContext.close();

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(' ALL PHASE 4 PLAYWRIGHT E2E ASSERTIONS PASSED ✓');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } finally {
    await browser.close();
    server.httpServer.close();
  }
}

verifyPhase4GameplayFixes().catch((err) => {
  console.error('\n❌ VERIFICATION FAILED:', err);
  process.exit(1);
});
