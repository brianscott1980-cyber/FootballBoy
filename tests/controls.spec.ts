import {test,expect} from '@playwright/test';
test('joypad, four knockout charge and level specials',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await page.waitForFunction(()=>(window as any).footballBoy);
 expect(await page.locator('.game-frame').evaluate(e=>e.classList.contains('is-fullscreen'))).toBe(true);
 await page.locator('#play').click();await expect(page.locator('[data-control=jump]')).toBeVisible();await expect(page.locator('[data-control=shoot]')).toBeVisible();await expect(page.locator('[data-control=special]')).toBeDisabled();
 await page.evaluate(async()=>{const {game}=await import('/src/main.ts');(window as any).match=game.scene.getScene('match');});
 for(let i=0;i<4;i++){await page.evaluate(i=>{const s=(window as any).match;s.knockOut(s.enemies[i]);},i);await expect(page.locator('#special-count')).toHaveText(i===3?'READY!':`${i+1} / 4`);}
 await page.keyboard.press('x');await expect.poll(async()=>page.evaluate(()=>(window as any).footballBoy.ball)).not.toBe('feet');expect(await page.evaluate(()=>(window as any).footballBoy.power)).toBe(100);
 await expect.poll(async()=>page.evaluate(()=>(window as any).footballBoy.ball)).toBe('feet');await page.locator('[data-control=special]').click();expect(await page.evaluate(()=>(window as any).footballBoy.activeSpecial)).toBe('TOBY THE DOG');await page.waitForTimeout(150);await page.screenshot({path:'test-results/toby-desktop.png'});
 await page.evaluate(()=>{const s=(window as any).match;s.selectLevel('holytown');s.start();s.power=100;s.updateHud();});await page.keyboard.press('c');expect(await page.evaluate(()=>(window as any).footballBoy.activeSpecial)).toBe('FIRE SLIDE');await page.waitForTimeout(150);await page.screenshot({path:'test-results/fire-slide.png'});
 await page.evaluate(()=>{const s=(window as any).match;s.start();s.power=100;s.updateHud();});await page.keyboard.press('v');expect(await page.evaluate(()=>(window as any).footballBoy.activeSpecial)).toBe('WHISTLE BLAST');await page.waitForTimeout(150);await page.screenshot({path:'test-results/whistle.png'});
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{(window as any).match.start();});await page.waitForTimeout(200);
 const jump=(await page.locator('[data-control=jump]').boundingBox())!;const canvas=(await page.locator('canvas').boundingBox())!;expect(canvas.y+canvas.height*425/640).toBeLessThan(jump.y);await page.screenshot({path:'test-results/raised-ground-mobile.png'});
 expect(errors).toEqual([]);
});
