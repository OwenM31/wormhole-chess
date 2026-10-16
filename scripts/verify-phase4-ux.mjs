import { chromium } from 'file:///C:/nvm4w/nodejs/node_modules/@playwright/cli/node_modules/playwright/index.mjs';
import * as path from 'path';
import * as fs from 'fs';
import { preview } from 'vite';

const SCREENSHOT_DIR = path.resolve('.agent/state/artifacts/screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function verifyPhase4UX() {
  console.log('1. Starting local Vite preview server on port 4178...');
  const server = await preview({ preview: { port: 4178 } });
  const serverUrl = 'http://localhost:4178';
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

    // 2A. Test 3D Wormhole Page
    console.log('\n   A. Testing 3D Wormhole HUD Page (/wormhole)...');
    await desktopPage.goto(`${serverUrl}/wormhole`, { waitUntil: 'networkidle' });
    await desktopPage.waitForTimeout(1000);

    // Verify canvas presence and size
    const canvas = desktopPage.locator('canvas').first();
    const isCanvasVisible = await canvas.isVisible();
    console.log(`      Canvas presence: ${isCanvasVisible ? '✓ VISIBLE' : '✗ NOT FOUND'}`);
    if (!isCanvasVisible) {
      throw new Error('Expected 3D Three.js canvas to be visible');
    }

    const canvasBox = await canvas.boundingBox();
    console.log(`      Canvas dimensions: ${canvasBox?.width}px × ${canvasBox?.height}px`);
    if (!canvasBox || canvasBox.width < 1200 || canvasBox.height < 700) {
      throw new Error(`Expected edge-to-edge canvas (~1280x800), got ${canvasBox?.width}x${canvasBox?.height}`);
    }

    // Verify Top HUD Capsule
    const homeLink = desktopPage.locator('text=← Home').first();
    const hasHomeLink = await homeLink.isVisible();
    console.log(`      ← Home nav pill: ${hasHomeLink ? '✓ VISIBLE' : '✗ NOT FOUND'}`);
    if (!hasHomeLink) throw new Error('Expected "← Home" nav link in top HUD');

    const modeTitle = desktopPage.locator('text=3D Wormhole').first();
    const hasModeTitle = await modeTitle.isVisible();
    console.log(`      3D Wormhole mode badge: ${hasModeTitle ? '✓ VISIBLE' : '✗ NOT FOUND'}`);
    if (!hasModeTitle) throw new Error('Expected "3D Wormhole" mode title in top HUD');

    const spatialTag = desktopPage.locator('text=SPATIAL').first();
    const hasSpatialTag = await spatialTag.isVisible();
    console.log(`      SPATIAL tag: ${hasSpatialTag ? '✓ VISIBLE' : '✗ NOT FOUND'}`);
    if (!hasSpatialTag) throw new Error('Expected "SPATIAL" tag in top HUD');

    const turnBadge = desktopPage.locator('text=White to move').first();
    const hasTurnBadge = await turnBadge.isVisible();
    console.log(`      Active turn badge: ${hasTurnBadge ? '✓ VISIBLE' : '✗ NOT FOUND'}`);
    if (!hasTurnBadge) throw new Error('Expected "White to move" active turn badge');

    const concludeBtn = desktopPage.locator('text=🏁 Conclude Match').first();
    const hasConcludeBtn = await concludeBtn.isVisible();
    console.log(`      Conclude Match button: ${hasConcludeBtn ? '✓ VISIBLE' : '✗ NOT FOUND'}`);
    if (!hasConcludeBtn) throw new Error('Expected "🏁 Conclude Match" button');

    // Verify Floating Bottom Camera Dock
    console.log('\n   B. Verifying Floating Bottom Camera Dock...');
    const topViewBtn = desktopPage.locator('button:has-text("Top View")').first();
    const flip180Btn = desktopPage.locator('button:has-text("Flip 180°")').first();
    const rotate90Btn = desktopPage.locator('button:has-text("Rotate 90°")').first();
    const orbitLockBtn = desktopPage.locator('button:has-text("Orbit")').first();
    const resetBtn = desktopPage.locator('button:has-text("Reset")').first();

    const hasTopView = await topViewBtn.isVisible();
    const hasFlip180 = await flip180Btn.isVisible();
    const hasRotate90 = await rotate90Btn.isVisible();
    const hasOrbitLock = await orbitLockBtn.isVisible();
    const hasReset = await resetBtn.isVisible();

    console.log(`      Dock: Top View [T]: ${hasTopView ? '✓' : '✗'}`);
    console.log(`      Dock: Flip 180° [F]: ${hasFlip180 ? '✓' : '✗'}`);
    console.log(`      Dock: Rotate 90° [R]: ${hasRotate90 ? '✓' : '✗'}`);
    console.log(`      Dock: Orbit Lock [L]: ${hasOrbitLock ? '✓' : '✗'}`);
    console.log(`      Dock: Reset [X]: ${hasReset ? '✓' : '✗'}`);

    if (!hasTopView || !hasFlip180 || !hasRotate90 || !hasOrbitLock || !hasReset) {
      throw new Error('Expected all 5 camera actions to be visible in bottom camera dock');
    }

    // Verify Collapsible Telemetry Drawer
    console.log('\n   C. Verifying Collapsible Telemetry Drawer...');
    const drawerTrigger = desktopPage.locator('button:has-text("Moves")').first();
    const hasDrawerTrigger = await drawerTrigger.isVisible();
    console.log(`      Drawer toggle tab: ${hasDrawerTrigger ? '✓ VISIBLE' : '✗ NOT FOUND'}`);
    if (!hasDrawerTrigger) throw new Error('Expected drawer toggle tab');

    // Click to expand drawer
    await drawerTrigger.click();
    await desktopPage.waitForTimeout(400);

    const cameraTips = desktopPage.locator('text=Camera Tips').first();
    const hasCameraTips = await cameraTips.isVisible();
    console.log(`      Expanded drawer Camera Tips: ${hasCameraTips ? '✓ VISIBLE' : '✗ NOT FOUND'}`);
    if (!hasCameraTips) throw new Error('Expected "Camera Tips" inside expanded telemetry drawer');

    // Capture desktop Wormhole screenshot
    const wormholeDesktopPath = path.join(SCREENSHOT_DIR, 'phase4_wormhole_desktop.png');
    await desktopPage.screenshot({ path: wormholeDesktopPath });
    console.log(`      ✓ Saved: ${wormholeDesktopPath}`);

    // 2D. Test Multiplayer PlayRoom Page
    console.log('\n   D. Testing Multiplayer PlayRoom Page (/play/TEST4)...');
    await desktopPage.goto(`${serverUrl}/play/TEST4`, { waitUntil: 'networkidle' });
    await desktopPage.waitForTimeout(600);

    // Verify room code pill
    const roomCode = await desktopPage.textContent('text=TEST4');
    console.log(`      Room Code display: ${roomCode ? '✓ FOUND' : '✗ NOT FOUND'}`);
    if (!roomCode) throw new Error('Expected room code TEST4');

    // Verify chess clocks presence
    const clockWhite = desktopPage.locator('text=⚪ White').first();
    const clockBlack = desktopPage.locator('text=⚫ Black').first();
    const hasClocks = (await clockWhite.isVisible()) && (await clockBlack.isVisible());
    console.log(`      Chess clocks (White & Black): ${hasClocks ? '✓ VISIBLE' : '✗ NOT FOUND'}`);
    if (!hasClocks) throw new Error('Expected chess clocks to be rendered in PlayRoom');

    // Verify chat sidebar with restrained copy
    const chatTab = desktopPage.locator('text=Chat').first();
    const emptyChat = desktopPage.locator('text=No messages').first();
    const chatInput = desktopPage.locator('input[placeholder="Send message..."]').first();

    const hasChatTab = await chatTab.isVisible();
    const hasEmptyChat = await emptyChat.isVisible();
    const hasChatInput = await chatInput.isVisible();
    console.log(`      Chat sidebar: "Chat": ${hasChatTab ? '✓' : '✗'}, "No messages": ${hasEmptyChat ? '✓' : '✗'}, Input: ${hasChatInput ? '✓' : '✗'}`);
    if (!hasChatTab || !hasEmptyChat || !hasChatInput) {
      throw new Error('Expected restrained zero-fluff chat sidebar in PlayRoom');
    }

    // Capture desktop PlayRoom screenshot
    const playroomDesktopPath = path.join(SCREENSHOT_DIR, 'phase4_playroom_desktop.png');
    await desktopPage.screenshot({ path: playroomDesktopPath });
    console.log(`      ✓ Saved: ${playroomDesktopPath}`);

    await desktopContext.close();

    // -------------------------------------------------------------------------
    // MOBILE SWEEP (375x667)
    // -------------------------------------------------------------------------
    console.log('\n3. Testing Mobile Viewport (375x667)...');
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 667 },
      deviceScaleFactor: 2,
    });
    const mobilePage = await mobileContext.newPage();

    // 3A. Mobile 3D Wormhole
    console.log('\n   A. Testing Mobile 3D Wormhole (/wormhole)...');
    await mobilePage.goto(`${serverUrl}/wormhole`, { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(1000);

    const mobileWormholeOverflow = await mobilePage.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    console.log(`      Mobile horizontal overflow: ${mobileWormholeOverflow ? '✗ OVERFLOW' : '✓ NONE'}`);
    if (mobileWormholeOverflow) throw new Error('Mobile /wormhole has horizontal overflow');

    const wormholeMobilePath = path.join(SCREENSHOT_DIR, 'phase4_wormhole_mobile.png');
    await mobilePage.screenshot({ path: wormholeMobilePath });
    console.log(`      ✓ Saved: ${wormholeMobilePath}`);

    // 3B. Mobile PlayRoom
    console.log('\n   B. Testing Mobile PlayRoom (/play/TEST4)...');
    await mobilePage.goto(`${serverUrl}/play/TEST4`, { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(600);

    const mobilePlayroomOverflow = await mobilePage.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    console.log(`      Mobile PlayRoom horizontal overflow: ${mobilePlayroomOverflow ? '✗ OVERFLOW' : '✓ NONE'}`);
    if (mobilePlayroomOverflow) throw new Error('Mobile /play/TEST4 has horizontal overflow');

    const playroomMobilePath = path.join(SCREENSHOT_DIR, 'phase4_playroom_mobile.png');
    await mobilePage.screenshot({ path: playroomMobilePath });
    console.log(`      ✓ Saved: ${playroomMobilePath}`);

    await mobileContext.close();

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(' ALL PHASE 4 PLAYWRIGHT UX CHECKS PASSED CLEANLY ✓');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } finally {
    await browser.close();
    await server.close();
  }
}

verifyPhase4UX().catch((err) => {
  console.error('\n❌ Phase 4 UX Verification Failed:', err);
  process.exit(1);
});
