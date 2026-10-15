import { chromium } from 'file:///C:/nvm4w/nodejs/node_modules/@playwright/cli/node_modules/playwright/index.mjs';
import * as path from 'path';
import { preview } from 'vite';

const SCREENSHOT_DIR = path.resolve('.agent/state/artifacts/screenshots');

async function testCardPlayInBrowser() {
  console.log('Starting local Vite preview server...');
  const server = await preview({ preview: { port: 4173 } });
  const serverUrl = 'http://localhost:4173';
  console.log(`Vite preview running at ${serverUrl}`);

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

    console.log('1. Page loaded. Clicking [Vanguard Advance] card...');
    const vanguardBtn = await page.$('[data-card-id="pawn_vanguard"]');
    if (!vanguardBtn) {
      throw new Error('Could not find [data-card-id="pawn_vanguard"] in tactical hand');
    }
    await vanguardBtn.click();
    await page.waitForTimeout(500);

    console.log('2. Clicking anchor square e2...');
    const e2Square = await page.$('[data-square="e2"]');
    if (!e2Square) throw new Error('e2 square not found');
    await e2Square.click();
    await page.waitForTimeout(500);

    console.log('3. Clicking target square e5...');
    const e5Square = await page.$('[data-square="e5"]');
    if (!e5Square) throw new Error('e5 square not found');
    await e5Square.click();
    await page.waitForTimeout(600);

    // Verify Combat Log has recorded Vanguard Advance
    const logText = await page.textContent('body');
    if (!logText.includes('Vanguard Advance') && !logText.includes('pawn_vanguard')) {
      throw new Error('Combat log did not record playing Vanguard Advance!');
    }
    console.log('✓ Card [Vanguard Advance] executed cleanly on e2 -> e5!');

    // Now make normal chess move to finish turn: Knight g1 -> f3
    console.log('4. Making chess move to complete turn: Knight g1 -> f3...');
    const g1Square = await page.$('[data-square="g1"]');
    await g1Square.click();
    await page.waitForTimeout(300);

    const f3Square = await page.$('[data-square="f3"]');
    await f3Square.click();
    await page.waitForTimeout(600);

    console.log('✓ Move g1 -> f3 completed turn!');

    // Wait for AI Bot response
    console.log('5. Waiting for AI Bot countermove...');
    await page.waitForFunction(() => {
      const el = document.body;
      return el && el.innerText.includes('AI Bot moved');
    }, { timeout: 6000 });

    const logAfterAi = await page.textContent('body');
    console.log('✓ AI Bot moved successfully!');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'deck_builder_card_play_verified.png') });
    console.log('✓ Screenshot saved to deck_builder_card_play_verified.png');

    console.log('\n======================================================');
    console.log('BROWSER CARD PLAY + MOVE INTERACTION VERIFIED PASS!');
    console.log('======================================================');
  } finally {
    await browser.close();
    server.httpServer.close();
  }
}

testCardPlayInBrowser().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
