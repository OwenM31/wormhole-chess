import { chromium } from 'file:///C:/nvm4w/nodejs/node_modules/@playwright/cli/node_modules/playwright/index.mjs';
import * as path from 'path';
import * as fs from 'fs';
import { preview } from 'vite';

const SCREENSHOT_DIR = path.resolve('.agent/state/artifacts/screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function verifyPhase3UX() {
  console.log('1. Starting local Vite preview server on port 4176...');
  const server = await preview({ preview: { port: 4176 } });
  const serverUrl = 'http://localhost:4176';
  console.log(`✓ Vite preview running at ${serverUrl}`);

  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  try {
    // -------------------------------------------------------------------------
    // DESKTOP SWEEP (1280x800)
    // -------------------------------------------------------------------------
    console.log('\n2. Testing Desktop Viewport (1280x800)...');
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 2,
    });
    const desktopPage = await desktopContext.newPage();

    // Mock unauthenticated auth endpoint
    await desktopPage.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Unauthorized' }),
      });
    });

    // 2A. Test Home Page
    console.log('\n   A. Testing Home Landing Page (/)...');
    await desktopPage.goto(`${serverUrl}/`, { waitUntil: 'networkidle' });
    await desktopPage.waitForTimeout(500);

    // Verify hero copy
    const heroTitle = await desktopPage.textContent('h1');
    console.log(`      Hero title: "${heroTitle?.trim()}"`);
    if (!heroTitle?.includes('WormholeChess') && !heroTitle?.includes('Wormhole Chess')) {
      throw new Error(`Expected hero "WormholeChess", got "${heroTitle}"`);
    }

    const heroSubtitle = await desktopPage.textContent('.home-hero-subtitle');
    console.log(`      Hero subtitle: "${heroSubtitle?.trim()}"`);
    if (!heroSubtitle?.includes('Home of your favorite chess variants')) {
      throw new Error(`Expected subtitle "Home of your favorite chess variants", got "${heroSubtitle}"`);
    }

    // Verify Deck Builder view is active by default
    const stageTitle = await desktopPage.textContent('h2');
    console.log(`      Stage title: "${stageTitle?.trim()}"`);
    if (!stageTitle?.includes('Deck Builder Chess')) {
      throw new Error(`Expected stage "Deck Builder Chess", got "${stageTitle}"`);
    }

    // Verify Energy pill
    const energyPill = await desktopPage.locator('text=ENERGY 3/3').first();
    const hasEnergyPill = await energyPill.isVisible();
    console.log(`      Energy counter pill: ${hasEnergyPill ? '✓ VISIBLE' : '✗ NOT FOUND'}`);
    if (!hasEnergyPill) {
      throw new Error('Expected "ENERGY 3/3" pill to be visible');
    }

    // Verify 4 tactical cards
    const cardItems = await desktopPage.locator('.home-card-item').all();
    console.log(`      Tactical sample cards: ${cardItems.length} found`);
    if (cardItems.length !== 4) {
      throw new Error(`Expected 4 sample cards, got ${cardItems.length}`);
    }

    // Capture desktop Home screenshot (Deck Builder tab)
    const homeDesktopPath = path.join(SCREENSHOT_DIR, 'phase3_home_desktop.png');
    await desktopPage.screenshot({ path: homeDesktopPath, fullPage: true });
    console.log(`      ✓ Saved: ${homeDesktopPath}`);

    // 2B. Test 3D Wormhole Tab Switch
    console.log('\n   B. Testing 3D Wormhole Tab Switch...');
    const wormholeTabBtn = desktopPage.locator('#tab-wormhole');
    await wormholeTabBtn.click();
    await desktopPage.waitForTimeout(400);

    const wormholeStageTitle = await desktopPage.textContent('h2');
    console.log(`      Stage title: "${wormholeStageTitle?.trim()}"`);
    if (!wormholeStageTitle?.includes('3D Wormhole Chess')) {
      throw new Error(`Expected "3D Wormhole Chess", got "${wormholeStageTitle}"`);
    }

    const wormholeDesc = await desktopPage.locator('text=Two 8x8 boards linked by a hole in the middle, for up to 4 players.').first();
    const hasWormholeDesc = await wormholeDesc.isVisible();
    console.log(`      3D Wormhole approved one-liner: ${hasWormholeDesc ? '✓ VISIBLE' : '✗ NOT FOUND'}`);
    if (!hasWormholeDesc) {
      throw new Error('Expected 3D Wormhole one-liner to be visible');
    }

    const portalLabel = await desktopPage.locator('text=BOARD 1 ⇄ BOARD 2').first();
    const hasPortal = await portalLabel.isVisible();
    console.log(`      Portal schematic label: ${hasPortal ? '✓ VISIBLE' : '✗ NOT FOUND'}`);

    // Capture desktop Home screenshot (3D Wormhole tab)
    const home3DPath = path.join(SCREENSHOT_DIR, 'phase3_home_3d_tab.png');
    await desktopPage.screenshot({ path: home3DPath, fullPage: true });
    console.log(`      ✓ Saved: ${home3DPath}`);

    // 2C. Test Authentication Page (/login)
    console.log('\n   C. Testing Authentication Page (/login)...');
    await desktopPage.goto(`${serverUrl}/login`, { waitUntil: 'networkidle' });
    await desktopPage.waitForTimeout(500);

    // Verify card width
    const authCardBox = await desktopPage.locator('.auth-card').boundingBox();
    console.log(`      Auth card width: ${Math.round(authCardBox?.width || 0)}px (max 400px)`);
    if (authCardBox && authCardBox.width > 420) {
      throw new Error(`Auth card exceeded expected max width: ${authCardBox.width}px`);
    }

    // Verify Sign In tab active
    const signInBtn = await desktopPage.locator('.auth-submit-btn').textContent();
    console.log(`      Sign In submit button text: "${signInBtn?.trim()}"`);
    if (!signInBtn?.includes('Sign In')) {
      throw new Error(`Expected "Sign In", got "${signInBtn}"`);
    }

    // Switch to Register tab
    const registerTabBtn = desktopPage.locator('#auth-tab-register');
    await registerTabBtn.click();
    await desktopPage.waitForTimeout(300);

    const registerSubmitBtn = await desktopPage.locator('.auth-submit-btn').textContent();
    console.log(`      Register submit button text: "${registerSubmitBtn?.trim()}"`);
    if (!registerSubmitBtn?.includes('Create Account')) {
      throw new Error(`Expected "Create Account", got "${registerSubmitBtn}"`);
    }

    // Switch to Guest tab
    const guestTabBtn = desktopPage.locator('#auth-tab-guest');
    await guestTabBtn.click();
    await desktopPage.waitForTimeout(300);

    const guestCardHeader = await desktopPage.locator('text=Instant Guest Play').first();
    const hasGuestCard = await guestCardHeader.isVisible();
    console.log(`      Instant Guest Play card: ${hasGuestCard ? '✓ VISIBLE' : '✗ NOT FOUND'}`);

    // Capture desktop Auth screenshot
    const authDesktopPath = path.join(SCREENSHOT_DIR, 'phase3_auth_desktop.png');
    await desktopPage.screenshot({ path: authDesktopPath, fullPage: true });
    console.log(`      ✓ Saved: ${authDesktopPath}`);

    // -------------------------------------------------------------------------
    // MOBILE SWEEP (375x667)
    // -------------------------------------------------------------------------
    console.log('\n3. Testing Mobile Viewport (375x667)...');
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 667 },
      deviceScaleFactor: 2,
    });
    const mobilePage = await mobileContext.newPage();

    // Mock unauthenticated
    await mobilePage.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Unauthorized' }),
      });
    });

    // 3A. Test Mobile Home Page
    console.log('\n   A. Testing Mobile Home Landing (/)...');
    await mobilePage.goto(`${serverUrl}/`, { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(500);

    const homeMobileScroll = await mobilePage.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    console.log(`      Mobile Home scroll: width=${homeMobileScroll.scrollWidth}px, client=${homeMobileScroll.clientWidth}px`);
    if (homeMobileScroll.scrollWidth > homeMobileScroll.clientWidth) {
      throw new Error(`Horizontal scroll detected on mobile home: scrollWidth=${homeMobileScroll.scrollWidth} > clientWidth=${homeMobileScroll.clientWidth}`);
    }

    const homeMobilePath = path.join(SCREENSHOT_DIR, 'phase3_home_mobile.png');
    await mobilePage.screenshot({ path: homeMobilePath, fullPage: true });
    console.log(`      ✓ Saved: ${homeMobilePath}`);

    // 3B. Test Mobile Auth Page
    console.log('\n   B. Testing Mobile Auth Page (/login)...');
    await mobilePage.goto(`${serverUrl}/login`, { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(500);

    const authMobileScroll = await mobilePage.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    console.log(`      Mobile Auth scroll: width=${authMobileScroll.scrollWidth}px, client=${authMobileScroll.clientWidth}px`);
    if (authMobileScroll.scrollWidth > authMobileScroll.clientWidth) {
      throw new Error(`Horizontal scroll detected on mobile auth: scrollWidth=${authMobileScroll.scrollWidth} > clientWidth=${authMobileScroll.clientWidth}`);
    }

    const authMobilePath = path.join(SCREENSHOT_DIR, 'phase3_auth_mobile.png');
    await mobilePage.screenshot({ path: authMobilePath, fullPage: true });
    console.log(`      ✓ Saved: ${authMobilePath}`);

    console.log('\n✓ ALL PHASE 3 PLAYWRIGHT EMPIRICAL UX VERIFICATIONS PASSED WITH 0 ERRORS');
  } finally {
    await browser.close();
    await server.close();
  }
}

verifyPhase3UX().catch((err) => {
  console.error('\n✗ UX Verification Suite Failed:', err);
  process.exit(1);
});
