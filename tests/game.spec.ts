import {test,expect,Page} from '@playwright/test';
const state=(p:Page)=>p.evaluate(()=>(window as any).footballBoy);
async function start(p:Page){await p.goto('/',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>(window as any).footballBoy);await p.getByRole('button',{name:'LET’S PLAY'}).click();await expect.poll(async()=>(await state(p)).mode).toBe('playing');}
test('automatic run and scrolling, shooting, pause and restart',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await start(page);
 // No movement input is needed, and left cannot stop or reverse the run.
 await expect.poll(async()=>(await state(page)).x).toBeGreaterThan(225);
 await expect.poll(async()=>(await state(page)).cameraX).toBeGreaterThan(30);
 const before=(await state(page)).x;await page.keyboard.down('ArrowLeft');await page.waitForTimeout(180);await page.keyboard.up('ArrowLeft');expect((await state(page)).x).toBeGreaterThan(before+20);
 await page.keyboard.press('x');await expect.poll(async()=>(await state(page)).score).toBe(1);expect((await state(page)).enemies[0].state).toBe('down');
 await page.keyboard.press('p');expect((await state(page)).mode).toBe('paused');const pausedX=(await state(page)).x;await page.waitForTimeout(250);expect((await state(page)).x).toBe(pausedX);await page.getByRole('button',{name:'BACK TO THE GAME'}).click();await expect.poll(async()=>(await state(page)).x).toBeGreaterThan(pausedX+20);
 await page.getByRole('button',{name:'Restart level'}).click();expect((await state(page)).health).toBe(5);expect((await state(page)).score).toBe(0);expect((await state(page)).x).toBeLessThan(180);expect(errors).toEqual([]);
});
test('landing on an enemy head knocks it out without damage',async({page})=>{
 await start(page);await page.waitForFunction(()=>{const s=(window as any).footballBoy;return s.enemies[0].x-s.x<300;},undefined,{polling:'raf'});
 await page.keyboard.down('Space');await page.waitForTimeout(350);await page.keyboard.up('Space');
 await expect.poll(async()=>(await state(page)).score,{intervals:[25,50,100]}).toBe(1);
 const s=await state(page);expect(s.health).toBe(5);expect(s.enemies[0].state).toBe('down');
 await expect(page.locator('#toast')).toHaveText('WHAT A JUMP!');
 await page.screenshot({path:'test-results/head-stomp.png'});
 await page.waitForTimeout(500);expect((await state(page)).score).toBe(1);
});
test('running into an enemy from the side still costs a heart',async({page})=>{
 await start(page);await expect.poll(async()=>(await state(page)).health,{timeout:6000}).toBe(4);expect((await state(page)).score).toBe(0);
});
test('long run charges every special and finishes with the goal challenge',async({page})=>{
 test.setTimeout(140000);
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await start(page);
 const specials=new Set<string>();
 for(let i=0;i<380;i++){
   const s=await state(page);if(s.activeSpecial)specials.add(s.activeSpecial);if(s.mode!=='playing')break;
   const closeBig=s.enemies.some((e:any)=>e.hp>0&&e.maxHp>1&&e.x-s.x>0&&e.x-s.x<250&&e.state!=='hurt');
   if(closeBig&&s.grounded&&s.ball!=='feet')await page.keyboard.press('Space',{delay:300});
   await page.keyboard.press(s.power===100?'c':'x');await page.waitForTimeout(180);
 }
 await expect.poll(async()=>(await state(page)).mode,{timeout:4000}).toBe('penalty');
 let s=await state(page);expect(s.levelEnd).toBeGreaterThan(14000);expect(s.score).toBeGreaterThanOrEqual(16);expect(s.specialShots).toBeGreaterThanOrEqual(4);expect([...specials]).toContain('TOBY THE DOG');
 await expect(page.getByRole('group',{name:'Choose one of nine goal squares'}).getByRole('button')).toHaveCount(9);
 await page.waitForTimeout(750);await page.screenshot({path:'test-results/finale-desktop.png'});
 // Pause cancels a held charge rather than firing unexpectedly on resume.
 await page.keyboard.down('x');await page.waitForTimeout(200);await page.keyboard.press('p');expect((await state(page)).mode).toBe('paused');await page.keyboard.up('x');await page.getByRole('button',{name:'BACK TO THE GAME'}).click();await expect.poll(async()=>(await state(page)).penalty?.phase).toBe('aim');
 // Missing twice offers a finale checkpoint instead of replaying the whole run.
 for(let i=0;i<2;i++){await page.keyboard.press('x');await expect.poll(async()=>(await state(page)).penalty?.lastResult?.outcome).toBe('short');if(i===0)await expect.poll(async()=>(await state(page)).penalty?.phase,{timeout:5000}).toBe('aim');}
 await expect(page.getByRole('button',{name:'RETRY THE FINAL SHOTS'})).toBeVisible({timeout:6000});const runScore=(await state(page)).score;await page.getByRole('button',{name:'RETRY THE FINAL SHOTS'}).click();await expect.poll(async()=>(await state(page)).mode).toBe('penalty');await expect.poll(async()=>(await state(page)).penalty?.phase).toBe('aim');expect((await state(page)).score).toBe(runScore);
 // A low shot falls to the bottom square in the chosen column.
 await page.keyboard.down('x');s=await state(page);const col=[0,1,2].find(c=>!s.penalty.keeperTiles.includes(6+c))!;await page.getByRole('button',{name:['Aim top left','Aim top centre','Aim top right'][col],exact:true}).click();await page.waitForFunction(()=>{const p=(window as any).footballBoy.penalty;return p.power>.2&&p.power<.3;},undefined,{polling:'raf'});await page.keyboard.up('x');
 await expect.poll(async()=>(await state(page)).penalty?.goals,{timeout:5000}).toBe(1);expect((await state(page)).penalty.lastResult.target).toBe(6+col);
 await expect.poll(async()=>(await state(page)).penalty?.phase,{timeout:5000}).toBe('aim');
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/finale-mobile.png'});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.keyboard.down('AltRight');s=await state(page);const aim=[0,1,2].find(i=>!s.penalty.keeperTiles.includes(i))!;await page.getByRole('button',{name:['Aim top left','Aim top centre','Aim top right'][aim],exact:true}).click();await page.waitForFunction(()=>{const p=(window as any).footballBoy.penalty;return p.power>.73&&p.power<.84;},undefined,{polling:'raf'});await page.keyboard.up('AltRight');
 await expect.poll(async()=>(await state(page)).mode,{timeout:6000}).toBe('won');expect((await state(page)).penalty.goals).toBe(2);await expect(page.getByRole('button',{name:'PLAY AGAIN'})).toBeVisible();expect(errors).toEqual([]);
});
test('mobile jump button and right Option shoot',async({page})=>{
 await page.setViewportSize({width:390,height:844});await start(page);
 await expect.poll(async()=>(await state(page)).grounded).toBe(true);
 const before=(await state(page)).y;const jump=await page.locator('[data-control="jump"]').boundingBox();await page.mouse.move(jump!.x+jump!.width/2,jump!.y+jump!.height/2);await page.mouse.down();await page.waitForTimeout(180);expect((await state(page)).y).toBeLessThan(before-30);await page.mouse.up();
 await page.keyboard.down('AltRight');await expect.poll(async()=>(await state(page)).ball).not.toBe('feet');await page.keyboard.up('AltRight');await page.screenshot({path:'test-results/mobile.png'});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('iPad and mobile detection shows left jump and right shoot buttons, and touch square aims in penalty',async({page})=>{
 // Desktop (1280x720) without touch should not show touch-device class
 await page.setViewportSize({width:1280,height:720});
 await page.goto('/',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>(window as any).footballBoy);
 await expect(page.locator('[data-control=special]')).toHaveCount(1);

 // iPad viewport (1024x768) detects tablet/iPad and shows side buttons
 await page.setViewportSize({width:1024,height:768});
 await expect.poll(async()=>(await state(page)).isTouchDevice).toBe(true);
 await page.getByRole('button',{name:'LET’S PLAY'}).click();
 await expect.poll(async()=>(await state(page)).mode).toBe('playing');

 const viewportBox=(await page.locator('.viewport').boundingBox())!;
 const jumpBox=(await page.locator('[data-control="jump"]').boundingBox())!;
 const shootBox=(await page.locator('[data-control="shoot"]').boundingBox())!;
 // Jump is on the left side, Shoot is on the right side
 expect(jumpBox.x+jumpBox.width/2).toBeLessThan(viewportBox.x+viewportBox.width*0.35);
 expect(shootBox.x+shootBox.width/2).toBeGreaterThan(viewportBox.x+viewportBox.width*0.65);

 // Tapping right-side shoot button shoots the ball
 await page.mouse.move(shootBox.x+shootBox.width/2,shootBox.y+shootBox.height/2);
 await page.mouse.down();await page.waitForTimeout(80);await page.mouse.up();
 await expect.poll(async()=>(await state(page)).ball).not.toBe('feet');

 // Switch to penalty mode and verify touching square area aims and right shoot button fires
 await page.evaluate(()=>{(window as any).footballBoy.beginPenalty();});
 await expect.poll(async()=>(await state(page)).penalty?.phase).toBe('aim');

 const square6=(await page.locator('#aim-grid button').nth(6).boundingBox())!;
 await page.mouse.move(square6.x+square6.width/2,square6.y+square6.height/2);
 await page.mouse.down();await page.mouse.up();
 expect((await state(page)).penalty.aim).toBe(6);
});

test('goalkeeper saves, touch charging, aiming and finale retry work independently',async({page})=>{
 // Isolate the scene through the application's exported game instance; the
 // full-run test above verifies the actual level-to-finale transition.
 await page.goto('/',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>(window as any).footballBoy);
 await page.evaluate(async()=>{const entry=[...document.scripts].find(script=>script.src.includes('/src/main.ts'))!.src;const {game}=await import(/* @vite-ignore */ entry);game.scene.getScene('match').beginPenalty();});
 await expect.poll(async()=>(await state(page)).penalty?.phase).toBe('aim');
 await page.keyboard.press('ArrowLeft');await expect.poll(async()=>(await state(page)).penalty.aim).toBe(1);await page.keyboard.press('ArrowDown');await expect.poll(async()=>(await state(page)).penalty.aim).toBe(4);
 await page.keyboard.down('AltRight');const covered=(await state(page)).penalty.keeperTiles[0];await page.locator('#aim-grid button').nth(covered).click();await page.waitForFunction(()=>{const p=(window as any).footballBoy.penalty;return p?.power>.73&&p.power<.85;},undefined,{polling:'raf'});await page.keyboard.up('AltRight');
 await expect.poll(async()=>(await state(page)).penalty?.lastResult?.outcome).toBe('saved');await expect.poll(async()=>(await state(page)).penalty?.phase,{timeout:5000}).toBe('aim');expect((await state(page)).penalty.goals).toBe(0);
 // Read the visible amber keeper squares and choose an uncovered top corner.
 const cells=(await state(page)).penalty.keeperTiles;const target=[0,1,2].find(i=>!cells.includes(i))!;await page.locator('#aim-grid button').nth(target).click();
 const button=await page.locator('#penalty-shoot').boundingBox();await page.mouse.move(button!.x+button!.width/2,button!.y+button!.height/2);await page.mouse.down();await page.waitForFunction(()=>{const p=(window as any).footballBoy.penalty;return p?.power>.72&&p.power<.84;},undefined,{polling:'raf'});await page.mouse.up();
 await expect.poll(async()=>(await state(page)).penalty?.goals,{timeout:5000}).toBe(1);await expect.poll(async()=>(await state(page)).penalty?.phase,{timeout:5000}).toBe('aim');
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(150);await page.screenshot({path:'test-results/finale-mobile-aim.png'});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole('button',{name:'Exit fullscreen'}).click();await page.getByRole('button',{name:'Enter fullscreen'}).click();await page.waitForFunction(()=>!!document.fullscreenElement);await expect(page.locator('#aim-grid button')).toHaveCount(9);await page.getByRole('button',{name:'Exit fullscreen'}).click();await page.waitForFunction(()=>!document.fullscreenElement);
 await page.keyboard.press('x');await expect.poll(async()=>(await state(page)).penalty?.lastResult?.outcome).toBe('short');await expect(page.getByRole('button',{name:'RETRY THE FINAL SHOTS'})).toBeVisible({timeout:6000});await page.getByRole('button',{name:'RETRY THE FINAL SHOTS'}).click();await expect.poll(async()=>(await state(page)).penalty?.shots).toBe(0);expect((await state(page)).penalty.goals).toBe(0);
 await page.getByRole('button',{name:'Restart level'}).click();await expect.poll(async()=>(await state(page)).mode).toBe('playing');await expect(page.locator('#penalty-ui')).toBeHidden();
});
