export const LEVEL_END=14550;
export const SPECIALS=['RAINBOW FLICK','BICYCLE KICK','FIREBALL','WHISTLE BLAST'] as const;
export type Special=typeof SPECIALS[number];
export const CHARGE_PER_KNOCKOUT=25;
export const POWER_CYCLE_MS=1800;
export const SHOTS_ALLOWED=3;
export const GOALS_REQUIRED=2;
export const PERFECT_MIN=.65, PERFECT_MAX=.92;

export function shotPower(elapsedMs:number):number {
  const phase=(Math.max(0,elapsedMs)%POWER_CYCLE_MS)/(POWER_CYCLE_MS/2);
  return phase<=1?phase:2-phase;
}
export function resolveShot(aim:number,power:number,keeper:readonly number[]){
  const column=aim%3,row=Math.floor(aim/3);
  const p=Math.max(0,Math.min(1,power));
  // Soft kicks drop to the bottom; medium kicks fall one row. Good timing
  // reaches the selected square. Overhit shots clear the bar.
  const actualRow=p<.35?2:p<PERFECT_MIN?Math.min(2,row+1):row;
  const target=actualRow*3+column;
  const outcome=p<.12?'short':p>PERFECT_MAX?'over':keeper.includes(target)?'saved':'goal';
  return {target,outcome,power:p,perfect:p>=PERFECT_MIN&&p<=PERFECT_MAX} as const;
}
const COVER_PAIRS:readonly (readonly [number,number])[]=[
  [0,1],[1,2],[3,4],[4,5],[6,7],[7,8],[0,3],[3,6],[1,4],[4,7],[2,5],[5,8],
];
export function keeperPair(random=Math.random):readonly [number,number]{
  return COVER_PAIRS[Math.min(COVER_PAIRS.length-1,Math.floor(random()*COVER_PAIRS.length))];
}
export function penaltyDecided(goals:number,shots:number){
  return goals>=GOALS_REQUIRED||goals+SHOTS_ALLOWED-shots<GOALS_REQUIRED||shots>=SHOTS_ALLOWED;
}
