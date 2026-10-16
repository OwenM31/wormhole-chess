import { chromium } from 'file:///C:/nvm4w/nodejs/node_modules/@playwright/cli/node_modules/playwright/index.mjs';
import * as path from 'path';
import * as fs from 'fs';
import { preview } from 'vite';

const SCREENSHOT_DIR = path.resolve('.agent/state/artifacts/screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function verifyPhase1UX() {
  console.log('1. Starting local Vite preview server for Phase 1 verification...');
  const server = await preview({ preview: { port: 4174 } });
  const serverUrl = 'http://localhost:4174';
  console.log(`✓ Vite preview running at ${serverUrl}`);

  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  try {
    // -------------------------------------------------------------
    // Desktop Viewport Test (1280 x 800)
    // -------------------------------------------------------------
    console.log('\n2. Testing Desktop Viewport (1280x800)...');
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 2,
    });
    const desktopPage = await desktopContext.newPage();

    // Mock API endpoints
    await desktopPage.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: {
            id: 'usr_test123',
            username: 'GrandmasterX',
            isGuest: false,
            createdAt: '2026-10-14T20:00:00.000Z',
          },
          stats: {
            userId: 'usr_test123',
            eloRating: 1540,
            wins: 24,
            losses: 8,
            draws: 3,
            totalGames: 35,
            winRate: 69,
          },
        }),
      });
    });

    await desktopPage.route('**/api/matches**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          matches: [
            {
              id: 'match_01',
              variant: 'deck_builder:pvp',
              whiteUserId: 'usr_test123',
              whiteUsername: 'GrandmasterX',
              blackUserId: 'usr_rival',
              blackUsername: 'ChallengerAlpha',
              winnerId: 'usr_test123',
              result: '1-0',
              startedAt: '2026-10-15T12:00:00.000Z',
              moves: [
                {
                  turnNumber: 1,
                  player: 'w',
                  cardAction: { cardId: 'pawn_vanguard', anchorSquare: 'e2', targetSquare: 'e5' },
                  chessMove: { from: 'g1', to: 'f3' },
                  fenAfter: 'rnbqkbnr/pppppppp/8/4P3/8/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 1',
                },
                {
                  turnNumber: 2,
                  player: 'b',
                  chessMove: { from: 'b8', to: 'c6' },
                  fenAfter: 'r1bqkbnr/pppppppp/2n5/4P3/8/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 2',
                },
              ],
            },
          ],
        }),
      });
    });

    await desktopPage.route('**/api/matchmaking/stats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          inQueue: { deck_builder: 4, wormhole_3d: 2, total: 6 },
          activeMatches: 8,
          totalOnline: 22,
        }),
      });
    });

    await desktopPage.goto(`${serverUrl}/dashboard`, { waitUntil: 'networkidle' });
    await desktopPage.waitForTimeout(600);

    // Verify User-Approved Navigation Copy
    const headerText = await desktopPage.textContent('header');
    console.log('Checking Navigation copy in header...');
    if ((!headerText.includes('Wormhole Chess') && !headerText.includes('WormholeChess')) || !headerText.includes('Home') || !headerText.includes('Wormhole') || !headerText.includes('Deck Builder')) {
      throw new Error(`Navigation header does not contain approved copy: ${headerText}`);
    }
    console.log('✓ Navigation contains locked, approved copy.');

    // Verify Matchmaking Lobby elements
    const mmText = await desktopPage.textContent('body');
    if (!mmText.includes('Matchmaking') || !mmText.includes('Find Match')) {
      throw new Error('Matchmaking lobby missing from dashboard');
    }
    console.log('✓ Matchmaking lobby loaded with approved copy.');

    // Capture desktop full page screenshot
    const desktopScreenshotPath = path.join(SCREENSHOT_DIR, 'phase1_dashboard_desktop.png');
    await desktopPage.screenshot({ path: desktopScreenshotPath, fullPage: true });
    console.log(`✓ Desktop screenshot saved: ${desktopScreenshotPath}`);

    // Click Replay button to test HistoricalMatchViewer modal
    console.log('\n3. Testing HistoricalMatchViewer Replay Modal...');
    const replayBtn = await desktopPage.getByRole('button', { name: 'Replay' });
    await replayBtn.click();
    await desktopPage.waitForTimeout(600);

    const modalHeading = desktopPage.locator('h3', { hasText: 'Match Replay' });
    await modalHeading.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Match Replay modal opened cleanly.');

    const replayScreenshotPath = path.join(SCREENSHOT_DIR, 'phase1_replay_modal.png');
    await desktopPage.screenshot({ path: replayScreenshotPath });
    console.log(`✓ Replay modal screenshot saved: ${replayScreenshotPath}`);

    // Close modal
    const closeBtn = await desktopPage.getByTitle('Close Replay');
    await closeBtn.click();
    await desktopPage.waitForTimeout(400);

    // -------------------------------------------------------------
    // Mobile Viewport Test (375 x 667)
    // -------------------------------------------------------------
    console.log('\n4. Testing Mobile Viewport (375x667)...');
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 667 },
      deviceScaleFactor: 2,
    });
    const mobilePage = await mobileContext.newPage();

    // Mock API routes for mobile context as well
    await mobilePage.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: { id: 'usr_test123', username: 'GrandmasterX', isGuest: false, createdAt: '2026-10-14T20:00:00.000Z' },
          stats: { userId: 'usr_test123', eloRating: 1540, wins: 24, losses: 8, draws: 3, totalGames: 35, winRate: 69 },
        }),
      });
    });

    await mobilePage.route('**/api/matches**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          matches: [
            {
              id: 'match_01',
              variant: 'deck_builder:pvp',
              whiteUserId: 'usr_test123',
              whiteUsername: 'GrandmasterX',
              blackUserId: 'usr_rival',
              blackUsername: 'ChallengerAlpha',
              winnerId: 'usr_test123',
              result: '1-0',
              startedAt: '2026-10-15T12:00:00.000Z',
              moves: [],
            },
          ],
        }),
      });
    });

    await mobilePage.route('**/api/matchmaking/stats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          inQueue: { deck_builder: 4, wormhole_3d: 2, total: 6 },
          activeMatches: 8,
          totalOnline: 22,
        }),
      });
    });

    await mobilePage.goto(`${serverUrl}/dashboard`, { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(600);

    // Verify no horizontal overflow on mobile
    const scrollWidth = await mobilePage.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await mobilePage.evaluate(() => document.documentElement.clientWidth);
    console.log(`Mobile dimensions: scrollWidth=${scrollWidth}, clientWidth=${clientWidth}`);

    const overflowingElements = await mobilePage.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      return elements
        .filter(el => {
          const rect = el.getBoundingClientRect();
          return rect.right > window.innerWidth + 2 || el.scrollWidth > window.innerWidth + 2;
        })
        .map(el => ({
          tag: el.tagName,
          className: el.className,
          scrollWidth: el.scrollWidth,
          right: Math.round(el.getBoundingClientRect().right),
          snippet: el.outerHTML.substring(0, 120),
        }));
    });
    console.log('Overflowing elements found:', JSON.stringify(overflowingElements.slice(0, 8), null, 2));

    if (scrollWidth > clientWidth + 2) {
      throw new Error(`Horizontal scroll detected on mobile! scrollWidth=${scrollWidth} > clientWidth=${clientWidth}`);
    }
    console.log('✓ No horizontal scrolling detected on 375px mobile viewport.');

    const mobileScreenshotPath = path.join(SCREENSHOT_DIR, 'phase1_dashboard_mobile.png');
    await mobilePage.screenshot({ path: mobileScreenshotPath, fullPage: true });
    console.log(`✓ Mobile screenshot saved: ${mobileScreenshotPath}`);

    console.log('\n======================================================');
    console.log('PHASE 1 VISUAL CRAFT & INTERACTION VERIFIED: PASS!');
    console.log('======================================================');
  } finally {
    await browser.close();
    server.httpServer.close();
  }
}

verifyPhase1UX().catch((err) => {
  console.error('Phase 1 UX verification failed:', err);
  process.exit(1);
});
