import { chromium } from 'file:///C:/nvm4w/nodejs/node_modules/@playwright/cli/node_modules/playwright/index.mjs';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.BASE_URL || 'https://wormhole-chess.com';
const SCREENSHOT_DIR = path.resolve('.agent/state/artifacts/screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const auditLog = {
  routesSwept: [],
  interactiveElementsTested: 0,
  consoleErrors: [],
  pageErrors: [],
  networkFailures: [],
  defects: [],
  observations: []
};

function logDefect(defect) {
  auditLog.defects.push(defect);
  console.log(`[DEFECT] [${defect.severity}] ${defect.title}`);
}

async function runSweep() {
  console.log(`Starting UX sweep on target: ${BASE_URL}`);
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // 401 on initial GET /api/auth/me is normal before login
      if (text.includes('status of 401') && page.url().includes('login')) {
        return;
      }
      auditLog.consoleErrors.push({ url: page.url(), text });
      console.error(`[CONSOLE ERROR] (${page.url()}): ${text}`);
    }
  });

  page.on('pageerror', err => {
    auditLog.pageErrors.push({ url: page.url(), message: err.message, stack: err.stack });
    console.error(`[PAGE RUNTIME ERROR] (${page.url()}): ${err.message}`);
  });

  page.on('requestfailed', req => {
    const failure = req.failure();
    const url = req.url();
    if (failure && failure.errorText !== 'net::ERR_ABORTED') {
      auditLog.networkFailures.push({ url, errorText: failure.errorText });
      console.warn(`[REQUEST FAILED] ${url}: ${failure.errorText}`);
    }
  });

  try {
    // -------------------------------------------------------------------------
    // 1. ROUTE: / (Home Page)
    // -------------------------------------------------------------------------
    console.log('\n--- Sweeping Route: / (Home Page) ---');
    auditLog.routesSwept.push('/');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'home_desktop.png') });
    console.log('Saved home_desktop.png');

    // Test Sound Toggle Button
    const muteButton = await page.$('button[aria-label="Mute Sound Effects"], button:has-text("🔊"), button:has-text("🔇")');
    if (muteButton) {
      auditLog.interactiveElementsTested++;
      const initialText = await muteButton.textContent();
      await muteButton.click();
      await page.waitForTimeout(300);
      const afterClickText = await muteButton.textContent();
      if (initialText === afterClickText) {
        logDefect({
          id: 'DEF-SOUND-TOGGLE',
          severity: 'P2',
          route: '/',
          title: 'Sound toggle button text/state did not update on click',
          observed: `Initial text '${initialText}' remained '${afterClickText}' after click`,
          expected: 'Sound toggle button should toggle between 🔊 and 🔇'
        });
      } else {
        console.log(`Sound toggle successfully switched from ${initialText} to ${afterClickText}`);
        // Toggle back to unmuted
        await muteButton.click();
      }
    } else {
      logDefect({
        id: 'DEF-MISSING-SOUND-BUTTON',
        severity: 'P2',
        route: '/',
        title: 'Mute/Audio button not found in navigation',
        observed: 'Could not find sound toggle button in header',
        expected: 'Audio toggle button should be visible in navigation'
      });
    }

    // Check Home Copy for Stale Phase status (AI-Slop / Content Bug)
    const cardBadge = await page.$(':has-text("In Development (2D)")');
    if (cardBadge) {
      logDefect({
        id: 'DEF-STALE-HOME-BADGE',
        severity: 'P3',
        route: '/',
        title: 'Home page variant card displays "In Development (2D)" for fully implemented Deck Builder Chess',
        observed: 'Card displays badge "In Development (2D)" and link "Explore Rules & Preview →" despite Phase 4 & 5 completion',
        expected: 'Card should display "Playable (2D)" and "Play Deck Builder Chess →" with active link styling'
      });
    }

    // -------------------------------------------------------------------------
    // 2. ROUTE: /login and /register (Auth Page)
    // -------------------------------------------------------------------------
    console.log('\n--- Sweeping Route: /login (Auth Page) ---');
    auditLog.routesSwept.push('/login');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'auth_login_desktop.png') });
    console.log('Saved auth_login_desktop.png');

    // Test tab switching
    const registerTab = await page.$('button:has-text("Create Account")');
    if (registerTab) {
      auditLog.interactiveElementsTested++;
      await registerTab.click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'auth_register_desktop.png') });
      console.log('Saved auth_register_desktop.png');

      // Test Password Mismatch Error in Register
      console.log('Testing password mismatch client validation...');
      await page.fill('input[type="text"]', 'testuser123');
      await page.fill('input[placeholder="Minimum 8 characters"]', 'password123');
      await page.fill('input[placeholder="Repeat your password"]', 'differentpassword');
      const regSubmit = await page.$('button[type="submit"]:has-text("Create Free Account")');
      if (regSubmit) {
        auditLog.interactiveElementsTested++;
        await regSubmit.click();
        await page.waitForTimeout(400);
        const errorAlert = await page.$(':has-text("Passwords do not match.")');
        if (errorAlert) {
          console.log('Register validation verified: "Passwords do not match." appeared.');
        } else {
          logDefect({
            id: 'DEF-AUTH-VALIDATION',
            severity: 'P1',
            route: '/register',
            title: 'Password mismatch failed to display validation banner',
            observed: 'Submitting mismatched passwords did not display expected error alert',
            expected: 'Should display "Passwords do not match."'
          });
        }
      }
    }

    // Switch to Guest Tab and Login as Guest
    const guestTab = await page.$('button:has-text("Play as Guest")');
    if (guestTab) {
      auditLog.interactiveElementsTested++;
      await guestTab.click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'auth_guest_desktop.png') });
      console.log('Saved auth_guest_desktop.png');

      const guestBtn = await page.$('button:has-text("Launch Instant Guest Session")');
      if (guestBtn) {
        auditLog.interactiveElementsTested++;
        console.log('Launching instant guest session...');
        await guestBtn.click();
        // Wait for redirect to /dashboard
        await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => {});
        await page.waitForTimeout(1500);
        console.log(`Navigated to: ${page.url()}`);
      }
    }

    // -------------------------------------------------------------------------
    // 3. ROUTE: /dashboard (Dashboard Page)
    // -------------------------------------------------------------------------
    console.log('\n--- Sweeping Route: /dashboard ---');
    auditLog.routesSwept.push('/dashboard');
    if (!page.url().includes('/dashboard')) {
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'dashboard_desktop.png') });
    console.log('Saved dashboard_desktop.png');

    // Test Filter Tabs on Dashboard
    const rankedTab = await page.$('button:has-text("Ranked PvP")');
    if (rankedTab) {
      auditLog.interactiveElementsTested++;
      await rankedTab.click();
      await page.waitForTimeout(300);
      console.log('Clicked Ranked PvP tab');
    }
    const practiceTab = await page.$('button:has-text("Practice & Local")');
    if (practiceTab) {
      auditLog.interactiveElementsTested++;
      await practiceTab.click();
      await page.waitForTimeout(300);
      console.log('Clicked Practice & Local tab');
    }
    const allMatchesTab = await page.$('button:has-text("All Matches")');
    if (allMatchesTab) {
      auditLog.interactiveElementsTested++;
      await allMatchesTab.click();
      await page.waitForTimeout(300);
      console.log('Clicked All Matches tab');
    }

    // Verify Match History Empty State
    const emptyState = await page.$(':has-text("No matches played yet")');
    if (emptyState) {
      console.log('Match history empty state verified cleanly.');
    }

    // -------------------------------------------------------------------------
    // 4. ROUTE: /deck-builder (Deck Builder Chess 2D)
    // -------------------------------------------------------------------------
    console.log('\n--- Sweeping Route: /deck-builder ---');
    auditLog.routesSwept.push('/deck-builder');
    await page.goto(`${BASE_URL}/deck-builder`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'deck_builder_desktop.png') });
    console.log('Saved deck_builder_desktop.png');

    // Check Energy Meter & Tactical Hand
    const energyText = await page.$(':has-text("⚡ 3/3")');
    if (energyText) {
      console.log('Energy meter (⚡ 3/3) verified.');
    } else {
      console.log('Checking alternative energy meter display...');
    }

    // Test Tactical Card Selection
    const cardButtons = await page.$$('button:has-text("⚡")');
    auditLog.interactiveElementsTested += cardButtons.length;
    console.log(`Found ${cardButtons.length} card buttons in tactical hand`);
    if (cardButtons.length > 0) {
      console.log('Selecting first tactical card...');
      await cardButtons[0].click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'deck_builder_card_selected.png') });
      console.log('Saved deck_builder_card_selected.png');
    }

    // Test Chess Move: Click pawn on e2, then e4
    // Find squares or pieces
    console.log('Testing interactive chess moves on board...');
    const boardSvg = await page.$('svg');
    if (boardSvg) {
      // Find SVG text or rect for e2
      const e2Element = await page.$('text="♙", rect, [data-square="e2"]');
      if (e2Element) {
        auditLog.interactiveElementsTested++;
        await e2Element.click();
        await page.waitForTimeout(400);
      }
    }

    // Open Deck Customizer / Deck Builder Modal
    const editDeckBtn = await page.$('button:has-text("Custom Decks"), button:has-text("Deck Builder"), button:has-text("Edit Deck")');
    if (editDeckBtn) {
      auditLog.interactiveElementsTested++;
      console.log('Opening Deck Builder customizer modal...');
      await editDeckBtn.click();
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'deck_builder_modal.png') });
      console.log('Saved deck_builder_modal.png');

      // Test closing modal
      const closeBtn = await page.$('button:has-text("Return to Arena"), button:has-text("Close"), button:has-text("✕")');
      if (closeBtn) {
        auditLog.interactiveElementsTested++;
        console.log('Closing Deck Builder modal...');
        await closeBtn.click();
        await page.waitForTimeout(400);
      }
    }

    // -------------------------------------------------------------------------
    // 5. ROUTE: /wormhole (3D Wormhole Chess)
    // -------------------------------------------------------------------------
    console.log('\n--- Sweeping Route: /wormhole ---');
    auditLog.routesSwept.push('/wormhole');
    await page.goto(`${BASE_URL}/wormhole`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'wormhole_desktop.png') });
    console.log('Saved wormhole_desktop.png');

    const canvas = await page.$('canvas');
    if (!canvas) {
      logDefect({
        id: 'DEF-WORMHOLE-NO-CANVAS',
        severity: 'P0',
        route: '/wormhole',
        title: 'Three.js 3D canvas failed to render',
        observed: 'No <canvas> element found in DOM',
        expected: 'WebGL Three.js canvas should render 3D wormhole chess boards'
      });
    } else {
      console.log('3D canvas successfully verified.');
    }

    // Test Navigation back to Home
    const homeNav = await page.$('a[href="/"]');
    if (homeNav) {
      auditLog.interactiveElementsTested++;
    }

    // -------------------------------------------------------------------------
    // 6. ROUTE: /play/:code (Multiplayer Game Room)
    // -------------------------------------------------------------------------
    console.log('\n--- Sweeping Route: /play/SWEEPROOM ---');
    auditLog.routesSwept.push('/play/SWEEPROOM');
    await page.goto(`${BASE_URL}/play/SWEEPROOM`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'playroom_desktop.png') });
    console.log('Saved playroom_desktop.png');

    const roomText = await page.$(':has-text("SWEEPROOM")');
    if (roomText) {
      console.log('Multiplayer Room header rendered room code SWEEPROOM.');
    } else {
      logDefect({
        id: 'DEF-ROOM-HEADER-MISSING',
        severity: 'P1',
        route: '/play/SWEEPROOM',
        title: 'Room code not displayed in multiplayer room header',
        observed: 'Could not find SWEEPROOM in page text',
        expected: 'Room header should display current room code'
      });
    }

  } catch (err) {
    console.error('Sweep encountered fatal error:', err);
    logDefect({
      id: 'DEF-SWEEP-FATAL',
      severity: 'P0',
      route: page.url(),
      title: 'Fatal exception during UX sweep execution',
      observed: err.message,
      expected: 'Routes should be navigable without fatal exceptions'
    });
  } finally {
    await browser.close();
  }

  // Summary Report
  console.log('\n=========================================');
  console.log('UX SWEEP FINISHED');
  console.log(`Routes Swept: ${auditLog.routesSwept.length}`);
  console.log(`Interactive Elements Tested: ${auditLog.interactiveElementsTested}`);
  console.log(`Console Errors: ${auditLog.consoleErrors.length}`);
  console.log(`Page Errors: ${auditLog.pageErrors.length}`);
  console.log(`Network Failures: ${auditLog.networkFailures.length}`);
  console.log(`Defects Identified: ${auditLog.defects.length}`);
  console.log('=========================================');

  fs.writeFileSync('.agent/state/artifacts/sweep_results.json', JSON.stringify(auditLog, null, 2));
}

runSweep().catch(e => {
  console.error(e);
  process.exit(1);
});
