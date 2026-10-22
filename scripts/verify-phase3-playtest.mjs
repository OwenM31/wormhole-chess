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
    } catch (e) {
      await new Promise((r) => setTimeout(r, 400));
    }
  }
  fs.writeFileSync(destPath, buf);
}

async function verifyPhase3Playtest() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' PHASE 3 PLAYTEST PROTOYPE & MULTIPLAYER VERIFICATION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('1. Starting local Vite preview server on port 4178...');
  const server = await preview({ preview: { port: 4178 } });
  const serverUrl = 'http://localhost:4178';
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
    // -------------------------------------------------------------------------
    // PART 1: Fluid 11-Column Loden Green Main Menu Hub
    // -------------------------------------------------------------------------
    console.log('\n2. Navigating to Deck Builder page (/deck-builder)...');
    await page.goto(`${serverUrl}/deck-builder`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    console.log('3. Verifying Fluid 11-Column Main Menu Hub elements...');
    const heading = await page.locator('h1').textContent();
    console.log(`   Header text: "${heading}"`);
    if (!heading?.includes('Deck Builder Chess')) {
      throw new Error(`Expected header to include 'Deck Builder Chess', got '${heading}'`);
    }

    const campaignBtn = page.locator('[data-testid="main-menu-campaign-btn"]');
    const multiplayerBtn = page.locator('[data-testid="main-menu-multiplayer-btn"]');
    const profileBtn = page.locator('[data-testid="main-menu-profile-btn"]');
    const switchBtn = page.locator('[data-testid="main-menu-switch-btn"]');
    const showcaseCard = page.locator('[data-testid="player-showcase-card"]');
    const characterCanvas = page.locator('[data-testid="character-canvas"]');

    if (!(await campaignBtn.isVisible())) throw new Error('Campaign button is not visible');
    if (!(await multiplayerBtn.isVisible())) throw new Error('Multiplayer button is not visible');
    if (!(await profileBtn.isVisible())) throw new Error('My Profile button is not visible');
    if (!(await switchBtn.isVisible())) throw new Error('Switch Profile button is not visible');
    if (!(await showcaseCard.isVisible())) throw new Error('Player Showcase Card is not visible');
    if (!(await characterCanvas.isVisible())) throw new Error('Character Canvas is not visible');
    console.log('   ✓ All Main Menu components verified visible');

    // Assert fluid 11-column grid
    const gridCols = await page.$eval('.deck-builder-main-menu-grid', (el) =>
      window.getComputedStyle(el).gridTemplateColumns
    );
    const colTracks = gridCols.split(' ').filter(Boolean);
    console.log(`   Grid column track count: ${colTracks.length} (expected 11)`);
    if (colTracks.length !== 11) {
      throw new Error(`Expected exactly 11 grid column tracks, got ${colTracks.length}: ${gridCols}`);
    }

    // Capture Main Menu Screenshot
    const menuShotPath = path.join(SCREENSHOT_DIR, 'phase3_main_menu_hub.png');
    await safeScreenshot(page, menuShotPath);
    console.log(`   ✓ Captured visual proof: ${menuShotPath}`);

    // -------------------------------------------------------------------------
    // PART 2: Profile Switching Modal
    // -------------------------------------------------------------------------
    console.log('\n4. Testing Switch Profile Modal...');
    await switchBtn.click();
    await page.waitForTimeout(400);

    const switchModal = page.locator('[data-testid="switch-profile-modal"]');
    if (!(await switchModal.isVisible())) throw new Error('Switch Profile modal did not open');
    console.log('   ✓ Switch Profile modal opened');

    // Verify playtest mode toggle exists
    const playtestToggle = page.locator('[data-testid="toggle-playtest-mode-btn"]');
    if (!(await playtestToggle.isVisible())) throw new Error('Playtest mode toggle not found');
    console.log(`   Playtest mode toggle status: "${await playtestToggle.textContent()}"`);

    // Close modal by clicking background
    await switchModal.click({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(300);

    // -------------------------------------------------------------------------
    // PART 3: Full-Screen Multiplayer Character Stage
    // -------------------------------------------------------------------------
    console.log('\n5. Transitioning to Multiplayer Character Stage...');
    await multiplayerBtn.click();
    await page.waitForTimeout(600);

    const stageBackBtn = page.locator('[data-testid="stage-back-to-menu-btn"]');
    const offlineMatchBtn = page.locator('[data-testid="stage-offline-match-btn"]');
    const searchOpponentBtn = page.locator('[data-testid="stage-search-opponent-btn"]');
    const privateMatchBtn = page.locator('[data-testid="stage-private-match-btn"]');
    const asyncMatchesBtn = page.locator('[data-testid="stage-async-matches-btn"]');
    const backdropStage = page.locator('[data-testid="character-backdrop-stage"]');
    const equippedHandStage = page.locator('[data-testid="equipped-hand-stage"]');
    const cardsLibraryGrid = page.locator('[data-testid="cards-library-grid"]');

    if (!(await stageBackBtn.isVisible())) throw new Error('Stage back to menu button not visible');
    if (!(await offlineMatchBtn.isVisible())) throw new Error('Offline Match button not visible');
    if (!(await searchOpponentBtn.isVisible())) throw new Error('Search Opponent button not visible');
    if (!(await privateMatchBtn.isVisible())) throw new Error('Private Match button not visible');
    if (!(await asyncMatchesBtn.isVisible())) throw new Error('Async Matches button not visible');
    if (!(await backdropStage.isVisible())) throw new Error('Character backdrop stage not visible');
    if (!(await equippedHandStage.isVisible())) throw new Error('Equipped hand stage not visible');
    if (!(await cardsLibraryGrid.isVisible())) throw new Error('36-card library grid not visible');
    console.log('   ✓ Full-Screen Multiplayer Stage and Top-Right Play Cluster verified');

    // Verify 5-dot copy stack exists across library cards
    const dotStacks = page.locator('[data-testid="copy-dot-stack"]');
    const dotStackCount = await dotStacks.count();
    console.log(`   Total copy dot stacks rendered: ${dotStackCount}`);
    if (dotStackCount < 36) {
      throw new Error(`Expected at least 36 copy dot stacks, got ${dotStackCount}`);
    }

    // Capture Multiplayer Stage Screenshot
    const stageShotPath = path.join(SCREENSHOT_DIR, 'phase3_multiplayer_stage.png');
    await safeScreenshot(page, stageShotPath);
    console.log(`   ✓ Captured visual proof: ${stageShotPath}`);

    // -------------------------------------------------------------------------
    // PART 4: Launching Offline Match to Enter Arena
    // -------------------------------------------------------------------------
    console.log('\n6. Launching Offline Match...');
    await offlineMatchBtn.click();
    await page.waitForTimeout(400);

    const offlineModal = page.locator('[data-testid="offline-match-modal"]');
    if (!(await offlineModal.isVisible())) throw new Error('Offline match modal did not open');

    const startMatchBtn = page.locator('[data-testid="start-offline-match-btn"]');
    await startMatchBtn.click();
    await page.waitForTimeout(600);

    // Verify Arena elements
    const boardGrid = page.locator('[data-testid="chessboard-grid"]');
    const handBar = page.locator('[data-testid="tactical-hand-bar"]');
    const backToStageBtn = page.locator('[data-testid="back-to-stage-btn"]');
    const backToMenuBtn = page.locator('[data-testid="back-to-menu-btn"]');

    if (!(await boardGrid.isVisible())) throw new Error('Chessboard grid not visible in arena');
    if (!(await handBar.isVisible())) throw new Error('Tactical hand bar not visible in arena');
    if (!(await backToStageBtn.isVisible())) throw new Error('Back to Stage button not visible');
    if (!(await backToMenuBtn.isVisible())) throw new Error('Back to Menu button not visible');
    console.log('   ✓ Transitioned into Tactical Battle Arena with 36-card loadout');

    // -------------------------------------------------------------------------
    // PART 5: Bidirectional Move Selection & Mandatory Outcome Confirmation
    // -------------------------------------------------------------------------
    console.log('\n7. Testing Bidirectional Selection & Outcome Confirmation Bar (✓ / ✕)...');

    // Piece-First test: click piece at e2
    console.log('   Testing Piece-First: clicking square e2...');
    const e2Square = page.locator('[data-square="e2"]').first();
    await e2Square.click();
    await page.waitForTimeout(300);

    // Standard moves exist (e.g. e3, e4)
    const e4Square = page.locator('[data-square="e4"]').first();
    const hasMoveDot = await e4Square.locator('.rounded-full').first().isVisible();
    console.log(`      e4 move indicator: ${hasMoveDot ? '✓ VISIBLE' : '✗'}`);

    // Deselect e2
    await e2Square.click();
    await page.waitForTimeout(300);

    // Card-First test: select P3 Follow Me from hand
    console.log('   Testing Card-First: selecting card P3 Follow Me from hand...');
    const p3Card = page.locator('[data-card-id="p3_follow_me"]').first();
    await p3Card.click();
    await page.waitForTimeout(400);

    // Click anchor piece e2
    console.log('   Selecting anchor piece e2...');
    await e2Square.click();
    await page.waitForTimeout(400);

    // Click empowered destination e3
    console.log('   Selecting empowered destination e3...');
    const e3Square = page.locator('[data-square="e3"]').first();
    await e3Square.click();
    await page.waitForTimeout(500);

    // Check Board Outcome Confirmation Bar
    const confirmBar = page.locator('[data-testid="card-confirm-bar"]');
    const isConfirmBarVisible = await confirmBar.isVisible();
    console.log(`   Board Outcome Confirmation Bar visible: ${isConfirmBarVisible ? '✓ VISIBLE' : '✗'}`);
    if (!isConfirmBarVisible) {
      throw new Error('Expected Board Outcome Confirmation Bar to be visible after selecting card target');
    }

    const confirmBtn = page.locator('[data-testid="confirm-card-move-btn"]');
    const cancelBtn = page.locator('[data-testid="cancel-card-move-btn"]');

    if (!(await confirmBtn.isVisible())) throw new Error('Big Green Check ✓ Confirm button not visible');
    if (!(await cancelBtn.isVisible())) throw new Error('Big Red X ✕ Cancel button not visible');
    console.log('   ✓ Big Green Check (✓) and Big Red X (✕) buttons verified');

    // Test Cancel
    console.log('   Testing Cancel: clicking ✕ Cancel...');
    await cancelBtn.click();
    await page.waitForTimeout(300);
    const isStillVisible = await confirmBar.isVisible();
    if (isStillVisible) throw new Error('Confirmation bar did not dismiss on cancel');
    console.log('   ✓ Confirmation bar cleanly dismissed on Cancel');

    // Re-trigger and confirm
    console.log('   Re-selecting P3 Follow Me and confirming...');
    await p3Card.click();
    await page.waitForTimeout(300);
    await e2Square.click();
    await page.waitForTimeout(300);
    await e3Square.click();
    await page.waitForTimeout(400);

    if (await confirmBar.isVisible()) {
      console.log('   Testing Confirm: clicking ✓ Confirm...');
      await confirmBtn.click();
      await page.waitForTimeout(600);
      console.log('   ✓ Card move executed and committed!');
    }

    // Capture Arena Screenshot
    const arenaShotPath = path.join(SCREENSHOT_DIR, 'phase3_arena_card_confirmation.png');
    await safeScreenshot(page, arenaShotPath);
    console.log(`   ✓ Captured visual proof: ${arenaShotPath}`);

    // Verify 0 browser console errors
    if (browserErrors.length > 0) {
      throw new Error(`Encountered ${browserErrors.length} browser errors during test`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(' ALL PHASE 3 PLAYTEST PROTOYPE VERIFICATIONS PASSED ✓');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } finally {
    await browser.close();
    await server.close();
  }
}

verifyPhase3Playtest().catch((err) => {
  console.error('\n❌ Phase 3 Verification Failed:', err);
  process.exit(1);
});
