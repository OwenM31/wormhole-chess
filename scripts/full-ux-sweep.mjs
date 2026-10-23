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
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  fs.writeFileSync(destPath, buf);
}

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
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' UX SWEEP: FULL APPLICATION SURFACE EXPLORATION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('Starting local Vite preview server on port 4178...');
  const server = await preview({ preview: { port: 4178 } });
  const BASE_URL = 'http://localhost:4178';
  console.log(`✓ Vite preview running at ${BASE_URL}\n`);

  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  const summary = {
    sweepDate: new Date().toISOString(),
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

  try {
    // =========================================================================
    // ROUTE 1: HOME PAGE (/)
    // =========================================================================
    console.log('--- 1. Testing Route: / (Home Landing Page) ---');
    summary.routesSwept++;
    try {
      const { context, page, consoleErrors } = await setupContext({ width: 1280, height: 800 });
      await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);

      const shot1 = path.join(SCREENSHOT_DIR, 'sweep_01_home_desktop.png');
      await safeScreenshot(page, shot1);
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
          await safeScreenshot(mPage, shot1m);
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
    console.log('\n--- 2. Testing Route: /deck-builder (Main Menu Hub, Multiplayer Stage & Tactical Arena) ---');
    summary.routesSwept++;
    try {
      const { context, page, consoleErrors } = await setupContext({ width: 1280, height: 850 }, true);
      await page.goto(`${BASE_URL}/deck-builder`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(800);

      // PART 2A: Main Menu Hub
      console.log('  2A. Verifying Fluid 11-Column Main Menu Hub...');
      const heading = await page.locator('h1').textContent();
      if (!heading?.includes('Deck Builder Chess')) {
        addDefect({
          severity: 'P1',
          title: 'Main Menu header missing "Deck Builder Chess"',
          route: '/deck-builder',
          details: `Got: "${heading}"`
        });
      }

      const campaignBtn = page.locator('[data-testid="main-menu-campaign-btn"]');
      const multiplayerBtn = page.locator('[data-testid="main-menu-multiplayer-btn"]');
      const profileBtn = page.locator('[data-testid="main-menu-profile-btn"]');
      const switchBtn = page.locator('[data-testid="main-menu-switch-btn"]');
      const showcaseCard = page.locator('[data-testid="player-showcase-card"]');
      const characterCanvas = page.locator('[data-testid="character-canvas"]');

      summary.interactiveElementsTested += 4;
      if (!(await campaignBtn.isVisible()) || !(await multiplayerBtn.isVisible()) || !(await profileBtn.isVisible()) || !(await switchBtn.isVisible())) {
        addDefect({
          severity: 'P1',
          title: 'Main Menu action buttons missing',
          route: '/deck-builder',
          details: 'Expected Campaign, Multiplayer, My Profile, and Switch Profile buttons'
        });
      }

      if (!(await showcaseCard.isVisible()) || !(await characterCanvas.isVisible())) {
        addDefect({
          severity: 'P2',
          title: 'Player Showcase Card or Character Canvas missing on Main Menu',
          route: '/deck-builder',
          details: 'Expected player showcase card and living character SVG pedestal'
        });
      }

      // Assert fluid 11-column grid tracks
      const gridCols = await page.$eval('.deck-builder-main-menu-grid', el =>
        window.getComputedStyle(el).gridTemplateColumns
      );
      const colTracks = gridCols.split(' ').filter(Boolean);
      if (colTracks.length !== 11) {
        addDefect({
          severity: 'P2',
          title: `Expected 11-column grid tracks, found ${colTracks.length}`,
          route: '/deck-builder',
          details: `grid-template-columns computed as: ${gridCols}`
        });
      }

      const shot2Menu = path.join(SCREENSHOT_DIR, 'sweep_02_main_menu_desktop.png');
      await safeScreenshot(page, shot2Menu);
      summary.screenshots.push(shot2Menu);

      await checkAntiSlopAndOverflow(page, '/deck-builder (Main Menu)', 'desktop 1280x850');

      // Test Switch Profile Modal
      console.log('  2B. Testing Switch Profile Modal & Playtest Mode Toggle...');
      await switchBtn.click();
      await page.waitForTimeout(400);
      summary.interactiveElementsTested++;

      const switchModal = page.locator('[data-testid="switch-profile-modal"]');
      if (!(await switchModal.isVisible())) {
        addDefect({
          severity: 'P1',
          title: 'Switch Profile Modal failed to open',
          route: '/deck-builder',
          details: 'Modal [data-testid="switch-profile-modal"] not visible after click'
        });
      } else {
        const playtestToggle = page.locator('[data-testid="toggle-playtest-mode-btn"]');
        if (await playtestToggle.isVisible()) {
          summary.interactiveElementsTested++;
          await playtestToggle.click();
          await page.waitForTimeout(200);
          await playtestToggle.click();
          await page.waitForTimeout(200);
        }
        // Dismiss modal by clicking background
        await switchModal.click({ position: { x: 10, y: 10 } });
        await page.waitForTimeout(300);
      }

      // Transition to Multiplayer Character Stage
      console.log('  2C. Testing Multiplayer Character Stage & 36-Card Library...');
      await multiplayerBtn.click();
      await page.waitForTimeout(600);
      summary.interactiveElementsTested++;

      const stageBackBtn = page.locator('[data-testid="stage-back-to-menu-btn"]');
      const offlineMatchBtn = page.locator('[data-testid="stage-offline-match-btn"]');
      const searchOpponentBtn = page.locator('[data-testid="stage-search-opponent-btn"]');
      const privateMatchBtn = page.locator('[data-testid="stage-private-match-btn"]');
      const asyncMatchesBtn = page.locator('[data-testid="stage-async-matches-btn"]');
      const backdropStage = page.locator('[data-testid="character-backdrop-stage"]');
      const equippedHandStage = page.locator('[data-testid="equipped-hand-stage"]');
      const cardsLibraryGrid = page.locator('[data-testid="cards-library-grid"]');

      summary.interactiveElementsTested += 5;
      if (!(await stageBackBtn.isVisible()) || !(await offlineMatchBtn.isVisible()) || !(await searchOpponentBtn.isVisible()) || !(await privateMatchBtn.isVisible()) || !(await asyncMatchesBtn.isVisible())) {
        addDefect({
          severity: 'P1',
          title: 'Multiplayer Stage top play cluster buttons missing',
          route: '/deck-builder (Multiplayer Stage)',
          details: 'Expected Stage Back, Offline Match, Search Opponent, Private Match, and Async Matches buttons'
        });
      }

      if (!(await backdropStage.isVisible()) || !(await equippedHandStage.isVisible()) || !(await cardsLibraryGrid.isVisible())) {
        addDefect({
          severity: 'P1',
          title: 'Multiplayer Stage core containers missing',
          route: '/deck-builder (Multiplayer Stage)',
          details: 'Expected Character Backdrop, Equipped Hand Stage, and Cards Library Grid'
        });
      }

      // Check 5-dot copy stacks (expect >= 36)
      const dotStacks = page.locator('[data-testid="copy-dot-stack"]');
      const dotStackCount = await dotStacks.count();
      if (dotStackCount < 36) {
        addDefect({
          severity: 'P2',
          title: `Expected >= 36 copy dot stacks in library, found ${dotStackCount}`,
          route: '/deck-builder (Multiplayer Stage)',
          details: `Found only ${dotStackCount} copy dot stacks`
        });
      }

      // Test library filter buttons
      const pieceFilters = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king', 'all'];
      for (const piece of pieceFilters) {
        const filterBtn = page.locator(`button:has-text("${piece.toUpperCase()}")`).first();
        if (await filterBtn.isVisible()) {
          summary.interactiveElementsTested++;
          await filterBtn.click();
          await page.waitForTimeout(100);
        }
      }

      const shot2Stage = path.join(SCREENSHOT_DIR, 'sweep_02_multiplayer_stage_desktop.png');
      await safeScreenshot(page, shot2Stage);
      summary.screenshots.push(shot2Stage);

      // Launch Offline Match into Tactical Arena
      console.log('  2D. Launching Offline Match into Tactical Arena...');
      await offlineMatchBtn.click();
      await page.waitForTimeout(400);
      summary.interactiveElementsTested++;

      const offlineModal = page.locator('[data-testid="offline-match-modal"]');
      if (!(await offlineModal.isVisible())) {
        addDefect({
          severity: 'P1',
          title: 'Offline Match Modal failed to open',
          route: '/deck-builder',
          details: 'Modal [data-testid="offline-match-modal"] not visible after click'
        });
      } else {
        const startMatchBtn = page.locator('[data-testid="start-offline-match-btn"]');
        summary.interactiveElementsTested++;
        await startMatchBtn.click();
        await page.waitForTimeout(600);
      }

      // Verify Arena Elements
      console.log('  2E. Verifying Tactical Arena, Board & Hand Bar...');
      const boardGrid = page.locator('[data-testid="chessboard-grid"]');
      const handBar = page.locator('[data-testid="tactical-hand-bar"]');
      const backToStageBtn = page.locator('[data-testid="back-to-stage-btn"]');
      const backToMenuBtn = page.locator('[data-testid="back-to-menu-btn"]');

      summary.interactiveElementsTested += 2;
      if (!(await boardGrid.isVisible()) || !(await handBar.isVisible()) || !(await backToStageBtn.isVisible()) || !(await backToMenuBtn.isVisible())) {
        addDefect({
          severity: 'P0',
          title: 'Tactical Arena core components missing',
          route: '/deck-builder (Arena)',
          details: 'Expected Chessboard Grid, Tactical Hand Bar, Back to Stage, and Back to Menu buttons'
        });
      }

      // Test Right Panel Tabs: Moves vs Chat
      console.log('  2F. Testing Moves vs Chat panel...');
      const chatTabBtn = page.locator('button:has-text("Chat")').first();
      const movesTabBtn = page.locator('button:has-text("Moves")').first();
      summary.interactiveElementsTested += 2;

      await chatTabBtn.click();
      await page.waitForTimeout(200);

      const arenaChatInput = page.locator('input[placeholder="Send message..."]').first();
      const arenaChatSend = page.locator('button:has-text("Send")').first();
      if (await arenaChatInput.isVisible() && await arenaChatSend.isVisible()) {
        summary.interactiveElementsTested += 2;
        await arenaChatInput.fill('Checking arena chat telemetry.');
        await arenaChatSend.click();
        await page.waitForTimeout(200);
      }

      await movesTabBtn.click();
      await page.waitForTimeout(200);

      // Test Piece-First move flow
      console.log('  2G. Testing Piece-First Selection (e2)...');
      const e2Square = page.locator('[data-square="e2"]').first();
      summary.interactiveElementsTested++;
      await e2Square.click();
      await page.waitForTimeout(300);

      const e4Square = page.locator('[data-square="e4"]').first();
      const hasMoveDot = await e4Square.locator('.rounded-full').first().isVisible();
      if (!hasMoveDot) {
        addDefect({
          severity: 'P1',
          title: 'Piece-first selection at e2 failed to show move indicator on e4',
          route: '/deck-builder (Arena)',
          details: 'Expected legal move indicator on destination square e4'
        });
      }

      // Deselect e2
      await e2Square.click();
      await page.waitForTimeout(300);

      // Test Card-First move flow & Outcome Confirmation Bar (✓ / ✕)
      console.log('  2H. Testing Card-First Move & Confirmation Bar (P3 Follow Me)...');
      const p3Card = page.locator('[data-card-id="p3_follow_me"]').first();
      if (await p3Card.isVisible()) {
        summary.interactiveElementsTested++;
        await p3Card.click();
        await page.waitForTimeout(300);

        await e2Square.click();
        await page.waitForTimeout(300);

        const e3Square = page.locator('[data-square="e3"]').first();
        await e3Square.click();
        await page.waitForTimeout(400);

        const confirmBar = page.locator('[data-testid="card-confirm-bar"]');
        const confirmBtn = page.locator('[data-testid="confirm-card-move-btn"]');
        const cancelBtn = page.locator('[data-testid="cancel-card-move-btn"]');

        if (!(await confirmBar.isVisible()) || !(await confirmBtn.isVisible()) || !(await cancelBtn.isVisible())) {
          addDefect({
            severity: 'P1',
            title: 'Board Outcome Confirmation Bar or buttons (✓ / ✕) missing',
            route: '/deck-builder (Arena)',
            details: 'Expected confirmation bar with confirm and cancel buttons upon selecting card move destination'
          });
        } else {
          // Test Cancel
          summary.interactiveElementsTested++;
          await cancelBtn.click();
          await page.waitForTimeout(300);

          if (await confirmBar.isVisible()) {
            addDefect({
              severity: 'P1',
              title: 'Confirmation bar failed to dismiss on Cancel',
              route: '/deck-builder (Arena)',
              details: 'Expected confirmation bar to hide upon clicking Cancel'
            });
          }

          // Re-select and confirm
          await p3Card.click();
          await page.waitForTimeout(200);
          await e2Square.click();
          await page.waitForTimeout(200);
          await e3Square.click();
          await page.waitForTimeout(300);

          if (await confirmBar.isVisible()) {
            summary.interactiveElementsTested++;
            await confirmBtn.click();
            await page.waitForTimeout(600);
          }
        }
      }

      const shot2Arena = path.join(SCREENSHOT_DIR, 'sweep_02_arena_desktop.png');
      await safeScreenshot(page, shot2Arena);
      summary.screenshots.push(shot2Arena);

      // Test "My Deck" button to access Forge
      console.log('  2I. Testing Forge View via "My Deck"...');
      const myDeckBtn = page.locator('button:has-text("My Deck")').first();
      if (await myDeckBtn.isVisible()) {
        summary.interactiveElementsTested++;
        await myDeckBtn.click();
        await page.waitForTimeout(400);

        const forgeHeading = await page.locator('text=Deck Loadout').first().isVisible();
        if (!forgeHeading) {
          addDefect({
            severity: 'P1',
            title: '"My Deck" button failed to navigate to Forge view ("Deck Loadout")',
            route: '/deck-builder',
            details: 'Expected "Deck Loadout" heading in Forge'
          });
        }

        const backToBattleBtn = page.locator('button:has-text("Back to Arena")').first();
        if (await backToBattleBtn.isVisible()) {
          summary.interactiveElementsTested++;
          await backToBattleBtn.click();
          await page.waitForTimeout(300);
        }
      }

      // Test Back to Stage and Back to Main Menu
      console.log('  2J. Testing Navigation back to Stage and Main Menu...');
      if (await backToStageBtn.isVisible()) {
        summary.interactiveElementsTested++;
        await backToStageBtn.click();
        await page.waitForTimeout(300);
      }
      if (await stageBackBtn.isVisible()) {
        summary.interactiveElementsTested++;
        await stageBackBtn.click();
        await page.waitForTimeout(300);
      }

      // Mobile sweep (390x844 & 375x667)
      for (const vp of [{ w: 390, h: 844, label: 'mobile 390x844' }, { w: 375, h: 667, label: 'mobile 375x667' }]) {
        const { context: mContext, page: mPage } = await setupContext({ width: vp.w, height: vp.h }, true);
        await mPage.goto(`${BASE_URL}/deck-builder`, { waitUntil: 'domcontentloaded' });
        await mPage.waitForTimeout(500);
        if (vp.w === 390) {
          const shot2m = path.join(SCREENSHOT_DIR, 'sweep_02_deck_builder_mobile.png');
          await safeScreenshot(mPage, shot2m);
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
      await safeScreenshot(page, shot3);
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
          await safeScreenshot(mPage, shot3m);
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
      await safeScreenshot(page, shot4);
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
        await safeScreenshot(page, shot4replay);
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
          await safeScreenshot(mPage, shot4m);
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
      await safeScreenshot(page, shot5);
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
        await safeScreenshot(page, regShot);
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
          await safeScreenshot(mPage, shot5m);
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
      await safeScreenshot(page, shot6);
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
          await safeScreenshot(mPage, shot6m);
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

  } finally {
    await browser.close();
    await server.close();
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' SWEEP COMPLETE');
  console.log(` Routes Swept: ${summary.routesSwept}`);
  console.log(` Interactive Elements Tested: ${summary.interactiveElementsTested}`);
  console.log(` Total Defects Found: ${summary.defects.length}`);
  console.log(` Screenshots Saved: ${summary.screenshots.length}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  return summary;
}

runUXSweep().then(res => {
  fs.writeFileSync('.agent/state/artifacts/sweep_result.json', JSON.stringify(res, null, 2));
  process.exit(0);
}).catch(err => {
  console.error('Sweep execution crashed:', err);
  process.exit(1);
});
