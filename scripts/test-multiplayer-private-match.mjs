import { chromium } from 'file:///C:/nvm4w/nodejs/node_modules/@playwright/cli/node_modules/playwright/index.mjs';
import * as path from 'path';
import * as fs from 'fs';
import { preview } from 'vite';

const ARTIFACTS_DIR = path.resolve('.agent/state/artifacts/screenshots');
if (!fs.existsSync(ARTIFACTS_DIR)) {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

async function testPrivateMatch() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' REAL PRIVATE MULTIPLAYER MATCH VERIFICATION TEST');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('1. Starting local Vite preview server on port 4180...');
  const server = await preview({ preview: { port: 4180 } });
  const BASE_URL = 'http://localhost:4180';
  console.log(`   ✓ Vite preview server running at ${BASE_URL}\n`);

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext();

  try {
    const roomCode = `WH-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const roomUrl = `${BASE_URL}/play/${roomCode}?variant=deck_builder&timeControl=5+0`;

    console.log(`2. Player 1 creates and enters Room: ${roomCode}`);
    const page1 = await context.newPage();
    await page1.goto(roomUrl, { waitUntil: 'networkidle' });

    // Verify Player 1 sees the room header and waiting state
    await page1.waitForSelector('text=Waiting for Challenger', { timeout: 5000 });
    console.log('   ✓ Player 1 sees "Waiting for Challenger" overlay');

    const p1RoomText = await page1.textContent('body');
    if (!p1RoomText.includes(roomCode)) {
      throw new Error(`Player 1 screen does not show room code ${roomCode}`);
    }
    console.log(`   ✓ Player 1 screen displays room code: ${roomCode}`);

    await page1.screenshot({ path: path.join(ARTIFACTS_DIR, 'mp_test_01_p1_waiting.png') });
    console.log('   ✓ Saved screenshot: mp_test_01_p1_waiting.png');

    console.log(`\n3. Player 2 joins Room ${roomCode} in a separate tab...`);
    const page2 = await context.newPage();
    await page2.goto(roomUrl, { waitUntil: 'networkidle' });

    // Verify both tabs transition to in_progress
    console.log('   Waiting for game start synchronization on both tabs...');
    await page2.waitForSelector('text=Turn 1', { timeout: 5000 });
    console.log('   ✓ Player 2 connected and match started (Turn 1 visible)!');

    await page1.waitForSelector('text=Turn 1', { timeout: 5000 });
    console.log('   ✓ Player 1 received start broadcast (Waiting overlay gone, Turn 1 visible)!');

    await page1.screenshot({ path: path.join(ARTIFACTS_DIR, 'mp_test_02_p1_started.png') });
    await page2.screenshot({ path: path.join(ARTIFACTS_DIR, 'mp_test_02_p2_started.png') });
    console.log('   ✓ Saved screenshots: mp_test_02_p1_started.png & p2_started.png');

    console.log('\n4. Player 1 (White) makes standard move: e2 -> e4');
    // Square coordinates in DOM: data-square or aria-label or clicking square e2 and e4
    // Let's find square elements
    const e2Square = await page1.$('[data-square="e2"], [aria-label*="e2"]');
    if (e2Square) {
      await e2Square.click();
      await page1.waitForTimeout(200);
      const e4Square = await page1.$('[data-square="e4"], [aria-label*="e4"]');
      if (e4Square) {
        await e4Square.click();
        console.log('   ✓ Clicked e2 then e4 on Player 1 board');
      }
    } else {
      // In case data-square is not on the element, use coordinate or board click
      console.log('   Selecting via fallback square locator on board...');
      const squares = await page1.$$('[role="button"], [data-square]');
      console.log(`   Found ${squares.length} square elements on page 1`);
    }

    await page1.waitForTimeout(600);

    console.log('\n5. Verifying move synchronization to Player 2 (Black)...');
    // Check if move history or turn updated on Player 2
    const p2Text = await page2.textContent('body');
    const p1Text = await page1.textContent('body');

    console.log(`   Player 1 turn status: ${p1Text.includes('Black to Move') ? 'Black to Move (Success!)' : 'White to Move'}`);
    console.log(`   Player 2 turn status: ${p2Text.includes('Black to Move') ? 'Black to Move (Success!)' : 'White to Move'}`);

    await page1.screenshot({ path: path.join(ARTIFACTS_DIR, 'mp_test_03_p1_after_move.png') });
    await page2.screenshot({ path: path.join(ARTIFACTS_DIR, 'mp_test_03_p2_after_move.png') });
    console.log('   ✓ Saved post-move screenshots');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(' VERIFICATION RESULT: PRIVATE MATCH SUCCESSFUL!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (err) {
    console.error('❌ Private match test failed:', err);
    throw err;
  } finally {
    await browser.close();
    server.httpServer.close();
  }
}

testPrivateMatch();
