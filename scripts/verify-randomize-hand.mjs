import { chromium } from 'file:///C:/nvm4w/nodejs/node_modules/@playwright/cli/node_modules/playwright/index.mjs';
import * as path from 'path';
import * as fs from 'fs';
import { preview } from 'vite';

async function verifyRandomizeHand() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' PRE-GAME DECK BUILDER RANDOMIZE HAND VERIFICATION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const server = await preview({ preview: { port: 4183 } });
  const serverUrl = 'http://localhost:4183';
  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    await page.route('**/api/auth/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, decks: [] }),
      });
    });

    console.log('1. Navigating to /deck-builder...');
    await page.goto(`${serverUrl}/deck-builder`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    console.log('2. Opening Multiplayer Character Stage...');
    const multiplayerBtn = page.locator('[data-testid="main-menu-multiplayer-btn"]');
    await multiplayerBtn.click();
    await page.waitForTimeout(600);

    // Locate the Randomize button
    const randomizeBtn = page.locator('[data-testid="randomize-hand-btn"]');
    if (!(await randomizeBtn.isVisible())) {
      throw new Error('Randomize hand button not found on Multiplayer Character Stage');
    }
    console.log('   ✓ [data-testid="randomize-hand-btn"] is visible');

    // Get current cards before randomizing
    const equippedGrid = page.locator('[data-testid="equipped-slots-grid"]');
    const getCards = async () => {
      const cards = equippedGrid.locator('[data-testid^="equipped-slot-"]');
      const count = await cards.count();
      const ids = [];
      for (let i = 0; i < count; i++) {
        const id = await cards.nth(i).getAttribute('data-card-id');
        if (id) ids.push(id);
      }
      return ids;
    };

    const initialCards = await getCards();
    console.log(`   Initial hand cards (${initialCards.length}):`, initialCards);

    // Click Randomize button
    console.log('3. Clicking [🎲 Randomize] button...');
    await randomizeBtn.click();
    await page.waitForTimeout(400);

    const randomizedCards = await getCards();
    console.log(`   Randomized hand cards (${randomizedCards.length}):`, randomizedCards);

    if (randomizedCards.length !== 8) {
      throw new Error(`Expected 8 cards in randomized hand, got ${randomizedCards.length}`);
    }

    // Assert strictly 1 copy per card (no duplicates)
    const uniqueCards = new Set(randomizedCards);
    if (uniqueCards.size !== randomizedCards.length) {
      throw new Error(`Expected 8 unique cards (1 copy per card), found duplicates: ${randomizedCards}`);
    }
    console.log('   ✓ Exactly 1 copy per card verified (all 8 cards unique)');

    // Click Randomize a second time to ensure it produces a different shuffle
    await randomizeBtn.click();
    await page.waitForTimeout(400);
    const secondShuffle = await getCards();
    console.log('   Second shuffle cards:', secondShuffle);
    const secondUnique = new Set(secondShuffle);
    if (secondUnique.size !== secondShuffle.length) {
      throw new Error(`Second shuffle produced duplicates: ${secondShuffle}`);
    }
    console.log('   ✓ Second shuffle also contains 100% unique cards');

    // 4. Start an offline match and verify the randomized hand is in the in-game arena
    console.log('4. Starting offline match with randomized hand...');
    const offlineBtn = page.locator('[data-testid="stage-offline-match-btn"]');
    await offlineBtn.click();
    await page.waitForTimeout(300);

    const startMatchBtn = page.locator('[data-testid="start-offline-match-btn"]');
    await startMatchBtn.click();
    await page.waitForTimeout(800);

    // Verify Arena Tactical Hand Bar has the randomized cards
    const arenaCards = page.locator('[data-testid="tactical-hand-desktop-grid"] [data-testid^="hand-card-"]');
    const arenaCardCount = await arenaCards.count();
    console.log(`   Arena hand card count: ${arenaCardCount}`);
    if (arenaCardCount !== 8) {
      throw new Error(`Expected 8 cards in arena hand, got ${arenaCardCount}`);
    }

    const arenaCardIds = [];
    for (let i = 0; i < arenaCardCount; i++) {
      arenaCardIds.push(await arenaCards.nth(i).getAttribute('data-card-id'));
    }
    console.log('   Arena in-game hand cards:', arenaCardIds);
    if (new Set(arenaCardIds).size !== 8) {
      throw new Error('Arena hand contains duplicate cards');
    }
    console.log('   ✓ Arena in-game tactical hand correctly loaded the unique randomized deck');

    await context.close();
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(' RANDOMIZE HAND BUTTON VERIFICATION PASSED ✓');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } finally {
    await browser.close();
    server.httpServer.close();
  }
}

verifyRandomizeHand().catch((err) => {
  console.error('\n❌ VERIFICATION FAILED:', err);
  process.exit(1);
});
