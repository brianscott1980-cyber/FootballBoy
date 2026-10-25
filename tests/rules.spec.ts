import {test,expect} from '@playwright/test';
import {resolveShot,shotPower,keeperPair,penaltyDecided,SPECIALS,LEVEL_END} from '../src/rules';
test('shot power travels out and back continuously',()=>{
 expect(shotPower(0)).toBe(0);expect(shotPower(450)).toBe(.5);expect(shotPower(900)).toBe(1);expect(shotPower(1350)).toBe(.5);expect(shotPower(1800)).toBe(0);expect(shotPower(2250)).toBe(.5);
});
test('weak shots drop in the chosen column, good power hits aim, overhit shots miss',()=>{
 for(let aim=0;aim<9;aim++){
  expect(resolveShot(aim,.2,[]).target).toBe(6+aim%3);
  expect(resolveShot(aim,.5,[]).target).toBe(Math.min(2,Math.floor(aim/3)+1)*3+aim%3);
  expect(resolveShot(aim,.78,[])).toMatchObject({target:aim,outcome:'goal',perfect:true});
  expect(resolveShot(aim,.96,[]).outcome).toBe('over');
  expect(resolveShot(aim,.05,[]).outcome).toBe('short');
 }
});
test('keeper covers exactly two adjacent squares and saves only those targets',()=>{
 for(let i=0;i<12;i++){
  const pair=keeperPair(()=>i/12+.001);expect(new Set(pair).size).toBe(2);
  expect(Math.abs(pair[0]%3-pair[1]%3)+Math.abs(Math.floor(pair[0]/3)-Math.floor(pair[1]/3))).toBe(1);
  for(let aim=0;aim<9;aim++)expect(resolveShot(aim,.8,pair).outcome).toBe(pair.includes(aim)?'saved':'goal');
 }
});
test('finale needs two goals from three shots and can end early',()=>{
 expect(penaltyDecided(0,0)).toBe(false);expect(penaltyDecided(1,2)).toBe(false);expect(penaltyDecided(0,2)).toBe(true);expect(penaltyDecided(2,2)).toBe(true);expect(penaltyDecided(1,3)).toBe(true);
 expect(LEVEL_END).toBeGreaterThan(14000);expect(SPECIALS).toEqual(['RAINBOW FLICK','BICYCLE KICK','FIREBALL','WHISTLE BLAST']);
});
