import { test, expect, Page } from '@playwright/test';

const state = (p: Page) => p.evaluate(() => (window as any).footballBoy);

test.describe('Level Selection & Holytown Level', () => {
  test('initial overlay defaults to Celtic and allows selecting Holytown Colts', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => (window as any).footballBoy);

    // Initial default is Celtic
    const s = await state(page);
    expect(s.level).toBe('celtic');

    const celticPill = page.locator('.level-pill[data-level="celtic"]');
    const holytownPill = page.locator('.level-pill[data-level="holytown"]');

    await expect(celticPill).toHaveClass(/active/);
    await expect(celticPill).toHaveAttribute('aria-checked', 'true');
    await expect(holytownPill).not.toHaveClass(/active/);
    await expect(holytownPill).toHaveAttribute('aria-checked', 'false');

    await expect(page.locator('#overlay-title')).toContainText('Paradise');
    await expect(page.locator('.match-label')).toContainText('CELTIC PARK');
    await expect(page.locator('.location-badge')).toContainText('PARADISE, GLASGOW');

    // Click Holytown level pill
    await holytownPill.click();

    // Verify state updated
    await expect.poll(async () => (await state(page)).level).toBe('holytown');
    await expect(holytownPill).toHaveClass(/active/);
    await expect(holytownPill).toHaveAttribute('aria-checked', 'true');
    await expect(celticPill).not.toHaveClass(/active/);

    // Verify DOM headers & badges updated
    await expect(page.locator('#overlay-title')).toContainText('Holytown');
    await expect(page.locator('.match-label')).toContainText('HOLYTOWN COLTS VS YETT FARM');
    await expect(page.locator('.location-badge')).toContainText('HOLYTOWN, LANARKSHIRE');
    await expect(page.locator('.level-stamp strong')).toHaveText('HOLYTOWN COLTS');

    // Screenshot the level setup screen
    await page.screenshot({ path: 'test-results/level-setup-holytown.png' });
  });

  test('playing in Holytown level wears Colts kit against Yett Farm on daylight turf', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => (window as any).footballBoy);

    // Select Holytown level
    await page.locator('.level-pill[data-level="holytown"]').click();
    await page.getByRole('button', { name: 'LET’S PLAY' }).click();
    await expect.poll(async () => (await state(page)).mode).toBe('playing');

    // Wait until in shooting range of the first defender
    await expect.poll(async () => (await state(page)).x).toBeGreaterThan(240);
    await page.keyboard.press('x');

    // Check enemy textures have 'holytown-' prefix (Yett Farm opposition)
    const s = await state(page);
    expect(s.enemies[0].texture).toMatch(/holytown-/);

    await expect.poll(async () => (await state(page)).score).toBe(1);
    expect((await state(page)).enemies[0].state).toBe('down');
    expect((await state(page)).enemies[0].texture).toBe('holytown-zombie-down');

    // Take a screenshot of the live gameplay on daylight astro turf
    await page.screenshot({ path: 'test-results/holytown-gameplay.png' });
  });

  test('finale in Holytown level launches with Holytown kit and Yett Farm goalkeeper', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => (window as any).footballBoy);

    // Select Holytown level via UI
    await page.locator('.level-pill[data-level="holytown"]').click();

    // Launch penalty shootout
    await page.evaluate(async () => {
      const entry = [...document.scripts].find(script => script.src.includes('/src/main.ts'))!.src;
      const { game } = await import(/* @vite-ignore */ entry);
      game.scene.getScene('match').beginPenalty();
    });

    await expect.poll(async () => (await state(page)).penalty?.phase).toBe('aim');
    const s = await state(page);
    expect(s.penalty.levelId).toBe('holytown');

    // Take screenshot of Holytown penalty shootout
    await page.screenshot({ path: 'test-results/holytown-penalty.png' });

    // Aim at an uncovered square first
    const covered = (await state(page)).penalty.keeperTiles;
    const target = [0, 1, 2].find(i => !covered.includes(i))!;
    await page.locator('#aim-grid button').nth(target).click();

    // Score a goal in Holytown penalty
    await page.keyboard.down('x');
    await page.waitForFunction(() => {
      const p = (window as any).footballBoy.penalty;
      return p?.power > 0.73 && p.power < 0.85;
    }, undefined, { polling: 'raf' });
    await page.keyboard.up('x');

    await expect.poll(async () => (await state(page)).penalty?.lastResult?.outcome).toBe('goal');
  });
});
