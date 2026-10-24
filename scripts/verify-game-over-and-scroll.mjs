import { chromium } from 'file:///C:/nvm4w/nodejs/node_modules/@playwright/cli/node_modules/playwright/index.mjs';
import { preview } from 'vite';
import assert from 'assert';

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' GAME OVER REVIEW & MOVE LOG SCROLL E2E TEST');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Launch Vite preview server
  const server = await preview({
    preview: { port: 4184 },
  });
  console.log('✓ Vite preview server running on port 4184');

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 375, height: 667 } }); // Mobile viewport
  const page = await context.newPage();

  try {
    // Mock auth API
    await page.route('**/api/auth/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, decks: [] }),
      });
    });

    console.log('1. Navigating to /deck-builder on mobile (375x667)...');
    await page.goto('http://localhost:4184/deck-builder', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    console.log('2. Entering Matchmaking Stage and starting Offline Match...');
    const multiplayerBtn = page.locator('[data-testid="main-menu-multiplayer-btn"]');
    await multiplayerBtn.click();
    await page.waitForTimeout(600);

    const offlineBtn = page.locator('[data-testid="stage-offline-match-btn"]');
    await offlineBtn.click();
    await page.waitForTimeout(400);

    const startBtn = page.locator('[data-testid="start-offline-match-btn"]');
    await startBtn.click();
    await page.waitForTimeout(800);

    // Verify chessboard loaded
    const board = page.locator('[data-testid="chessboard-grid"]');
    await board.waitFor({ state: 'visible', timeout: 5000 });
    console.log('   ✓ In-game Arena loaded on mobile');

    // 3. Test Move Log: Execute a move and verify page didn't scroll down
    console.log('3. Testing move log auto-scroll behavior on mobile...');
    const initialScrollY = await page.evaluate(() => window.scrollY);
    
    // Make move e2-e4
    const e2 = page.locator('[data-testid="square-e2"]');
    await e2.click();
    const e4 = page.locator('[data-testid="square-e4"]');
    await e4.click();
    await page.waitForTimeout(1000);

    const afterMoveScrollY = await page.evaluate(() => window.scrollY);
    console.log(`   Initial scrollY: ${initialScrollY}, after move scrollY: ${afterMoveScrollY}`);
    assert(afterMoveScrollY <= 50, `Window should NOT jump to bottom of page (scrollY was ${afterMoveScrollY})`);
    console.log('   ✓ Page window stayed anchored to top / chessboard!');

    // 4. Test Game Over modal dismiss and review board
    console.log('4. Triggering game-over state to test modal dismiss...');
    // We can evaluate game over or click resignation / trigger state in page
    await page.evaluate(() => {
      // Access game or dispatch resign
      const resignBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Resign'));
      if (resignBtn) resignBtn.click();
    });

    // Check if confirm resign modal appears or if resign button was clicked
    const confirmResign = page.locator('button:has-text("Confirm Resign")');
    if (await confirmResign.isVisible()) {
      await confirmResign.click();
    }

    // Now game over modal should appear
    const modalTitle = page.locator('h2:has-text("Defeat"), h2:has-text("Victory!"), h2:has-text("Draw")').first();
    await modalTitle.waitFor({ state: 'visible', timeout: 5000 });
    console.log('   ✓ Game Over modal displayed');

    // Check for "Back to Matchmaking" and "Review Board" buttons
    const backToMatchmakingBtn = page.locator('button:has-text("Back to Matchmaking")').first();
    assert(await backToMatchmakingBtn.isVisible(), 'Back to Matchmaking button must be visible');
    console.log('   ✓ "Back to Matchmaking" button verified');

    const reviewBoardBtn = page.locator('button:has-text("Review Board")').first();
    assert(await reviewBoardBtn.isVisible(), 'Review Board button must be visible');
    console.log('   ✓ "Review Board" button verified');

    // Click "Review Board"
    await reviewBoardBtn.click();
    await page.waitForTimeout(400);

    // Modal should now be dismissed
    assert(!(await modalTitle.isVisible()), 'Full modal overlay must be dismissed');
    console.log('   ✓ Modal overlay successfully dismissed');

    // Floating review banner should be visible
    const showResultsBtn = page.locator('button:has-text("Show Results")').first();
    assert(await showResultsBtn.isVisible(), 'Show Results button on banner must be visible');
    console.log('   ✓ Floating banner visible with "Show Results" button');

    // Board should be visible underneath
    assert(await board.isVisible(), 'Chessboard must be clearly visible for inspection');
    console.log('   ✓ Chessboard visible for review');

    // Click "Show Results" to restore modal
    await showResultsBtn.click();
    await page.waitForTimeout(300);
    assert(await modalTitle.isVisible(), 'Modal should be restored when clicking Show Results');
    console.log('   ✓ Modal successfully restored');

    // Click "Back to Matchmaking"
    await backToMatchmakingBtn.click();
    await page.waitForTimeout(500);

    // We should be back on the multiplayer matchmaking stage
    const stageOfflineBtn = page.locator('[data-testid="stage-offline-match-btn"]');
    assert(await stageOfflineBtn.isVisible(), 'Should return to Multiplayer / Matchmaking stage');
    console.log('   ✓ Successfully returned to Matchmaking stage');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(' ALL GAME OVER & SCROLL ASSERTIONS PASSED ✓');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } finally {
    await browser.close();
    server.httpServer.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
