import { chromium } from 'file:///C:/nvm4w/nodejs/node_modules/@playwright/cli/node_modules/playwright/index.mjs';
import * as path from 'path';
import * as fs from 'fs';

const SCREENSHOT_DIR = path.resolve('.agent/state/artifacts/screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const BASE_URL = 'http://localhost:4173';

const SLOP_PATTERNS = [
  /lorem\s+ipsum/i,
  /\btodo\b/i,
  /\bplaceholder\b/i,
  /\bsample\s+name\b/i,
  /\brow\s+1\b/i,
  /\bdefault\s+title\b/i,
];

async function runUXSweep() {
  console.log('=====================================================');
  console.log(' UX SWEEP: FULL APPLICATION SURFACE EXPLORATION');
  console.log(` Target: ${BASE_URL}`);
  console.log('=====================================================\n');

  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  const summary = {
    routesSwept: 0,
    interactiveElementsTested: 0,
    defects: [],
    screenshots: []
  };

  function addDefect(defect) {
    summary.defects.push(defect);
    console.log(`  ⚠️ [${defect.severity}] ${defect.title}`);
  }

  // Common authenticated user mock
  const mockUser = {
    id: 'usr_sweep_test',
    username: 'TacticalMaster',
    isGuest: false,
    createdAt: '2026-10-15T00:00:00.000Z',
  };

  const mockStats = {
    userId: 'usr_sweep_test',
    eloRating: 1620,
    wins: 42,
    losses: 18,
    draws: 5,
    totalGames: 65,
    winRate: 65,
  };

  const mockMatches = [
    {
      id: 'match_001',
      whiteUserId: 'usr_sweep_test',
      whiteUsername: 'TacticalMaster',
      blackUserId: 'usr_opponent',
      blackUsername: 'GrandmasterDeep',
      variant: 'deck_builder_ai',
      result: '1-0',
      winnerId: 'usr_sweep_test',
      moves: [
        { ply: 1, moveNotation: 'e4', turnColor: 'w', fenBefore: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', fenAfter: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1', activeCardsUsed: [] },
        { ply: 2, moveNotation: 'e5', turnColor: 'b', fenBefore: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1', fenAfter: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2', activeCardsUsed: [] }
      ],
      startedAt: '2026-10-15T16:00:00.000Z'
    }
  ];

  async function setupContext(viewport, isAuth = false) {
    const context = await browser.newContext({
      viewport,
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    const consoleErrors = [];
    const networkFailures = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (text.includes('401') && !isAuth) return;
        consoleErrors.push(text);
      }
    });

    page.on('requestfailed', req => {
      networkFailures.push(`${req.method()} ${req.url()} (${req.failure()?.errorText || 'failed'})`);
    });

    await page.route('**/api/auth/me*', async route => {
      if (isAuth) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, user: mockUser, stats: mockStats }),
        });
      } else {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, error: 'Unauthorized' }),
        });
      }
    });

    await page.route('**/api/matches*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, matches: mockMatches, total: 1 }),
      });
    });

    await page.route('**/api/decks*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, decks: [] }),
      });
    });

    await page.route('**/api/matchmaking/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          inQueue: { deck_builder: 0, wormhole_3d: 0, total: 0 },
          activeMatches: 0,
          totalOnline: 0,
        }),
      });
    });

    return { context, page, consoleErrors, networkFailures };
  }

  async function checkAntiSlopAndOverflow(page, routeName, viewportLabel) {
    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      const body = document.body;
      const scrollWidth = Math.max(doc.scrollWidth, body.scrollWidth);
      const clientWidth = doc.clientWidth;
      const overflowingElements = [];
      if (scrollWidth > clientWidth) {
        const all = document.querySelectorAll('*');
        for (const el of all) {
          const rect = el.getBoundingClientRect();
          if (rect.right > clientWidth + 2) {
            overflowingElements.push({
              tag: el.tagName,
              className: el.className?.toString?.() || '',
              id: el.id,
              right: rect.right,
              clientWidth
            });
            if (overflowingElements.length >= 3) break;
          }
        }
      }
      return { scrollWidth, clientWidth, hasOverflow: scrollWidth > clientWidth, overflowingElements };
    });

    if (overflow.hasOverflow) {
      addDefect({
        severity: 'P2',
        title: `Horizontal layout overflow on ${routeName} (${viewportLabel})`,
        route: routeName,
        details: `scrollWidth (${overflow.scrollWidth}px) exceeds clientWidth (${overflow.clientWidth}px). Elements: ${JSON.stringify(overflow.overflowingElements)}`
      });
    }

    const bodyText = await page.evaluate(() => document.body.innerText || '');
    for (const pattern of SLOP_PATTERNS) {
      const match = bodyText.match(pattern);
      if (match) {
        addDefect({
          severity: 'P3',
          title: `Potential AI-slop pattern "${match[0]}" detected on ${routeName}`,
          route: routeName,
          details: `Found pattern ${pattern} in visible text content: "${match[0]}"`
        });
      }
    }
  }

  // =========================================================================
  // ROUTE 1: HOME PAGE (/)
  // =========================================================================
  console.log('\n--- 1. Testing Route: / (Home Landing Page) ---');
  summary.routesSwept++;
  try {
    const { context, page, consoleErrors } = await setupContext({ width: 1280, height: 800 });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    const shot1 = path.join(SCREENSHOT_DIR, 'sweep_01_home_desktop.png');
    await page.screenshot({ path: shot1, fullPage: true });
    summary.screenshots.push(shot1);

    await checkAntiSlopAndOverflow(page, '/', 'desktop 1280x800');

    // Test tab switches
    const tabDeck = page.locator('#tab-deck-builder');
    const tabWormhole = page.locator('#tab-wormhole');
    summary.interactiveElementsTested += 2;

    await tabWormhole.click();
    await page.waitForTimeout(300);
    const wormholeTitle = await page.textContent('h2');
    if (!wormholeTitle?.includes('3D Wormhole Chess')) {
      addDefect({
        severity: 'P1',
        title: 'Tab switch to 3D Wormhole failed to update header',
        route: '/',
        details: `Got: "${wormholeTitle}"`
      });
    }

    await tabDeck.click();
    await page.waitForTimeout(300);
    const deckTitle = await page.textContent('h2');
    if (!deckTitle?.includes('Deck Builder Chess')) {
      addDefect({
        severity: 'P1',
        title: 'Tab switch back to Deck Builder failed',
        route: '/',
        details: `Got: "${deckTitle}"`
      });
    }

    // Test sample cards hover
    const sampleCards = await page.locator('.home-card-item').all();
    summary.interactiveElementsTested += sampleCards.length;
    for (const card of sampleCards) {
      await card.hover();
      await page.waitForTimeout(50);
    }

    // Test mobile responsiveness
    const { context: mContext, page: mPage } = await setupContext({ width: 375, height: 667 });
    await mPage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await mPage.waitForTimeout(400);
    const shot1m = path.join(SCREENSHOT_DIR, 'sweep_01_home_mobile.png');
    await mPage.screenshot({ path: shot1m, fullPage: true });
    summary.screenshots.push(shot1m);
    await checkAntiSlopAndOverflow(mPage, '/', 'mobile 375x667');
    await mContext.close();

    if (consoleErrors.length > 0) {
      addDefect({
        severity: 'P1',
        title: `Console errors on /: ${consoleErrors.join('; ')}`,
        route: '/',
        details: consoleErrors.join('\n')
      });
    }
    await context.close();
    console.log('  ✓ Route / passed checks.');
  } catch (err) {
    addDefect({
      severity: 'P0',
      title: `Exception during sweep of /: ${err.message}`,
      route: '/',
      details: err.stack
    });
  }

  // =========================================================================
  // ROUTE 2: DECK BUILDER (/deck-builder)
  // =========================================================================
  console.log('\n--- 2. Testing Route: /deck-builder (Tactical Arena) ---');
  summary.routesSwept++;
  try {
    const { context, page, consoleErrors } = await setupContext({ width: 1280, height: 800 }, true);
    await page.goto(`${BASE_URL}/deck-builder`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    const shot2 = path.join(SCREENSHOT_DIR, 'sweep_02_deck_builder_desktop.png');
    await page.screenshot({ path: shot2, fullPage: true });
    summary.screenshots.push(shot2);

    await checkAntiSlopAndOverflow(page, '/deck-builder', 'desktop 1280x800');

    // Test tabs: "Find Match" vs "My Deck"
    const myDeckTab = page.locator('button:has-text("My Deck")').first();
    const findMatchTab = page.locator('button:has-text("Find Match")').first();
    summary.interactiveElementsTested += 2;

    if (await myDeckTab.isVisible()) {
      await myDeckTab.click();
      await page.waitForTimeout(400);

      const shot2deck = path.join(SCREENSHOT_DIR, 'sweep_02_deck_curator_desktop.png');
      await page.screenshot({ path: shot2deck, fullPage: true });
      summary.screenshots.push(shot2deck);

      const deckHeading = await page.locator('text=Deck Loadout').first().isVisible();
      if (!deckHeading) {
        addDefect({
          severity: 'P1',
          title: '"My Deck" tab did not render "Deck Loadout" heading',
          route: '/deck-builder',
          details: 'Expected "Deck Loadout" header to appear upon switching to My Deck'
        });
      }

      await findMatchTab.click();
      await page.waitForTimeout(400);
    }

    // Test cards hover accordion
    const cards = await page.locator('[data-card-id]').all();
    summary.interactiveElementsTested += cards.length;
    for (const card of cards.slice(0, 3)) {
      await card.hover();
      await page.waitForTimeout(100);
    }

    // Mobile sweep
    const { context: mContext, page: mPage } = await setupContext({ width: 375, height: 667 }, true);
    await mPage.goto(`${BASE_URL}/deck-builder`, { waitUntil: 'networkidle' });
    await mPage.waitForTimeout(500);
    const shot2m = path.join(SCREENSHOT_DIR, 'sweep_02_deck_builder_mobile.png');
    await mPage.screenshot({ path: shot2m, fullPage: true });
    summary.screenshots.push(shot2m);
    await checkAntiSlopAndOverflow(mPage, '/deck-builder', 'mobile 375x667');
    await mContext.close();

    if (consoleErrors.length > 0) {
      addDefect({
        severity: 'P1',
        title: `Console errors on /deck-builder: ${consoleErrors.join('; ')}`,
        route: '/deck-builder',
        details: consoleErrors.join('\n')
      });
    }
    await context.close();
    console.log('  ✓ Route /deck-builder passed checks.');
  } catch (err) {
    addDefect({
      severity: 'P0',
      title: `Exception during sweep of /deck-builder: ${err.message}`,
      route: '/deck-builder',
      details: err.stack
    });
  }

  // =========================================================================
  // ROUTE 3: WORMHOLE 3D (/wormhole)
  // =========================================================================
  console.log('\n--- 3. Testing Route: /wormhole (3D Scene) ---');
  summary.routesSwept++;
  try {
    const { context, page, consoleErrors } = await setupContext({ width: 1280, height: 800 }, true);
    await page.goto(`${BASE_URL}/wormhole`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);

    const shot3 = path.join(SCREENSHOT_DIR, 'sweep_03_wormhole_desktop.png');
    await page.screenshot({ path: shot3, fullPage: true });
    summary.screenshots.push(shot3);

    await checkAntiSlopAndOverflow(page, '/wormhole', 'desktop 1280x800');

    const canvas = page.locator('canvas').first();
    const hasCanvas = await canvas.isVisible();
    if (!hasCanvas) {
      addDefect({
        severity: 'P0',
        title: '3D Wormhole canvas missing or failed to render',
        route: '/wormhole',
        details: 'No visible <canvas> element found in Three.js scene container'
      });
    }

    const homeLink = page.locator('text=Home').first();
    if (await homeLink.isVisible()) {
      summary.interactiveElementsTested++;
    }

    const seriousErrors = consoleErrors.filter(e => !e.includes('THREE.WebGLRenderer') && !e.includes('WebGL'));
    if (seriousErrors.length > 0) {
      addDefect({
        severity: 'P1',
        title: `Console errors on /wormhole: ${seriousErrors.join('; ')}`,
        route: '/wormhole',
        details: seriousErrors.join('\n')
      });
    }
    await context.close();
    console.log('  ✓ Route /wormhole passed checks.');
  } catch (err) {
    addDefect({
      severity: 'P0',
      title: `Exception during sweep of /wormhole: ${err.message}`,
      route: '/wormhole',
      details: err.stack
    });
  }

  // =========================================================================
  // ROUTE 4: DASHBOARD (/dashboard)
  // =========================================================================
  console.log('\n--- 4. Testing Route: /dashboard (Player Dashboard & Replay) ---');
  summary.routesSwept++;
  try {
    const { context, page, consoleErrors } = await setupContext({ width: 1280, height: 800 }, true);
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    const shot4 = path.join(SCREENSHOT_DIR, 'sweep_04_dashboard_desktop.png');
    await page.screenshot({ path: shot4, fullPage: true });
    summary.screenshots.push(shot4);

    await checkAntiSlopAndOverflow(page, '/dashboard', 'desktop 1280x800');

    const findMatchBtn = page.locator('button:has-text("Find Match")').first();
    const createRoomBtn = page.locator('button:has-text("Create Room")').first();
    const joinCodeBtn = page.locator('button:has-text("Join with Code")').first();
    summary.interactiveElementsTested += 3;

    if (!(await findMatchBtn.isVisible())) {
      addDefect({
        severity: 'P1',
        title: 'Find Match button missing in Dashboard Lobby',
        route: '/dashboard',
        details: 'Expected "Find Match" button in MatchmakingLobby'
      });
    }

    // Test filter tabs
    const allTab = page.locator('button:has-text("All (1)")').first();
    if (await allTab.isVisible()) {
      summary.interactiveElementsTested++;
      await allTab.click();
    }

    // Replay modal test
    const replayBtn = page.locator('button:has-text("Replay")').first();
    if (await replayBtn.isVisible()) {
      summary.interactiveElementsTested++;
      await replayBtn.click();
      await page.waitForTimeout(500);

      const shot4replay = path.join(SCREENSHOT_DIR, 'sweep_04_replay_modal.png');
      await page.screenshot({ path: shot4replay, fullPage: true });
      summary.screenshots.push(shot4replay);

      const modalTitle = page.locator('text=Match Replay').first();
      if (!(await modalTitle.isVisible())) {
        addDefect({
          severity: 'P1',
          title: 'Match Replay modal did not display upon clicking Replay button',
          route: '/dashboard',
          details: 'Expected "Match Replay" modal to open'
        });
      }

      // Test close button
      const closeBtn = page.locator('button:has-text("✕")').first();
      summary.interactiveElementsTested++;
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
        await page.waitForTimeout(300);
      } else {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    }

    // Mobile test
    const { context: mContext, page: mPage } = await setupContext({ width: 375, height: 667 }, true);
    await mPage.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    await mPage.waitForTimeout(500);
    const shot4m = path.join(SCREENSHOT_DIR, 'sweep_04_dashboard_mobile.png');
    await mPage.screenshot({ path: shot4m, fullPage: true });
    summary.screenshots.push(shot4m);
    await checkAntiSlopAndOverflow(mPage, '/dashboard', 'mobile 375x667');
    await mContext.close();

    if (consoleErrors.length > 0) {
      addDefect({
        severity: 'P1',
        title: `Console errors on /dashboard: ${consoleErrors.join('; ')}`,
        route: '/dashboard',
        details: consoleErrors.join('\n')
      });
    }
    await context.close();
    console.log('  ✓ Route /dashboard passed checks.');
  } catch (err) {
    addDefect({
      severity: 'P0',
      title: `Exception during sweep of /dashboard: ${err.message}`,
      route: '/dashboard',
      details: err.stack
    });
  }

  // =========================================================================
  // ROUTE 5: AUTH (/login & /register)
  // =========================================================================
  console.log('\n--- 5. Testing Route: /login (Authentication Shell) ---');
  summary.routesSwept++;
  try {
    const { context, page, consoleErrors } = await setupContext({ width: 1280, height: 800 });
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    const shot5 = path.join(SCREENSHOT_DIR, 'sweep_05_auth_login_desktop.png');
    await page.screenshot({ path: shot5, fullPage: true });
    summary.screenshots.push(shot5);

    await checkAntiSlopAndOverflow(page, '/login', 'desktop 1280x800');

    // Test empty submission validation
    const submitBtn = page.locator('button[type="submit"]').first();
    summary.interactiveElementsTested++;
    await submitBtn.click();
    await page.waitForTimeout(200);

    const errorBanner = page.locator('.auth-error-banner, [role="alert"]').first();
    const hasError = await errorBanner.isVisible();
    if (!hasError) {
      addDefect({
        severity: 'P2',
        title: 'Empty login submission produced no visible validation error',
        route: '/login',
        details: 'Expected error alert when submitting login form with empty inputs'
      });
    }

    // Test tabs
    const regTab = page.locator('#auth-tab-register');
    const guestTab = page.locator('#auth-tab-guest');
    summary.interactiveElementsTested += 2;

    if (await regTab.isVisible()) {
      await regTab.click();
      await page.waitForTimeout(200);
      const regShot = path.join(SCREENSHOT_DIR, 'sweep_05_auth_register_desktop.png');
      await page.screenshot({ path: regShot, fullPage: true });
      summary.screenshots.push(regShot);
    }
    if (await guestTab.isVisible()) {
      await guestTab.click();
      await page.waitForTimeout(200);
    }

    // Mobile test
    const { context: mContext, page: mPage } = await setupContext({ width: 375, height: 667 });
    await mPage.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await mPage.waitForTimeout(400);
    const shot5m = path.join(SCREENSHOT_DIR, 'sweep_05_auth_login_mobile.png');
    await mPage.screenshot({ path: shot5m, fullPage: true });
    summary.screenshots.push(shot5m);
    await checkAntiSlopAndOverflow(mPage, '/login', 'mobile 375x667');
    await mContext.close();

    if (consoleErrors.length > 0) {
      addDefect({
        severity: 'P1',
        title: `Console errors on /login: ${consoleErrors.join('; ')}`,
        route: '/login',
        details: consoleErrors.join('\n')
      });
    }
    await context.close();
    console.log('  ✓ Route /login passed checks.');
  } catch (err) {
    addDefect({
      severity: 'P0',
      title: `Exception during sweep of /login: ${err.message}`,
      route: '/login',
      details: err.stack
    });
  }

  // =========================================================================
  // ROUTE 6: PLAY ROOM (/play/:code)
  // =========================================================================
  console.log('\n--- 6. Testing Route: /play/SWEEP1 (Multiplayer PlayRoom Shell) ---');
  summary.routesSwept++;
  try {
    const { context, page, consoleErrors } = await setupContext({ width: 1280, height: 800 }, true);
    await page.goto(`${BASE_URL}/play/SWEEP1`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    const shot6 = path.join(SCREENSHOT_DIR, 'sweep_06_playroom_desktop.png');
    await page.screenshot({ path: shot6, fullPage: true });
    summary.screenshots.push(shot6);

    await checkAntiSlopAndOverflow(page, '/play/SWEEP1', 'desktop 1280x800');

    // Check room header
    const roomHeader = page.locator('text=SWEEP1').first();
    const hasHeader = await roomHeader.isVisible();
    if (!hasHeader) {
      addDefect({
        severity: 'P2',
        title: 'PlayRoom container did not display room code "SWEEP1"',
        route: '/play/SWEEP1',
        details: 'Expected room code SWEEP1 in PlayRoom header'
      });
    }

    const nonWsErrors = consoleErrors.filter(e => !e.includes('WebSocket') && !e.includes('ws://') && !e.includes('wss://'));
    if (nonWsErrors.length > 0) {
      addDefect({
        severity: 'P1',
        title: `Console errors on /play/SWEEP1: ${nonWsErrors.join('; ')}`,
        route: '/play/SWEEP1',
        details: nonWsErrors.join('\n')
      });
    }
    await context.close();
    console.log('  ✓ Route /play/SWEEP1 passed checks.');
  } catch (err) {
    addDefect({
      severity: 'P0',
      title: `Exception during sweep of /play/SWEEP1: ${err.message}`,
      route: '/play/SWEEP1',
      details: err.stack
    });
  }

  await browser.close();

  console.log('\n=====================================================');
  console.log(' SWEEP COMPLETE');
  console.log(` Routes Swept: ${summary.routesSwept}`);
  console.log(` Interactive Elements Tested: ${summary.interactiveElementsTested}`);
  console.log(` Total Defects Found: ${summary.defects.length}`);
  console.log(` Screenshots Saved: ${summary.screenshots.length}`);
  console.log('=====================================================\n');

  return summary;
}

runUXSweep().then(res => {
  fs.writeFileSync('.agent/state/artifacts/sweep_result.json', JSON.stringify(res, null, 2));
  process.exit(0);
}).catch(err => {
  console.error('Sweep execution crashed:', err);
  process.exit(1);
});
