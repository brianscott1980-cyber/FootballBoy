import {test,expect,Page} from '@playwright/test';
import {enemyProfile,applyEnemyHit} from '../src/enemies';
const state=(page:Page)=>page.evaluate(()=>(window as any).footballBoy);
async function giantFixture(page:Page,kind='brute',x=700){
 await page.goto('/',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>(window as any).footballBoy);await page.getByRole('button',{name:'LET’S PLAY'}).click();
 await expect.poll(async()=>(await state(page)).mode).toBe('playing');
 return page.evaluate(async({kind,x})=>{const entry=[...document.scripts].find(s=>s.src.includes('/src/main.ts'))!.src;const {game}=await import(/* @vite-ignore */ entry);const match=game.scene.getScene('match');const index=match.enemies.findIndex((e:any)=>e.kind===kind);match.enemies.forEach((e:any,i:number)=>e.sprite.setPosition(i===index?x:14000+i*100,425-49*e.scale));return index;},{kind,x});
}
test('the squad has distinct profiles and larger players take two hits',()=>{
 const squad=Array.from({length:12},(_,i)=>enemyProfile(i));expect(new Set(squad.map(e=>e.kind)).size).toBe(3);
 expect(squad[0]).toMatchObject({kind:'zombie',hp:1,scale:1});
 for(const e of squad)if(e.kind!=='zombie'){expect(e.hp).toBe(2);expect(e.scale).toBeGreaterThan(1);}
 const big={hp:2,attacks:new Set<number>()};expect(applyEnemyHit(big,1)).toBe('tired');expect(big.hp).toBe(1);expect(applyEnemyHit(big,1)).toBe('ignored');expect(big.hp).toBe(1);expect(applyEnemyHit(big,2)).toBe('down');expect(big.hp).toBe(0);expect(applyEnemyHit(big,3)).toBe('ignored');
 const small={hp:1,attacks:new Set<number>()};expect(applyEnemyHit(small,1)).toBe('down');
});
test('a big player tires after a shot, falls on the second, and resets on restart',async({page})=>{
 const index=await giantFixture(page);await page.keyboard.press('x');await expect.poll(async()=>(await state(page)).enemies[index].hp).toBe(1);
 let s=await state(page);expect(s.score).toBe(0);expect(s.power).toBe(0);expect(s.enemies[index]).toMatchObject({tired:true,maxHp:2});expect(s.enemies[index].texture).toContain('brute-tired');
 await page.screenshot({path:'test-results/bruiser-first-hit.png'});
 await expect.poll(async()=>(await state(page)).ball).toBe('feet');await page.keyboard.press('x');await expect.poll(async()=>(await state(page)).enemies[index].state).toBe('down');s=await state(page);expect(s.score).toBe(1);expect(s.power).toBe(25);expect(s.enemies[index].hp).toBe(0);
 await page.getByRole('button',{name:'Restart level'}).click();s=await state(page);expect(s.enemies[index]).toMatchObject({hp:2,tired:false,state:'walk'});expect(s.score).toBe(0);expect(s.power).toBe(0);
});
test('two separate head landings are needed for a big player',async({page})=>{
 const index=await giantFixture(page,'tower',700);
 async function land(){await page.evaluate(async(index)=>{const entry=[...document.scripts].find(s=>s.src.includes('/src/main.ts'))!.src;const {game}=await import(/* @vite-ignore */ entry);const match=game.scene.getScene('match'),e=match.enemies[index];match.player.setPosition(e.sprite.x-50,e.sprite.body.top-125).setVelocityY(200);},index);}
 await land();await expect.poll(async()=>(await state(page)).enemies[index].hp).toBe(1);expect((await state(page)).health).toBe(5);expect((await state(page)).score).toBe(0);
 await land();await expect.poll(async()=>(await state(page)).enemies[index].state).toBe('down');expect((await state(page)).health).toBe(5);expect((await state(page)).score).toBe(1);
});
for(const [specialIndex,special] of ['RAINBOW FLICK','BICYCLE KICK','FIREBALL','WHISTLE BLAST'].entries())test(`${special} counts as one hit on a big player`,async({page})=>{
 const index=await giantFixture(page,'brute',specialIndex===0?970:700);
 await page.evaluate(async(specialIndex)=>{const entry=[...document.scripts].find(s=>s.src.includes('/src/main.ts'))!.src;const {game}=await import(/* @vite-ignore */ entry);const match=game.scene.getScene('match');match.power=100;match.specialIndex=specialIndex;match.shoot(true,['RAINBOW FLICK','BICYCLE KICK','FIREBALL','WHISTLE BLAST'][specialIndex]);},specialIndex);
 await expect.poll(async()=>(await state(page)).enemies[index].hp).toBe(1);
 await expect.poll(async()=>(await state(page)).activeSpecial,{timeout:4000}).toBe(null);
 const s=await state(page);expect(s.enemies[index].hp).toBe(1);expect(s.enemies[index].state).not.toBe('down');expect(s.score).toBe(0);expect(s.power).toBe(0);
});
