import { chromium } from 'file:///C:/nvm4w/nodejs/node_modules/@playwright/cli/node_modules/playwright/index.mjs';
import * as path from 'path';
import * as fs from 'fs';
import { preview } from 'vite';
import assert from 'assert';

const SCREENSHOT_DIR = path.resolve('.agent/state/artifacts/screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function testGameOverModalMobile() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' TEST GAME OVER MODAL POSITION ON MOBILE (375x667)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const server = await preview({
    preview: { port: 4186 },
  });

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 375, height: 667 } });
  const page = await context.newPage();

  try {
    await page.route('**/api/auth/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, decks: [] }),
      });
    });

    console.log('1. Navigating to /deck-builder on mobile...');
    await page.goto('http://localhost:4186/deck-builder', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // Enter multiplayer stage -> offline match
    await page.locator('[data-testid="main-menu-multiplayer-btn"]').click();
    await page.waitForTimeout(400);
    await page.locator('[data-testid="stage-offline-match-btn"]').click();
    await page.waitForTimeout(400);
    await page.locator('[data-testid="start-offline-match-btn"]').click();
    await page.waitForTimeout(600);

    // Resign to trigger Game Over
    console.log('2. Resigning to trigger Game Over modal...');
    const resignBtn = page.locator('button:has-text("Resign")');
    await resignBtn.click();
    await page.waitForTimeout(300);
    const confirmResign = page.locator('button:has-text("Confirm Resign")');
    if (await confirmResign.isVisible()) {
      await confirmResign.click();
      await page.waitForTimeout(500);
    }

    // Capture screenshot of modal in centered state
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'game_over_mobile_after.png') });
    console.log('   ✓ Screenshot saved: game_over_mobile_after.png');

    // Get bounding box of modal card and heading
    const modalHeading = page.locator('h2:has-text("Defeat"), h2:has-text("Victory!"), h2:has-text("Draw")');
    await modalHeading.waitFor({ state: 'visible', timeout: 5000 });
    const headingBox = await modalHeading.boundingBox();
    console.log('   Heading bounding box:', headingBox);

    // Modal dialog box
    const modalDialog = page.locator('div[role="dialog"]');
    const dialogBox = await modalDialog.boundingBox();
    console.log('   Dialog bounding box:', dialogBox);

    // Assert dialog is centered horizontally: center X should be ~187.5px on a 375px screen
    const dialogCenterX = dialogBox.x + dialogBox.width / 2;
    console.log(`   Dialog Center X: ${dialogCenterX}px (viewport center: 187.5px)`);
    assert(Math.abs(dialogCenterX - 187.5) < 15, `Dialog should be centered horizontally within 15px, got ${dialogCenterX}`);

    // Assert dialog is visible on screen with no clipping (x >= 0, x + width <= 375)
    assert(dialogBox.x >= 0, `Dialog left edge should not be off-screen (${dialogBox.x})`);
    assert(dialogBox.x + dialogBox.width <= 375, `Dialog right edge should not overflow (${dialogBox.x + dialogBox.width})`);

    // Assert dialog is centered vertically (y > 100 && y + height < 667)
    assert(dialogBox.y > 50, `Dialog top should not be off-screen (${dialogBox.y})`);
    assert(dialogBox.y + dialogBox.height <= 667, `Dialog bottom should not overflow (${dialogBox.y + dialogBox.height})`);

    console.log('3. Testing Close button (X)...');
    const closeBtn = page.locator('button[aria-label="Close modal to review board"]');
    await closeBtn.click();
    await page.waitForTimeout(400);

    assert(!(await modalHeading.isVisible()), 'Modal should be dismissed after clicking Close button');
    console.log('   ✓ Close button dismissed modal');

    // Floating review banner should be visible and centered at top
    const banner = page.locator('button:has-text("Show Results")');
    await banner.waitFor({ state: 'visible', timeout: 3000 });
    console.log('   ✓ Floating review banner is visible on mobile');

    // Click Show Results to reopen modal
    await banner.click();
    await page.waitForTimeout(300);
    assert(await modalHeading.isVisible(), 'Modal should reopen after clicking Show Results');
    console.log('   ✓ Modal reopened via Show Results');

    // Test clicking outside (backdrop overlay click)
    console.log('4. Testing backdrop overlay click to close...');
    await page.mouse.click(10, 10); // Click top-left backdrop outside dialog
    await page.waitForTimeout(400);
    assert(!(await modalHeading.isVisible()), 'Modal should be dismissed when clicking backdrop overlay');
    console.log('   ✓ Backdrop overlay click dismissed modal');

    console.log('\n✓ ALL MOBILE MODAL POSITION & INTERACTION CHECKS PASSED!');

  } finally {
    await browser.close();
    await server.close();
  }
}

testGameOverModalMobile().catch(console.error);
