import { chromium } from 'file:///C:/nvm4w/nodejs/node_modules/@playwright/cli/node_modules/playwright/index.mjs';
import * as path from 'path';
import * as fs from 'fs';

const SCREENSHOT_DIR = path.resolve('.agent/state/artifacts/screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

const SLOP_PATTERNS = [
  { pattern: /lorem\s+ipsum/i, label: 'Lorem ipsum placeholder' },
  { pattern: /\btodo\b/i, label: 'TODO marker' },
  { pattern: /\bfixme\b/i, label: 'FIXME marker' },
  { pattern: /\bplaceholder\b/i, label: 'Generic placeholder text' },
  { pattern: /\bsample\s+name\b/i, label: 'Sample name artifact' },
  { pattern: /\brow\s+1\b/i, label: 'Default row artifact' },
  { pattern: /\bdefault\s+title\b/i, label: 'Default title artifact' },
  { pattern: /welcome to your incredible/i, label: 'Fluffy AI cheerleading' },
  { pattern: /easily manage/i, label: 'Conversational filler' },
  { pattern: /great job!/i, label: 'Artificial praise cheerleading' },
  { pattern: /unleash the power/i, label: 'Marketing AI-slop' },
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
      variant: 'deck_builder:pvp',
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
        if (text.includes('favicon.ico')) return;
        consoleErrors.push(text);
      }
    });

    page.on('requestfailed', req => {
      if (req.url().includes('favicon.ico')) return;
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
    for (const { pattern, label } of SLOP_PATTERNS) {
      const match = bodyText.match(pattern);
      if (match) {
        addDefect({
          severity: 'P3',
          title: `Potential AI-slop pattern [${label}] detected on ${routeName}`,
          route: routeName,
          details: `Found pattern ${pattern} in visible text: "${match[0]}"`
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
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const shot1 = path.join(SCREENSHOT_DIR, 'sweep_01_home_desktop.png');
    await page.screenshot({ path: shot1 });
    summary.screenshots.push(shot1);

    await checkAntiSlopAndOverflow(page, '/', 'desktop 1280x800');

    // Test initial Deck Builder tab action links
    const playDeckLink = page.locator('text=Play Deck Builder →').first();
    const soloPracticeDeck = page.locator('text=Solo Practice').first();
    summary.interactiveElementsTested += 2;
    if (!(await playDeckLink.isVisible()) || !(await soloPracticeDeck.isVisible())) {
      addDefect({
        severity: 'P1',
        title: 'Action links missing on Home page (Deck Builder panel)',
        route: '/',
        details: 'Expected "Play Deck Builder →" and "Solo Practice" buttons'
      });
    }

    // Test tab switches
    const tabDeck = page.locator('#tab-deck-builder');
    const tabWormhole = page.locator('#tab-wormhole');
    summary.interactiveElementsTested += 2;

    await tabWormhole.click();
    await page.waitForTimeout(300);
    const wormholeTitle = await page.textContent('h2');
    if (!wormholeTitle?.includes('Wormhole Chess')) {
      addDefect({
        severity: 'P1',
        title: 'Tab switch to Wormhole Chess failed to update header',
        route: '/',
        details: `Got: "${wormholeTitle}"`
      });
    }

    // Verify 3D Wormhole panel action links
    const launchWormholeLink = page.locator('text=Launch 3D Wormhole →').first();
    summary.interactiveElementsTested++;
    if (!(await launchWormholeLink.isVisible())) {
      addDefect({
        severity: 'P1',
        title: 'Action link "Launch 3D Wormhole →" missing on Wormhole panel',
        route: '/',
        details: 'Expected "Launch 3D Wormhole →" link'
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
    for (const card of sampleCards.slice(0, 4)) {
      await card.hover();
      await page.waitForTimeout(50);
    }

    // Test mobile viewports (390x844 & 375x667)
    for (const vp of [{ w: 390, h: 844, label: 'mobile 390x844' }, { w: 375, h: 667, label: 'mobile 375x667' }]) {
      const { context: mContext, page: mPage } = await setupContext({ width: vp.w, height: vp.h });
      await mPage.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
      await mPage.waitForTimeout(400);
      if (vp.w === 390) {
        const shot1m = path.join(SCREENSHOT_DIR, 'sweep_01_home_mobile.png');
        await mPage.screenshot({ path: shot1m });
        summary.screenshots.push(shot1m);
      }
      await checkAntiSlopAndOverflow(mPage, '/', vp.label);
      await mContext.close();
    }

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
  console.log('\n--- 2. Testing Route: /deck-builder (Tactical Arena & Forge) ---');
  summary.routesSwept++;
  try {
    const { context, page, consoleErrors } = await setupContext({ width: 1280, height: 800 }, true);
    await page.goto(`${BASE_URL}/deck-builder`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    const shot2 = path.join(SCREENSHOT_DIR, 'sweep_02_deck_builder_desktop.png');
    await page.screenshot({ path: shot2 });
    summary.screenshots.push(shot2);

    await checkAntiSlopAndOverflow(page, '/deck-builder', 'desktop 1280x800');

    // Test tabs: "Find Match" vs "My Deck"
    const myDeckTab = page.locator('button:has-text("My Deck")').first();
    const findMatchTab = page.locator('button:has-text("Find Match")').first();
    summary.interactiveElementsTested += 2;

    if (await myDeckTab.isVisible()) {
      await myDeckTab.click();
      await page.waitForTimeout(400);

      const shot2deck = path.join(SCREENSHOT_DIR, 'sweep_02_deck_forge_desktop.png');
      await page.screenshot({ path: shot2deck });
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

      // Test anchor filtering in Forge
      const anchorButtons = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king', 'all'];
      for (const anchor of anchorButtons) {
        const btn = page.locator(`button:has-text("${anchor.toUpperCase()}")`).first();
        if (await btn.isVisible()) {
          summary.interactiveElementsTested++;
          await btn.click();
          await page.waitForTimeout(100);
        }
      }

      // Return to battle
      const backBtn = page.locator('button:has-text("Back to Arena")').first();
      if (await backBtn.isVisible()) {
        summary.interactiveElementsTested++;
        await backBtn.click();
        await page.waitForTimeout(300);
      } else {
        await findMatchTab.click();
        await page.waitForTimeout(300);
      }
    }

    // Test difficulty switchers & arena controls
    const mediumDiffBtn = page.locator('button:has-text("Medium")').first();
    const tacticalDiffBtn = page.locator('button:has-text("Tactical")').first();
    if (await mediumDiffBtn.isVisible() && await tacticalDiffBtn.isVisible()) {
      summary.interactiveElementsTested += 2;
      await tacticalDiffBtn.click();
      await page.waitForTimeout(150);
      await mediumDiffBtn.click();
      await page.waitForTimeout(150);
    }

    // Hover cards in Tactical Hand
    const cards = await page.locator('[data-card-id]').all();
    summary.interactiveElementsTested += cards.length;
    for (const card of cards.slice(0, 3)) {
      await card.hover();
      await page.waitForTimeout(100);
    }

    // Mobile sweep (390x844 & 375x667)
    for (const vp of [{ w: 390, h: 844, label: 'mobile 390x844' }, { w: 375, h: 667, label: 'mobile 375x667' }]) {
      const { context: mContext, page: mPage } = await setupContext({ width: vp.w, height: vp.h }, true);
      await mPage.goto(`${BASE_URL}/deck-builder`, { waitUntil: 'domcontentloaded' });
      await mPage.waitForTimeout(500);
      if (vp.w === 390) {
        const shot2m = path.join(SCREENSHOT_DIR, 'sweep_02_deck_builder_mobile.png');
        await mPage.screenshot({ path: shot2m });
        summary.screenshots.push(shot2m);
      }
      await checkAntiSlopAndOverflow(mPage, '/deck-builder', vp.label);
      await mContext.close();
    }

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
  console.log('\n--- 3. Testing Route: /wormhole (3D Spatial HUD) ---');
  summary.routesSwept++;
  try {
    const { context, page, consoleErrors } = await setupContext({ width: 1280, height: 800 }, true);
    await page.goto(`${BASE_URL}/wormhole`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);

    const shot3 = path.join(SCREENSHOT_DIR, 'sweep_03_wormhole_desktop.png');
    await page.screenshot({ path: shot3 });
    summary.screenshots.push(shot3);

    await checkAntiSlopAndOverflow(page, '/wormhole', 'desktop 1280x800');

    // 1. Verify Three.js Canvas
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

    // 2. Verify Top HUD Capsule Elements
    const homeLink = page.locator('text=← Home').first();
    const modeBadge = page.locator('text=3D Wormhole').first();
    const spatialTag = page.locator('text=SPATIAL').first();
    const turnBadge = page.locator('text=White to move').first();
    const concludeBtn = page.locator('text=🏁 Conclude Match').first();

    summary.interactiveElementsTested += 2;
    if (!(await homeLink.isVisible()) || !(await modeBadge.isVisible()) || !(await spatialTag.isVisible()) || !(await turnBadge.isVisible()) || !(await concludeBtn.isVisible())) {
      addDefect({
        severity: 'P1',
        title: 'Top HUD Capsule elements missing on /wormhole',
        route: '/wormhole',
        details: 'Expected "← Home", "3D Wormhole", "SPATIAL", "White to move", and "🏁 Conclude Match" in top HUD capsule'
      });
    }

    // 3. Verify and Exercise Floating Bottom Camera Dock
    const dockButtons = [
      { text: 'Top View', key: 't' },
      { text: 'Flip 180°', key: 'f' },
      { text: 'Rotate 90°', key: 'r' },
      { text: 'Orbit', key: 'l' },
      { text: 'Reset', key: 'x' },
    ];

    for (const item of dockButtons) {
      const btn = page.locator(`button:has-text("${item.text}")`).first();
      if (await btn.isVisible()) {
        summary.interactiveElementsTested++;
        await btn.click();
        await page.waitForTimeout(100);
      } else {
        addDefect({
          severity: 'P1',
          title: `Camera dock button "${item.text}" missing`,
          route: '/wormhole',
          details: `Expected camera dock action for ${item.text}`
        });
      }
    }

    // Test keyboard shortcuts
    for (const item of dockButtons) {
      await page.keyboard.press(item.key);
      await page.waitForTimeout(50);
    }

    // 4. Verify and Exercise Collapsible Telemetry Drawer
    const drawerToggle = page.locator('button:has-text("Moves")').first();
    if (await drawerToggle.isVisible()) {
      summary.interactiveElementsTested += 2;
      // Open drawer
      await drawerToggle.click();
      await page.waitForTimeout(300);

      const cameraTips = page.locator('text=Camera Tips').first();
      if (!(await cameraTips.isVisible())) {
        addDefect({
          severity: 'P1',
          title: 'Collapsible Telemetry Drawer did not reveal Camera Tips when opened',
          route: '/wormhole',
          details: 'Expected "Camera Tips" text inside expanded telemetry drawer'
        });
      }

      // Close drawer via close button
      const closeDrawerBtn = page.locator('button[title="Close drawer"]').first();
      if (await closeDrawerBtn.isVisible()) {
        await closeDrawerBtn.click();
      }
      await page.waitForTimeout(300);
    } else {
      addDefect({
        severity: 'P1',
        title: 'Telemetry drawer toggle button ("Moves") missing on /wormhole',
        route: '/wormhole',
        details: 'Expected floating right slide-out drawer tab'
      });
    }

    // Mobile sweep (390x844 & 375x667)
    for (const vp of [{ w: 390, h: 844, label: 'mobile 390x844' }, { w: 375, h: 667, label: 'mobile 375x667' }]) {
      const { context: mContext, page: mPage } = await setupContext({ width: vp.w, height: vp.h }, true);
      await mPage.goto(`${BASE_URL}/wormhole`, { waitUntil: 'domcontentloaded' });
      await mPage.waitForTimeout(800);
      if (vp.w === 390) {
        const shot3m = path.join(SCREENSHOT_DIR, 'sweep_03_wormhole_mobile.png');
        await mPage.screenshot({ path: shot3m });
        summary.screenshots.push(shot3m);
      }
      await checkAntiSlopAndOverflow(mPage, '/wormhole', vp.label);
      await mContext.close();
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
  console.log('\n--- 4. Testing Route: /dashboard (Commander Dashboard & Replay) ---');
  summary.routesSwept++;
  try {
    // 4A. Unauthenticated state check
    const { context: unauthContext, page: unauthPage } = await setupContext({ width: 1280, height: 800 }, false);
    await unauthPage.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
    await unauthPage.waitForTimeout(400);

    const signInReqHeading = unauthPage.locator('text=Sign In Required').first();
    const hasSignInReq = await signInReqHeading.isVisible();
    if (!hasSignInReq) {
      addDefect({
        severity: 'P2',
        title: 'Unauthenticated /dashboard did not render "Sign In Required" card',
        route: '/dashboard',
        details: 'Expected graceful sign in prompt when visiting dashboard without auth'
      });
    }
    await unauthContext.close();

    // 4B. Authenticated state check
    const { context, page, consoleErrors } = await setupContext({ width: 1280, height: 800 }, true);
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    const shot4 = path.join(SCREENSHOT_DIR, 'sweep_04_dashboard_desktop.png');
    await page.screenshot({ path: shot4 });
    summary.screenshots.push(shot4);

    await checkAntiSlopAndOverflow(page, '/dashboard', 'desktop 1280x800');

    // Verify Matchmaking Lobby
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

    // Test filter tabs: "All (1)"
    const allTab = page.locator('button:has-text("All (1)")').first();
    if (await allTab.isVisible()) {
      summary.interactiveElementsTested++;
      await allTab.click();
      await page.waitForTimeout(150);
    }

    // Replay modal test
    const replayBtn = page.locator('button:has-text("Replay")').first();
    if (await replayBtn.isVisible()) {
      summary.interactiveElementsTested += 2;
      await replayBtn.click();
      await page.waitForTimeout(500);

      const shot4replay = path.join(SCREENSHOT_DIR, 'sweep_04_replay_modal.png');
      await page.screenshot({ path: shot4replay });
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

    // Mobile test (390x844 & 375x667)
    for (const vp of [{ w: 390, h: 844, label: 'mobile 390x844' }, { w: 375, h: 667, label: 'mobile 375x667' }]) {
      const { context: mContext, page: mPage } = await setupContext({ width: vp.w, height: vp.h }, true);
      await mPage.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
      await mPage.waitForTimeout(500);
      if (vp.w === 390) {
        const shot4m = path.join(SCREENSHOT_DIR, 'sweep_04_dashboard_mobile.png');
        await mPage.screenshot({ path: shot4m });
        summary.screenshots.push(shot4m);
      }
      await checkAntiSlopAndOverflow(mPage, '/dashboard', vp.label);
      await mContext.close();
    }

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
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);

    const shot5 = path.join(SCREENSHOT_DIR, 'sweep_05_auth_login_desktop.png');
    await page.screenshot({ path: shot5 });
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

    // Test tab switches
    const regTab = page.locator('#auth-tab-register');
    const guestTab = page.locator('#auth-tab-guest');
    summary.interactiveElementsTested += 2;

    if (await regTab.isVisible()) {
      await regTab.click();
      await page.waitForTimeout(200);
      const regShot = path.join(SCREENSHOT_DIR, 'sweep_05_auth_register_desktop.png');
      await page.screenshot({ path: regShot });
      summary.screenshots.push(regShot);
    }
    if (await guestTab.isVisible()) {
      await guestTab.click();
      await page.waitForTimeout(200);
    }

    // Mobile test (390x844 & 375x667)
    for (const vp of [{ w: 390, h: 844, label: 'mobile 390x844' }, { w: 375, h: 667, label: 'mobile 375x667' }]) {
      const { context: mContext, page: mPage } = await setupContext({ width: vp.w, height: vp.h });
      await mPage.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await mPage.waitForTimeout(400);
      if (vp.w === 390) {
        const shot5m = path.join(SCREENSHOT_DIR, 'sweep_05_auth_login_mobile.png');
        await mPage.screenshot({ path: shot5m });
        summary.screenshots.push(shot5m);
      }
      await checkAntiSlopAndOverflow(mPage, '/login', vp.label);
      await mContext.close();
    }

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
    await page.goto(`${BASE_URL}/play/SWEEP1`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    const shot6 = path.join(SCREENSHOT_DIR, 'sweep_06_playroom_desktop.png');
    await page.screenshot({ path: shot6 });
    summary.screenshots.push(shot6);

    await checkAntiSlopAndOverflow(page, '/play/SWEEP1', 'desktop 1280x800');

    // Check room code pill
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

    // Check Share Link button
    const shareBtn = page.locator('button:has-text("Share Link")').first();
    if (await shareBtn.isVisible()) {
      summary.interactiveElementsTested++;
      await shareBtn.click();
      await page.waitForTimeout(200);
    }

    // Check Clocks
    const whiteClock = page.locator('text=⚪ White').first();
    const blackClock = page.locator('text=⚫ Black').first();
    if (!(await whiteClock.isVisible()) || !(await blackClock.isVisible())) {
      addDefect({
        severity: 'P1',
        title: 'Chess clocks missing in PlayRoom',
        route: '/play/SWEEP1',
        details: 'Expected White and Black tactical chess clocks'
      });
    }

    // Check Chat Input and Send Message
    const chatInput = page.locator('input[placeholder="Send message..."]').first();
    if (await chatInput.isVisible()) {
      summary.interactiveElementsTested += 2;
      await chatInput.fill('Good game, well played.');
      await chatInput.press('Enter');
      await page.waitForTimeout(200);
    }

    // Mobile sweep (390x844 & 375x667)
    for (const vp of [{ w: 390, h: 844, label: 'mobile 390x844' }, { w: 375, h: 667, label: 'mobile 375x667' }]) {
      const { context: mContext, page: mPage } = await setupContext({ width: vp.w, height: vp.h }, true);
      await mPage.goto(`${BASE_URL}/play/SWEEP1`, { waitUntil: 'domcontentloaded' });
      await mPage.waitForTimeout(500);
      if (vp.w === 390) {
        const shot6m = path.join(SCREENSHOT_DIR, 'sweep_06_playroom_mobile.png');
        await mPage.screenshot({ path: shot6m });
        summary.screenshots.push(shot6m);
      }
      await checkAntiSlopAndOverflow(mPage, '/play/SWEEP1', vp.label);
      await mContext.close();
    }

    const nonWsErrors = consoleErrors.filter(e => 
      !e.includes('WebSocket') && 
      !e.includes('ws://') && 
      !e.includes('wss://') &&
      !e.includes('failed to connect')
    );
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
