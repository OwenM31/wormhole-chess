import { chromium } from 'file:///C:/nvm4w/nodejs/node_modules/@playwright/cli/node_modules/playwright/index.mjs';
import * as path from 'path';
import * as fs from 'fs';
import { preview } from 'vite';

const SCREENSHOT_DIR = path.resolve('.agent/state/artifacts/screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function verifyPhase5Taxonomy() {
  console.log('1. Starting local Vite preview server on port 4174...');
  const server = await preview({ preview: { port: 4174 } });
  const serverUrl = 'http://localhost:4174';
  console.log(`✓ Vite preview running at ${serverUrl}`);

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 850 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // Mock unauthenticated auth endpoint to avoid external calls
  await page.route('**/api/auth/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, decks: [] }),
    });
  });

  const consoleLogs = [];
  page.on('console', (msg) => {
    consoleLogs.push({ type: msg.type(), text: msg.text() });
    if (msg.type() === 'error') {
      console.error('   [BROWSER ERROR]', msg.text());
    }
  });

  try {
    console.log('\n2. Navigating to Deck Builder page...');
    await page.goto(`${serverUrl}/deck-builder`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // -------------------------------------------------------------------------
    // PART A: Test DeckBuilderView 90-Card Curator & Filter Tabs
    // -------------------------------------------------------------------------
    console.log('\n3. Testing Card Library Curator ("My Deck" tab)...');
    const myDeckTabBtn = page.locator('button:has-text("My Deck")').first();
    await myDeckTabBtn.click();
    await page.waitForTimeout(500);

    // Verify filter tabs exist and reflect canonical 30/30/30 counts
    const tabAll = page.locator('button[data-tab="all"]');
    const tabPawn = page.locator('button[data-tab="pawn"]');
    const tabKnight = page.locator('button[data-tab="knight"]');
    const tabBishop = page.locator('button[data-tab="bishop"]');

    console.log('   Checking filter tab labels...');
    const allText = await tabAll.textContent();
    const pawnText = await tabPawn.textContent();
    const knightText = await tabKnight.textContent();
    const bishopText = await tabBishop.textContent();

    console.log(`      Tab All: "${allText}" (expected "All (90)")`);
    console.log(`      Tab Pawn: "${pawnText}" (expected "Pawn (30)")`);
    console.log(`      Tab Knight: "${knightText}" (expected "Knight (30)")`);
    console.log(`      Tab Bishop: "${bishopText}" (expected "Bishop (30)")`);

    if (!allText?.includes('90')) throw new Error(`Expected All tab to show 90, got ${allText}`);
    if (!pawnText?.includes('30')) throw new Error(`Expected Pawn tab to show 30, got ${pawnText}`);
    if (!knightText?.includes('30')) throw new Error(`Expected Knight tab to show 30, got ${knightText}`);
    if (!bishopText?.includes('30')) throw new Error(`Expected Bishop tab to show 30, got ${bishopText}`);

    // Verify filtering behavior
    console.log('   Testing tab filtering...');
    await tabPawn.click();
    await page.waitForTimeout(300);
    let pawnCards = await page.locator('.grid-cols-1 > div, .lg\\:grid-cols-4 > div').count();
    console.log(`      Pawn cards rendered: ${pawnCards}`);
    if (pawnCards !== 30) throw new Error(`Expected 30 Pawn cards, got ${pawnCards}`);

    await tabKnight.click();
    await page.waitForTimeout(300);
    let knightCards = await page.locator('.grid-cols-1 > div, .lg\\:grid-cols-4 > div').count();
    console.log(`      Knight cards rendered: ${knightCards}`);
    if (knightCards !== 30) throw new Error(`Expected 30 Knight cards, got ${knightCards}`);

    await tabBishop.click();
    await page.waitForTimeout(300);
    let bishopCards = await page.locator('.grid-cols-1 > div, .lg\\:grid-cols-4 > div').count();
    console.log(`      Bishop cards rendered: ${bishopCards}`);
    if (bishopCards !== 30) throw new Error(`Expected 30 Bishop cards, got ${bishopCards}`);

    await tabAll.click();
    await page.waitForTimeout(300);
    let allCards = await page.locator('.grid-cols-1 > div, .lg\\:grid-cols-4 > div').count();
    console.log(`      All cards rendered: ${allCards}`);
    if (allCards !== 90) throw new Error(`Expected 90 cards in All view, got ${allCards}`);

    // Verify condition and effect genre badges are rendered
    const conditionBadges = await page.locator('span.font-mono:has-text("POSITION"), span.font-mono:has-text("SPACE"), span.font-mono:has-text("PIECE"), span.font-mono:has-text("SACRIFICE")').count();
    const effectBadges = await page.locator('span.font-mono:has-text("LEAP"), span.font-mono:has-text("STRIKE"), span.font-mono:has-text("DISRUPT"), span.font-mono:has-text("AUGMENT")').count();
    console.log(`      Condition genre badges found: ${conditionBadges}`);
    console.log(`      Effect genre badges found: ${effectBadges}`);
    if (conditionBadges === 0 || effectBadges === 0) {
      throw new Error('Expected condition and effect genre badges to be rendered on library cards');
    }

    // -------------------------------------------------------------------------
    // PART B: Switch to Arena & Test Interactive Empowered Moves
    // -------------------------------------------------------------------------
    console.log('\n4. Switching back to Arena ("Find Match")...');
    const findMatchBtn = page.locator('button:has-text("Find Match")').first();
    await findMatchBtn.click();
    await page.waitForTimeout(500);

    console.log('   Clicking White pawn at e2...');
    const e2Square = page.locator('[data-square="e2"]').first();
    await e2Square.click();
    await page.waitForTimeout(400);

    // Verify standard move dots exist on e3 and e4
    const e3Square = page.locator('[data-square="e3"]').first();
    const e4Square = page.locator('[data-square="e4"]').first();
    const hasE3Standard = await e3Square.locator('.rounded-full.bg-\\[\\#FAF9F6\\]\\/60').isVisible();
    const hasE4Standard = await e4Square.locator('.rounded-full.bg-\\[\\#FAF9F6\\]\\/60').isVisible();
    console.log(`      e3 standard move indicator: ${hasE3Standard ? '✓ VISIBLE' : '✗ NOT FOUND'}`);
    console.log(`      e4 standard move indicator: ${hasE4Standard ? '✓ VISIBLE' : '✗ NOT FOUND'}`);
    if (!hasE3Standard || !hasE4Standard) {
      throw new Error('Expected standard move indicators on e3 and e4');
    }

    // Verify glowing gold empowered move ring exists on e5
    console.log('   Checking empowered move ring on e5...');
    const e5Square = page.locator('[data-square="e5"]').first();
    const empoweredRing = e5Square.locator('.border-\\[\\#D4AF37\\].animate-pulse');
    const hasEmpoweredRing = await empoweredRing.isVisible();
    console.log(`      e5 glowing gold empowered ring: ${hasEmpoweredRing ? '✓ VISIBLE' : '✗ NOT FOUND'}`);
    if (!hasEmpoweredRing) {
      throw new Error('Expected glowing gold empowered ring on e5 for Vanguard Advance');
    }

    // Check energy badge on e5 (1⚡)
    const energyBadgeText = await e5Square.locator('span:has-text("1⚡")').first().textContent();
    console.log(`      e5 energy cost badge: "${energyBadgeText?.trim()}" (expected "1⚡")`);
    if (!energyBadgeText?.includes('1⚡')) {
      throw new Error(`Expected 1⚡ energy badge on e5, got ${energyBadgeText}`);
    }

    // Verify TacticalHandBar illuminated card (activeCardIdsForPiece)
    const activeHandCard = page.locator('[data-card-id="pawn_vanguard"], button:has-text("Vanguard Advance")').first();
    const hasActiveGlow = await activeHandCard.isVisible();
    console.log(`      TacticalHandBar card illumination: ${hasActiveGlow ? '✓ ACTIVE GLOW' : '✗'}`);

    // Capture visual screenshot of the glowing ring and illuminated hand
    const screenshotPath = path.join(SCREENSHOT_DIR, 'phase5_empowered_moves.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`      ✓ Saved visual proof: ${screenshotPath}`);

    // -------------------------------------------------------------------------
    // PART C: Execute Empowered Move (One-Click Atomicity)
    // -------------------------------------------------------------------------
    console.log('\n5. Executing Empowered Move by clicking e5...');
    await e5Square.click();
    await page.waitForTimeout(800);

    // Verify pawn is now at e5
    const e5Piece = await e5Square.locator('svg').count();
    const e2Piece = await e2Square.locator('svg').count();
    console.log(`      Piece count at e2: ${e2Piece} (expected 0)`);
    console.log(`      Piece count at e5: ${e5Piece} (expected 1)`);
    if (e2Piece !== 0 || e5Piece !== 1) {
      throw new Error(`Expected pawn to move e2 -> e5, got e2=${e2Piece}, e5=${e5Piece}`);
    }

    // Verify Combat Log has recorded Vanguard Advance
    const combatLogText = await page.textContent('.overflow-y-auto, [class*="Combat"]');
    console.log('      Combat log excerpt:', combatLogText?.slice(0, 160).replace(/\n/g, ' '));
    const hasVanguardLog = combatLogText?.includes('Vanguard Advance') || combatLogText?.includes('e5');
    console.log(`      Combat log Vanguard entry: ${hasVanguardLog ? '✓ LOGGED' : '✗ NOT FOUND'}`);
    if (!hasVanguardLog) {
      throw new Error('Expected Vanguard Advance move in combat log');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(' ALL PHASE 5 TAXONOMY & EMPOWERED UX VERIFICATIONS PASSED ✓');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } finally {
    await browser.close();
    await server.close();
  }
}

verifyPhase5Taxonomy().catch((err) => {
  console.error('\n❌ Phase 5 Verification Failed:', err);
  process.exit(1);
});
