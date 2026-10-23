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

async function verifyPhase4MobileHand() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' PHASE 4 MOBILE CARD ERGONOMICS & HORIZONTAL SCROLL');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('1. Starting local Vite preview server on port 4179...');
  const server = await preview({ preview: { port: 4179 } });
  const serverUrl = 'http://localhost:4179';
  console.log(`✓ Vite preview running at ${serverUrl}`);

  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  try {
    // -------------------------------------------------------------------------
    // PART 1: Mobile (375x812) Viewport Testing
    // -------------------------------------------------------------------------
    console.log('\n2. Testing Mobile Viewport (375x812)...');
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 812 },
      isMobile: true,
      hasTouch: true,
    });
    const mobilePage = await mobileContext.newPage();

    // Mock auth endpoint
    await mobilePage.route('**/api/auth/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, decks: [] }),
      });
    });

    console.log('3. Navigating to /deck-builder on mobile...');
    await mobilePage.goto(`${serverUrl}/deck-builder`, { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(600);

    const multiplayerBtn = mobilePage.locator('[data-testid="main-menu-multiplayer-btn"]');
    if (!(await multiplayerBtn.isVisible())) {
      throw new Error('Multiplayer button not visible on main menu');
    }
    await multiplayerBtn.click();
    await mobilePage.waitForTimeout(600);

    // Verify Equipped Hand Stage on Mobile
    console.log('4. Inspecting [data-testid="equipped-slots-grid"] on mobile...');
    const stageContainer = mobilePage.locator('[data-testid="equipped-slots-grid"]');
    if (!(await stageContainer.isVisible())) {
      throw new Error('Equipped hand slots grid container not visible');
    }

    const { stageScrollWidth, stageClientWidth } = await stageContainer.evaluate((el) => ({
      stageScrollWidth: el.scrollWidth,
      stageClientWidth: el.clientWidth,
    }));
    console.log(`   Equipped Hand Stage: scrollWidth=${stageScrollWidth}px, clientWidth=${stageClientWidth}px`);
    if (stageScrollWidth <= stageClientWidth) {
      throw new Error(`Expected mobile equipped hand stage to scroll horizontally (scrollWidth ${stageScrollWidth} > clientWidth ${stageClientWidth})`);
    }

    // Assert each slot element has width >= 88px (no squish)
    const slotElements = stageContainer.locator('> *');
    const slotCount = await slotElements.count();
    console.log(`   Equipped slot count: ${slotCount}`);
    for (let i = 0; i < slotCount; i++) {
      const box = await slotElements.nth(i).boundingBox();
      if (!box || box.width < 88) {
        throw new Error(`Equipped slot ${i} is squished: width=${box?.width ?? 0}px (minimum: 88px)`);
      }
    }
    console.log('   ✓ All equipped stage slots maintain readable width (>= 88px)');

    // Save Mobile Equipped Screenshot
    const mobileEquippedPath = path.join(SCREENSHOT_DIR, 'phase4_mobile_equipped.png');
    await safeScreenshot(mobilePage, mobileEquippedPath);
    console.log(`   ✓ Saved screenshot: ${mobileEquippedPath}`);

    // Launch Offline Match to enter Tactical Battle Arena
    console.log('\n5. Launching Offline Match to inspect in-game Tactical Hand on mobile...');
    const offlineBtn = mobilePage.locator('[data-testid="stage-offline-match-btn"]');
    await offlineBtn.click();
    await mobilePage.waitForTimeout(400);

    const startMatchBtn = mobilePage.locator('[data-testid="start-offline-match-btn"]');
    await startMatchBtn.click();
    await mobilePage.waitForTimeout(800);

    // Inspect in-game mobile tactical hand row
    const mobileHandRow = mobilePage.locator('[data-testid="tactical-hand-mobile-row"]');
    if (!(await mobileHandRow.isVisible())) {
      throw new Error('Tactical Hand mobile row is not visible');
    }

    const { handScrollWidth, handClientWidth } = await mobileHandRow.evaluate((el) => ({
      handScrollWidth: el.scrollWidth,
      handClientWidth: el.clientWidth,
    }));
    console.log(`   Tactical Hand mobile row: scrollWidth=${handScrollWidth}px, clientWidth=${handClientWidth}px`);
    if (handScrollWidth <= handClientWidth) {
      throw new Error(`Expected in-game tactical hand to scroll horizontally (scrollWidth ${handScrollWidth} > clientWidth ${handClientWidth})`);
    }

    // Assert every visible hand card has width >= 88px
    const handCards = mobileHandRow.locator('[data-testid^="hand-card-"]');
    const handCardCount = await handCards.count();
    console.log(`   Tactical hand card count: ${handCardCount}`);
    if (handCardCount === 0) {
      throw new Error('No cards found in tactical hand bar');
    }

    for (let i = 0; i < handCardCount; i++) {
      const box = await handCards.nth(i).boundingBox();
      if (!box || box.width < 88) {
        throw new Error(`Hand card ${i} is squished: width=${box?.width ?? 0}px (minimum: 88px)`);
      }
    }
    console.log('   ✓ All tactical hand cards maintain readable size (>= 88px)');

    // Save Mobile Hand Screenshot
    const mobileHandPath = path.join(SCREENSHOT_DIR, 'phase4_mobile_hand.png');
    await safeScreenshot(mobilePage, mobileHandPath);
    console.log(`   ✓ Saved screenshot: ${mobileHandPath}`);

    await mobileContext.close();

    // -------------------------------------------------------------------------
    // PART 2: Desktop (1280x800) Viewport Verification
    // -------------------------------------------------------------------------
    console.log('\n6. Testing Desktop Viewport (1280x800) for 2x4 layout & zero overflow...');
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    const desktopPage = await desktopContext.newPage();

    await desktopPage.route('**/api/auth/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, decks: [] }),
      });
    });

    await desktopPage.goto(`${serverUrl}/deck-builder`, { waitUntil: 'networkidle' });
    await desktopPage.waitForTimeout(600);

    const desktopMultiplayerBtn = desktopPage.locator('[data-testid="main-menu-multiplayer-btn"]');
    await desktopMultiplayerBtn.click();
    await desktopPage.waitForTimeout(600);

    const desktopOfflineBtn = desktopPage.locator('[data-testid="stage-offline-match-btn"]');
    await desktopOfflineBtn.click();
    await desktopPage.waitForTimeout(400);

    const desktopStartBtn = desktopPage.locator('[data-testid="start-offline-match-btn"]');
    await desktopStartBtn.click();
    await desktopPage.waitForTimeout(800);

    const desktopHandGrid = desktopPage.locator('[data-testid="tactical-hand-desktop-grid"]');
    if (!(await desktopHandGrid.isVisible())) {
      throw new Error('Desktop 2x4 tactical hand grid is not visible at 1280x800');
    }

    const { desktopScrollWidth, desktopClientWidth } = await desktopHandGrid.evaluate((el) => ({
      desktopScrollWidth: el.scrollWidth,
      desktopClientWidth: el.clientWidth,
    }));
    console.log(`   Desktop Tactical Hand: scrollWidth=${desktopScrollWidth}px, clientWidth=${desktopClientWidth}px`);
    if (desktopScrollWidth > desktopClientWidth + 2) {
      throw new Error(`Desktop tactical hand has horizontal overflow: scrollWidth ${desktopScrollWidth} > clientWidth ${desktopClientWidth}`);
    }
    console.log('   ✓ Desktop 2x4 hand spread fits cleanly with zero horizontal overflow');

    await desktopContext.close();

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(' ALL MOBILE HAND ERGONOMICS VERIFICATIONS PASSED ✓');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } finally {
    await browser.close();
    server.httpServer.close();
  }
}

verifyPhase4MobileHand().catch((err) => {
  console.error('\n❌ VERIFICATION FAILED:', err);
  process.exit(1);
});
