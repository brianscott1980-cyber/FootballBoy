import {test,expect} from '@playwright/test';
const state=(page:any)=>page.evaluate(()=>(window as any).footballBoy);
test('music and Liam chant load; knockouts and tricks trigger crowd reactions',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>(window as any).footballBoy);await page.getByRole('button',{name:'LET’S PLAY'}).click();
 await expect.poll(async()=>(await state(page)).audio.loaded,{timeout:10000}).toBe(true);
 await expect.poll(async()=>(await state(page)).audio.contextState).toBe('running');
 expect((await state(page)).audio.loadError).toBe(null);expect((await state(page)).audio.loopsStarted).toBe(1);
 await expect.poll(async()=>(await state(page)).audio.chants,{timeout:4000}).toBeGreaterThan(0);
 await page.evaluate(async()=>{const entry=[...document.scripts].find(s=>s.src.includes('/src/main.ts'))!.src;const {game}=await import(/* @vite-ignore */ entry);const match=game.scene.getScene('match');match.enemies.forEach((e:any,i:number)=>e.sprite.setPosition(i===0?match.player.x+200:14000+i*100,425-49*e.scale));});
 await page.keyboard.press('x');await expect.poll(async()=>(await state(page)).audio.lastReaction).toBe('knockout');
 await expect.poll(async()=>(await state(page)).ball).toBe('feet');await page.evaluate(async()=>{const entry=[...document.scripts].find(s=>s.src.includes('/src/main.ts'))!.src;const {game}=await import(/* @vite-ignore */ entry);game.scene.getScene('match').power=100;});await page.keyboard.press('c');
 await expect.poll(async()=>(await state(page)).audio.lastReaction).toBe('trick');expect((await state(page)).audio.crowdReactions).toBeGreaterThanOrEqual(2);expect(errors).toEqual([]);
});
test('pause, mute and resume preserve a single music loop and remember mute',async({page})=>{
 await page.goto('/',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>(window as any).footballBoy);await page.getByRole('button',{name:'LET’S PLAY'}).click();await expect.poll(async()=>(await state(page)).audio.loaded).toBe(true);
 await page.keyboard.press('p');await expect.poll(async()=>(await state(page)).audio.contextState).toBe('suspended');expect((await state(page)).audio.paused).toBe(true);
 await page.getByRole('button',{name:'Mute sound'}).click();expect((await state(page)).audio.enabled).toBe(false);await page.getByRole('button',{name:'BACK TO THE GAME'}).click();expect((await state(page)).audio.contextState).toBe('suspended');
 await page.getByRole('button',{name:'Enable sound'}).click();await expect.poll(async()=>(await state(page)).audio.contextState).toBe('running');expect((await state(page)).audio.loopsStarted).toBe(1);
 await page.getByRole('button',{name:'Mute sound'}).click();await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>(window as any).footballBoy);expect((await state(page)).audio.enabled).toBe(false);await expect(page.getByRole('button',{name:'Enable sound'})).toBeVisible();
});
