import { test, expect } from '@playwright/test';

test.describe('Phase 10: Card Tag Previews (Desktop Tooltips & Mobile Popovers)', () => {
  test('Desktop (1280x800) hover tooltip shows card art and rules', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/deck-builder');

    // Enter Match Arena
    await page.locator('[data-testid="main-menu-multiplayer-btn"]').click();
    await page.locator('[data-testid="stage-offline-match-btn"]').click();
    await page.locator('[data-testid="start-offline-match-btn"]').click();

    // Execute standard move 1. e4
    await page.evaluate(() => {
      window.__DECK_CHESS_GAME__.makeMove('e2', 'e4');
    });

    // Tag move with card code R1
    await page.evaluate(() => {
      const turns = window.__DECK_CHESS_GAME__.getRecordedTurns();
      if (turns.length > 0) {
        turns[0].cardCode = 'R1';
        turns[0].cardPieceType = 'rook';
      }
      window.__DECK_CHESS_GAME__.syncState();
    });

    const tag = page.locator('[data-testid="card-tag-badge-R1"]').first();
    await expect(tag).toBeVisible();

    // Hover tag
    await tag.hover();
    const tooltip = page.locator('[data-testid="card-tag-tooltip"]');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText('Make Way');

    // Mouse leave
    await page.mouse.move(0, 0);
    await expect(tooltip).toBeHidden();
  });

  test('Mobile (390x844) tap popover displays and dismisses cleanly', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/deck-builder');

    // Enter Match Arena
    await page.locator('[data-testid="main-menu-multiplayer-btn"]').click();
    await page.locator('[data-testid="stage-offline-match-btn"]').click();
    await page.locator('[data-testid="start-offline-match-btn"]').click();

    await page.evaluate(() => {
      window.__DECK_CHESS_GAME__.makeMove('e2', 'e4');
      const turns = window.__DECK_CHESS_GAME__.getRecordedTurns();
      if (turns.length > 0) {
        turns[0].cardCode = 'R1';
        turns[0].cardPieceType = 'rook';
      }
      window.__DECK_CHESS_GAME__.syncState();
    });

    const stream = page.locator('[data-testid="move-stream-mobile"]');
    await expect(stream).toBeVisible();

    const tag = stream.locator('[data-testid="card-tag-badge-R1"]');
    await expect(tag).toBeVisible();

    // Tap tag
    await tag.click();
    const popover = page.locator('[data-testid="card-tag-popover"]');
    await expect(popover).toBeVisible();
    await expect(popover).toContainText('Make Way');

    // Close via '✕'
    const closeBtn = popover.locator('[data-testid="close-popover-btn"]');
    await closeBtn.click();
    await expect(popover).toBeHidden();
  });
});
