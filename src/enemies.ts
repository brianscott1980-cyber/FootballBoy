export type EnemyKind='zombie'|'brute'|'tower';
export interface EnemyHealth {hp:number;attacks:Set<number>}
export const ENEMY_PROFILES={
  zombie:{name:'Midfielder',scale:1,hp:1},
  brute:{name:'Bruiser',scale:1.42,hp:2},
  tower:{name:'Long Legs',scale:1.25,hp:2},
} as const;
export function enemyProfile(index:number){
  const kind:EnemyKind=index%6===2?'brute':index%6===4?'tower':'zombie';
  const profile=ENEMY_PROFILES[kind];
  return {kind,...profile,scale:kind==='zombie'&&index%6===1?.91:profile.scale};
}
// Each kick (including a piercing special) or separate head landing counts
// once. A projectile cannot spend two of a large enemy's hit points by staying
// in contact across frames or reaching its landing burst.
export function applyEnemyHit(enemy:EnemyHealth,attack:number):'ignored'|'tired'|'down'{
  if(enemy.hp<=0||enemy.attacks.has(attack))return 'ignored';
  enemy.attacks.add(attack);enemy.hp--;
  return enemy.hp===0?'down':'tired';
}
