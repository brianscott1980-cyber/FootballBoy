import {test,expect} from '@playwright/test';
test('Madrid selection, white kits, nearest-target overhead knockout and finale',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await page.waitForFunction(()=>(window as any).footballBoy);
 await page.getByRole('radio',{name:/MADRID VS PSG/}).click();await expect(page.locator('#overlay-title')).toHaveText('Magic inMadrid.');await page.locator('#play').click();
 await page.evaluate(async()=>{const {game}=await import('/src/main.ts');const s=game.scene.getScene('match') as any;(window as any).match=s;s.enemies.forEach((e:any,i:number)=>e.sprite.setPosition(6000+i*200,425-49*e.scale));s.enemies[1].kind="brute";s.enemies[1].hp=2;s.enemies[1].maxHp=2;s.enemies[2].hp=2;s.enemies[2].maxHp=2;s.enemies[1].sprite.setPosition(s.player.x+520,425-49*s.enemies[1].scale);s.enemies[2].sprite.setPosition(s.player.x+750,425-49*s.enemies[2].scale);});
 expect(await page.evaluate(()=>(window as any).footballBoy.nextSpecial)).toBe('OVERHEAD FLICK');
 await page.evaluate(()=>{const s=(window as any).match;s.power=75;s.shoot(true);});expect(await page.evaluate(()=>(window as any).footballBoy.activeSpecial)).toBe(null);
 await page.evaluate(()=>{const s=(window as any).match;s.power=100;s.updateHud();});await page.locator('[data-control=special]').click();
 const initial=await page.evaluate(()=>{const s=(window as any).match;return {target:s.enemies.indexOf(s.flickTarget),behind:s.flickOrigin.x<s.player.x,player:s.player.texture.key,enemy:s.enemies[1].sprite.texture.key,maxHp:s.enemies[1].maxHp};});expect(initial.target).toBe(1);expect(initial.behind).toBe(true);expect(initial.player).toContain('madrid-');expect(initial.enemy).toContain('madrid-');expect(initial.maxHp).toBe(2);
 await page.waitForTimeout(420);await page.screenshot({path:'test-results/madrid-overhead.png'});
 await expect.poll(async()=>page.evaluate(()=>(window as any).match.flickExploded)).toBe(true);await page.screenshot({path:'test-results/madrid-explosion.png'});
 expect(await page.evaluate(()=>(window as any).footballBoy.enemies[1].state)).toBe('down');expect(await page.evaluate(()=>(window as any).footballBoy.enemies[2].hp)).toBe(2);expect(await page.evaluate(()=>(window as any).footballBoy.power)).toBe(25);
 await page.evaluate(()=>{(window as any).match.beginPenalty();});await expect(page.locator('#penalty-ui')).toBeVisible();expect(await page.evaluate(()=>{const s=(window as any).match.scene.get('finale');return s.boy.texture.key;})).toBe('madrid-boy-back');await page.screenshot({path:'test-results/madrid-finale.png'});
 await page.setViewportSize({width:390,height:844});await page.locator('#restart').click();await page.keyboard.press('p');await expect(page.getByRole('radio',{name:/MADRID VS PSG/})).toBeVisible();expect(errors).toEqual([]);
});
