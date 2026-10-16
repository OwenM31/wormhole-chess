import { chromium } from 'file:///C:/nvm4w/nodejs/node_modules/@playwright/cli/node_modules/playwright/index.mjs';
import * as path from 'path';
import * as fs from 'fs';
import { preview } from 'vite';

const SCREENSHOT_DIR = path.resolve('.agent/state/artifacts/screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function verifyPhase7Polish() {
  console.log('1. Starting local Vite preview server on port 4178...');
  const server = await preview({ preview: { port: 4178 } });
  const serverUrl = 'http://localhost:4178';
  console.log(`✓ Vite preview running at ${serverUrl}`);

  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  const browserErrors = [];

  const viewports = [
    { name: 'Mobile', width: 375, height: 812 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1440, height: 900 },
  ];

  const routes = ['/', '/login', '/dashboard', '/deck-builder', '/wormhole', '/play/TEST01'];

  const setupMockRoutes = async (context) => {
    await context.route('**/api/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/api/auth/me') || url.includes('/api/auth/profile')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, user: { id: 'test_user', username: 'Grandmaster' } }),
        });
      } else if (url.includes('/api/matchmaking')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, queueCount: 4, waitingPlayers: 2 }),
        });
      } else if (url.includes('/api/matches')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, matches: [] }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      }
    });
  };

  try {
    console.log('\n2. Testing multi-viewport responsiveness and horizontal overflow...');

    for (const vp of viewports) {
      console.log(`\n--- Auditing Viewport: ${vp.name} (${vp.width}×${vp.height}) ---`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 2,
      });
      await setupMockRoutes(context);
      const page = await context.newPage();

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          console.error(`   [CONSOLE ERROR ${vp.name}]`, msg.text());
          browserErrors.push(msg.text());
        }
      });
      page.on('pageerror', (err) => {
        console.error(`   [PAGE ERROR ${vp.name}]`, err.message);
        browserErrors.push(err.message);
      });

      for (const routePath of routes) {
        await page.goto(`${serverUrl}${routePath}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(400);

        const { scrollWidth, innerWidth } = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
        }));

        if (scrollWidth > innerWidth + 1) {
          throw new Error(
            `Horizontal overflow on ${routePath} at ${vp.name} (${vp.width}px): scrollWidth ${scrollWidth} > innerWidth ${innerWidth}`
          );
        }
        console.log(`   ✓ ${routePath.padEnd(16)}: scrollWidth ${scrollWidth}px <= innerWidth ${innerWidth}px`);
      }

      await context.close();
    }

    // -------------------------------------------------------------------------
    // PART B: Palette Compliance Check
    // -------------------------------------------------------------------------
    console.log('\n3. Verifying Authentic Wormhole Palette computed styles...');
    const desktopContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
    });
    await setupMockRoutes(desktopContext);
    const testPage = await desktopContext.newPage();

    testPage.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error('   [CONSOLE ERROR Desktop]', msg.text());
        browserErrors.push(msg.text());
      }
    });
    testPage.on('pageerror', (err) => {
      console.error('   [PAGE ERROR Desktop]', err.message);
      browserErrors.push(err.message);
    });

    await testPage.goto(`${serverUrl}/`, { waitUntil: 'networkidle' });
    const navBg = await testPage.locator('.nav-header').evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    console.log(`   Nav header computed background: ${navBg}`);
    if (navBg !== 'rgb(28, 30, 32)') {
      throw new Error(`Expected Nav header background rgb(28, 30, 32) (#1C1E20), got ${navBg}`);
    }
    console.log('   ✓ Nav header matches Authentic Wormhole Palette (#1C1E20)');

    await testPage.goto(`${serverUrl}/dashboard`, { waitUntil: 'networkidle' });
    await testPage.waitForTimeout(400);
    const dashboardBg = await testPage.locator('#root > div').first().evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    console.log(`   Dashboard container computed background: ${dashboardBg}`);
    if (dashboardBg !== 'rgb(25, 27, 29)') {
      throw new Error(`Expected Dashboard container background rgb(25, 27, 29) (#191B1D), got ${dashboardBg}`);
    }
    console.log('   ✓ Dashboard page matches Authentic Wormhole Palette (#191B1D)');

    // -------------------------------------------------------------------------
    // PART C: Deck Builder 3-Column TCG Ruffle Hand Stage Audit
    // -------------------------------------------------------------------------
    console.log('\n4. Auditing 3-Column TCG Ruffle Hand Stage on /deck-builder (Variant D Refined)...');
    await testPage.goto(`${serverUrl}/deck-builder`, { waitUntil: 'networkidle' });
    await testPage.waitForTimeout(600);

    // 1. Assert 8 TCG cards rendered in the Left Hand Stage
    const tcgCards = testPage.locator('.tcg-card');
    const cardCount = await tcgCards.count();
    console.log(`   TCG cards rendered in hand: ${cardCount}`);
    if (cardCount !== 8) {
      throw new Error(`Expected exactly 8 .tcg-card elements in Left Hand Stage, found ${cardCount}`);
    }
    console.log('   ✓ Exactly 8 portrait TCG cards rendered in hand');

    // 2. Hover card and check mini-board schematic
    const firstCard = tcgCards.first();
    await firstCard.hover();
    await testPage.waitForTimeout(300);
    const miniBoard = testPage.locator('[data-testid="tcg-mini-board"]').first();
    const isMiniBoardVisible = await miniBoard.isVisible();
    console.log(`   Mini-board visual explainer visible on hover: ${isMiniBoardVisible}`);
    if (!isMiniBoardVisible) {
      throw new Error('Expected mini-board visual explainer to be visible on card hover!');
    }
    console.log('   ✓ Mini-board visual explainer smoothly appears on hover');

    // 3. Right Panel Moves / Chat Segmented Tabs
    const chatTab = testPage.locator('button:has-text("Chat")').first();
    const movesTab = testPage.locator('button:has-text("Moves")').first();
    if ((await chatTab.count()) === 0 || (await movesTab.count()) === 0) {
      throw new Error('Expected both Moves and Chat segmented tabs in Right Panel!');
    }
    await chatTab.click();
    await testPage.waitForTimeout(200);
    const chatInput = testPage.locator('input[placeholder="Send message..."]');
    if ((await chatInput.count()) === 0) {
      throw new Error('Expected Chat input field to appear when Chat tab is selected!');
    }
    console.log('   ✓ Chat tab renders interactive chat message panel');

    // Switch back to Moves
    await movesTab.click();
    await testPage.waitForTimeout(200);
    console.log('   ✓ Switched back to Moves tab');

    // 4. Click white pawn on e2 to illuminate empowered / standard moves on 512x512 board
    const e2Square = testPage.locator('[data-square="e2"]');
    if (await e2Square.count()) {
      await e2Square.click();
      await testPage.waitForTimeout(300);
      console.log('   ✓ Clicked e2 pawn to illuminate moves on chessboard');
    }

    // Capture visual proof screenshot
    const screenshotPath = path.join(SCREENSHOT_DIR, 'phase7_global_polish.png');
    await testPage.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`   ✓ High-DPI proof screenshot saved to ${screenshotPath}`);

    // Verify browser error log
    if (browserErrors.length > 0) {
      throw new Error(`Encountered ${browserErrors.length} browser errors during verification: ${browserErrors.join(', ')}`);
    }

    console.log('\n=============================================================');
    console.log(' 🎉 PHASE 7 GLOBAL POLISH & RESPONSIVE AUDIT VERIFIED PASS!');
    console.log('=============================================================');

    await desktopContext.close();
    await browser.close();
    server.httpServer.close();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ VERIFICATION FAILED:', err);
    await browser.close();
    server.httpServer.close();
    process.exit(1);
  }
}

verifyPhase7Polish();
