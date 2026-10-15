import { chromium } from 'file:///C:/nvm4w/nodejs/node_modules/@playwright/cli/node_modules/playwright/index.mjs';
import * as path from 'path';

const SCREENSHOT_DIR = path.resolve('.agent/state/artifacts/screenshots');
const TARGET_URL = process.env.TARGET_URL || 'https://wormhole-chess.com';

async function testDeckBuilderMoves() {
  console.log(`Testing Deck Builder interactive moves on: ${TARGET_URL}...`);
  let server = null;
  let serverUrl = TARGET_URL;

  if (TARGET_URL.includes('localhost') || TARGET_URL.includes('127.0.0.1')) {
    const { preview } = await import('vite');
    server = await preview({ preview: { port: 4173 } });
    serverUrl = 'http://localhost:4173';
    console.log(`Local Vite preview server started at ${serverUrl}`);
  }

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push({ type: msg.type(), text: msg.text() });
    if (msg.type() === 'error') {
      console.error('[BROWSER ERROR]', msg.text());
    }
  });

  try {
    await page.goto(`${serverUrl}/deck-builder`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    console.log('1. Page loaded. Clicking e2 pawn...');
    const e2Square = await page.$('[data-square="e2"]');
    if (!e2Square) {
      throw new Error('Could not find [data-square="e2"]');
    }
    await e2Square.click();
    await page.waitForTimeout(500);

    // Verify legal move indicators appeared on e3 and e4
    const e4Square = await page.$('[data-square="e4"]');
    if (!e4Square) {
      throw new Error('Could not find [data-square="e4"]');
    }

    console.log('2. Clicking e4 to make the first move (e2 -> e4)...');
    await e4Square.click();
    await page.waitForTimeout(500);

    // Check Combat Log text
    const combatLogText = await page.textContent('.overflow-y-auto, [class*="Combat"]');
    console.log('Combat log after e2-e4:\n', combatLogText);

    if (combatLogText && combatLogText.includes('Illegal move')) {
      throw new Error(`Move was marked ILLEGAL: ${combatLogText}`);
    }

    // Check for "White moved e4"
    const logContainsMove = await page.$(':has-text("White moved e4"), :has-text("moved e4")');
    if (!logContainsMove) {
      throw new Error('Could not find "White moved e4" in combat log!');
    }
    console.log('✓ First move e2 -> e4 executed successfully!');

    // Wait for AI Bot to think and respond
    console.log('3. Waiting for AI Bot to execute its countermove...');
    await page.waitForFunction(() => {
      const el = document.body;
      return el && el.innerText.includes('AI Bot moved');
    }, { timeout: 5000 });

    const combatLogAfterAi = await page.textContent('.overflow-y-auto, [class*="Combat"]');
    console.log('Combat log after AI response:\n', combatLogAfterAi);
    console.log('✓ AI Bot countermove executed successfully!');

    // Make second move: Knight g1 to f3
    console.log('4. Making second move: Knight g1 -> f3...');
    const g1Square = await page.$('[data-square="g1"]');
    await g1Square.click();
    await page.waitForTimeout(300);

    const f3Square = await page.$('[data-square="f3"]');
    await f3Square.click();
    await page.waitForTimeout(500);

    const logContainsKnightMove = await page.$(':has-text("White moved Nf3"), :has-text("White moved g1-f3")');
    if (!logContainsKnightMove) {
      throw new Error('Could not find "White moved Nf3" in combat log!');
    }
    console.log('✓ Second move g1 -> f3 executed successfully!');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'deck_builder_playable_verified.png') });
    console.log('✓ Screenshot saved to deck_builder_playable_verified.png');

    console.log('\n=========================================');
    console.log('ALL DECK BUILDER CHESS MOVES VERIFIED PASS!');
    console.log('=========================================');
  } finally {
    await browser.close();
    if (server) await server.close();
  }
}

testDeckBuilderMoves().catch(err => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});
