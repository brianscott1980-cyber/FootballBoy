import * as Phaser from 'phaser';
import { stadiumAudio } from './audio';
import { keeperPair, resolveShot, shotPower, penaltyDecided, SHOTS_ALLOWED, GOALS_REQUIRED } from './rules';
import { LevelId, LEVELS } from './levels';

const $=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
const LABELS=['TOP LEFT','TOP CENTRE','TOP RIGHT','MIDDLE LEFT','CENTRE','MIDDLE RIGHT','BOTTOM LEFT','BOTTOM CENTRE','BOTTOM RIGHT'];
type Phase='aim'|'charging'|'flight'|'between'|'finished';
type Result=ReturnType<typeof resolveShot>;

export class PenaltyScene extends Phaser.Scene {
  phase:Phase='aim';aim=2;power=0;chargeMs=0;goals=0;shots=0;keeperTiles:readonly number[]=[0,3];history:string[]=[];
  lastResult:Result|null=null;private onComplete!:(won:boolean,goals:number,shots:number)=>void;
  private playSound!:(frequency:number,duration?:number,type?:OscillatorType,volume?:number)=>void;
  private field!:Phaser.GameObjects.Graphics;private marks!:Phaser.GameObjects.Graphics;private background!:Phaser.GameObjects.Image;
  private boy!:Phaser.GameObjects.Image;private keeper!:Phaser.GameObjects.Image;private ball!:Phaser.GameObjects.Image;
  private boyShadow!:Phaser.GameObjects.Image;private ballShadow!:Phaser.GameObjects.Image;
  private goal={x:0,y:140,w:700,h:226};private flightProgress=0;private leanTimer=0;private shotReleased=false;
  private downListener?:(event:KeyboardEvent)=>void;
  private upListener?:(event:KeyboardEvent)=>void;
  levelId:LevelId='celtic';

  constructor(){super('finale');}
  init(data:{onComplete:(won:boolean,goals:number,shots:number)=>void;sound:PenaltyScene['playSound'];levelId?:LevelId}){
    this.levelId=data.levelId??'celtic';
    this.onComplete=data.onComplete;this.playSound=data.sound;this.phase='aim';this.aim=2;this.power=0;this.chargeMs=0;this.goals=0;this.shots=0;this.history=[];this.lastResult=null;this.flightProgress=0;this.leanTimer=0;
  }
  private get prefix(){return LEVELS[this.levelId].prefix;}
  create(){
    const bgKey=LEVELS[this.levelId].backdropTexture;
    this.background=this.add.image(0,0,bgKey).setOrigin(0).setAlpha(this.levelId==='holytown'?0.95:.8);
    this.field=this.add.graphics();this.marks=this.add.graphics().setDepth(8);
    this.boyShadow=this.add.image(0,0,'shadow').setDisplaySize(130,25);
    this.ballShadow=this.add.image(0,0,'shadow').setDisplaySize(46,10);
    this.keeper=this.add.image(0,0,this.prefix+'keeper-ready').setOrigin(.5,1).setDepth(5);
    this.boy=this.add.image(0,0,this.prefix+'boy-back').setOrigin(.5,1).setDepth(7);
    this.ball=this.add.image(0,0,'ball').setDisplaySize(42,42).setDepth(9);
    $('penalty-ui').classList.remove('hidden');document.querySelector('.viewport')!.classList.add('penalty-mode');
    const grid=$('aim-grid');grid.replaceChildren();
    LABELS.forEach((label,index)=>{const button=document.createElement('button');button.textContent=String(index+1);button.setAttribute('aria-label','Aim '+label.toLowerCase());button.addEventListener('pointerdown',e=>{e.preventDefault();this.choose(index);});button.addEventListener('click',()=>this.choose(index));grid.append(button);});
    const moveAim=(e:PointerEvent)=>{
      if(e.pointerType==='mouse'&&e.buttons===0)return;
      const el=document.elementFromPoint(e.clientX,e.clientY)?.closest('#aim-grid button');
      if(el){
        const idx=[...grid.children].indexOf(el);
        if(idx>=0)this.choose(idx);
      }
    };
    grid.addEventListener('pointermove',moveAim);
    const down=(event:KeyboardEvent)=>{
      if(event.repeat)return;
      if(event.code==='KeyX'||event.code==='AltRight'){event.preventDefault();this.beginCharge();return;}
      if(event.code.startsWith('Digit')&&Number(event.code.slice(5))>=1&&Number(event.code.slice(5))<=9){event.preventDefault();this.choose(Number(event.code.slice(5))-1);}
      const row=Math.floor(this.aim/3),col=this.aim%3;
      if(event.code==='ArrowLeft'){event.preventDefault();this.choose(row*3+Math.max(0,col-1));}
      if(event.code==='ArrowRight'){event.preventDefault();this.choose(row*3+Math.min(2,col+1));}
      if(event.code==='ArrowUp'){event.preventDefault();this.choose(Math.max(0,row-1)*3+col);}
      if(event.code==='ArrowDown'){event.preventDefault();this.choose(Math.min(2,row+1)*3+col);}
    };
    const up=(event:KeyboardEvent)=>{if(event.code==='KeyX'||event.code==='AltRight')this.releaseCharge();};
    if(this.downListener)window.removeEventListener('keydown',this.downListener);
    if(this.upListener)window.removeEventListener('keyup',this.upListener);
    this.downListener=down;this.upListener=up;
    window.addEventListener('keydown',down);window.addEventListener('keyup',up);
    const button=$('penalty-shoot');
    const press=(event:PointerEvent)=>{event.preventDefault();button.setPointerCapture(event.pointerId);this.beginCharge();};
    const release=()=>this.releaseCharge();const cancel=()=>this.cancelCharge();
    button.addEventListener('pointerdown',press);button.addEventListener('pointerup',release);button.addEventListener('pointercancel',cancel);button.addEventListener('lostpointercapture',cancel);
    this.scale.on('resize',this.layout,this);
    this.events.once('shutdown',()=>{
      this.scale.off('resize',this.layout,this);
      grid.removeEventListener('pointermove',moveAim);
      if(this.downListener){window.removeEventListener('keydown',this.downListener);this.downListener=undefined;}
      if(this.upListener){window.removeEventListener('keyup',this.upListener);this.upListener=undefined;}
      button.removeEventListener('pointerdown',press);button.removeEventListener('pointerup',release);button.removeEventListener('pointercancel',cancel);button.removeEventListener('lostpointercapture',cancel);
      $('penalty-ui').classList.add('hidden');document.querySelector('.viewport')!.classList.remove('penalty-mode');
    });
    this.newStance();this.layout();this.sync();this.cameras.main.fadeIn(650,4,12,10);
  }
  get snapshot(){return {phase:this.phase,aim:this.aim,power:this.power,goals:this.goals,shots:this.shots,keeperTiles:[...this.keeperTiles],lastResult:this.lastResult,history:[...this.history],levelId:this.levelId};}
  private newStance(){this.keeperTiles=keeperPair();this.leanTimer=0;}
  choose(index:number){if(this.phase!=='aim'&&this.phase!=='charging')return;this.aim=Phaser.Math.Clamp(index,0,8);this.sync();}
  beginCharge(){if(!this.scene.isActive()||this.phase!=='aim')return;this.phase='charging';this.power=0;this.chargeMs=0;this.shotReleased=false;this.sync();}
  cancelCharge(){if(this.phase==='charging'){this.phase='aim';this.power=0;this.sync();}}
  releaseCharge(){
    if(!this.scene.isActive()||this.phase!=='charging'||this.shotReleased)return;
    this.shotReleased=true;this.lastResult=resolveShot(this.aim,this.power,this.keeperTiles);this.shots++;this.phase='flight';this.flightProgress=0;
    this.boy.setTexture(this.prefix+'boy-back-kick');this.keeper.setTexture(this.prefix+'keeper-dive');this.keeper.setOrigin(.5,.5);this.playSound(410,.16,'triangle');
    $('penalty-verdict').textContent='';this.sync();
    this.tweens.add({targets:this,flightProgress:1,duration:900,ease:'Cubic.Out',onComplete:()=>this.landShot()});
  }
  private point(tile:number){return {x:this.goal.x+(tile%3+.5)*this.goal.w/3,y:this.goal.y+(Math.floor(tile/3)+.5)*this.goal.h/3};}
  private landShot(){
    if(this.phase!=='flight'||!this.lastResult)return;
    const result=this.lastResult;stadiumAudio.react(result.outcome==='goal'?'goal':'miss');this.phase='between';if(result.outcome==='goal')this.goals++;this.history.push(result.outcome);
    const target=this.point(result.target);
    const title=result.outcome==='goal'?'GOOOAL!':result.outcome==='saved'?'SAVED!':result.outcome==='short'?'NOT ENOUGH POWER!':'OVER THE BAR!';
    $('penalty-verdict').textContent=title;$('penalty-verdict').classList.toggle('goal',result.outcome==='goal');
    $('shot-feedback').textContent=result.outcome==='goal'?(result.perfect?'Perfect power. Right where you wanted it.':'A low finish sneaks in!'):result.outcome==='saved'?'He read that one. Try the other side.':result.outcome==='short'?'That one rolled short. Hold a little longer.':'Too much power. Release before the red zone.';
    if(result.outcome==='goal'){
      this.playSound(820,.4,'triangle');this.cameras.main.shake(200,.003);
      for(let i=0;i<35;i++){const spark=this.add.image(target.x,target.y,'spark').setTint(i%2?0xd7f49c:0xffffff).setDepth(20);this.tweens.add({targets:spark,x:target.x+Phaser.Math.Between(-180,180),y:target.y+Phaser.Math.Between(-100,180),angle:360,alpha:0,duration:1200,onComplete:()=>spark.destroy()});}
    }else this.playSound(130,.23,'triangle');
    this.sync();
    this.time.delayedCall(1750,()=>{
      if(penaltyDecided(this.goals,this.shots)){this.phase='finished';this.sync();this.onComplete(this.goals>=GOALS_REQUIRED,this.goals,this.shots);}
      else{this.phase='aim';this.power=0;this.lastResult=null;this.boy.setTexture(this.prefix+'boy-back');this.keeper.setTexture(this.prefix+'keeper-ready').setOrigin(.5,1);this.newStance();$('penalty-verdict').textContent='';$('shot-feedback').innerHTML='Pick your square. Watch his lean.<br/>Hold, then release in the green zone.';this.layout();this.sync();}
    });
  }
  private sync(){
    $('penalty-goals').textContent=`${this.goals} / ${GOALS_REQUIRED}`;$('penalty-attempt').textContent=`SHOT ${Math.min(this.shots+(['aim','charging'].includes(this.phase)?1:0),SHOTS_ALLOWED)} OF ${SHOTS_ALLOWED}`;
    $('penalty-dots').textContent=Array.from({length:SHOTS_ALLOWED},(_,i)=>i>=this.history.length?'○':this.history[i]==='goal'?'●':'×').join(' ');
    $('aim-label').textContent=LABELS[this.aim];
    $('shot-instruction').textContent=this.phase==='charging'?'RELEASE IN THE GREEN ZONE':this.phase==='aim'?'HOLD RIGHT ⌥ / X TO CHARGE':'WATCH THE SHOT';
    $('shot-power-value').textContent=Math.round(this.power*100)+'%';$('shot-power-marker').style.left=this.power*100+'%';
    $('penalty-shoot').classList.toggle('charging',this.phase==='charging');($('penalty-shoot') as HTMLButtonElement).disabled=!['aim','charging'].includes(this.phase);
    const reveal=this.phase==='flight'||this.phase==='between';
    for(const [i,button] of [...$('aim-grid').children].entries()){
      button.classList.toggle('selected',i===this.aim);button.classList.toggle('keeper-zone',this.keeperTiles.includes(i));button.classList.toggle('revealed',reveal);button.setAttribute('aria-pressed',String(i===this.aim));(button as HTMLButtonElement).disabled=!['aim','charging'].includes(this.phase);
    }
    const mean=this.keeperTiles.reduce((sum,t)=>sum+t%3,0)/2;
    $('keeper-hint').textContent=reveal?'TWO SQUARES COVERED':`KEEPER LEANING ${mean<.75?'LEFT':mean>1.25?'RIGHT':'CENTRE'} · WATCH THE AMBER SQUARES`;
  }
  private layout(){
    const w=this.scale.width;this.goal={x:Math.max(32,w*.17),y:142,w:Math.min(740,w*.66),h:226};this.goal.x=(w-this.goal.w)/2;
    this.background.setDisplaySize(w,440);const g=this.field;g.clear();
    if(this.levelId==='holytown'){
      g.fillGradientStyle(0x2f6b33,0x2f6b33,0x1b4421,0x1b4421,1);
    }else{
      g.fillGradientStyle(0x385d25,0x385d25,0x0f3228,0x0f3228,1);
    }
    g.fillRect(0,350,w,290);
    for(let i=0;i<7;i++){g.fillStyle(i%2?0x123c2b:0x4a7132,.2);g.fillRect(0,355+i*i*5,w,8+i*5);}
    g.lineStyle(2,0xdde8bb,.4);g.beginPath();g.moveTo(w*.3,370);g.lineTo(w*.03,640);g.lineTo(w*.97,640);g.lineTo(w*.7,370);g.closePath();g.strokePath();
    g.lineBetween(w*.5,370,w*.5,640);g.strokeEllipse(w*.5,560,w*.36,65);
    const {x,y,w:gw,h}=this.goal;
    g.fillStyle(0x071d1b,.35);g.fillRect(x,y,gw,h);g.lineStyle(1,0xe3f3e3,.23);
    for(let nx=x;nx<=x+gw;nx+=16)g.lineBetween(nx,y,nx,y+h);
    for(let ny=y;ny<=y+h;ny+=15)g.lineBetween(x,ny,x+gw,ny);
    g.lineStyle(4,0xa5c7b2,.65);g.strokeRect(x+14,y+12,gw-28,h-12);
    g.lineStyle(7,0xf2f7dd,1);g.strokeRect(x,y,gw,h);g.lineStyle(2,0xffffff,.7);g.lineBetween(x,y,x+gw,y);
    const grid=$('aim-grid');grid.style.left=x/w*100+'%';grid.style.top=y/640*100+'%';grid.style.width=gw/w*100+'%';grid.style.height=h/640*100+'%';
    $('keeper-hint').style.top=(y+h+14)/640*100+'%';
    this.boy.setPosition(w*.40,590).setDisplaySize(172,201);this.boyShadow.setPosition(w*.4,586);
    this.ballShadow.setPosition(w*.5,561);
    if(this.phase==='aim'||this.phase==='charging'){this.ball.setPosition(w*.5,547).setDisplaySize(42,42);this.keeper.setPosition(w*.5,y+h+3).setDisplaySize(128,149);}
  }
  update(_time:number,delta:number){
    const dt=Math.min(delta,50),w=this.scale.width;
    if(this.phase==='aim'){this.leanTimer+=dt;if(this.leanTimer>2400){this.newStance();this.sync();}}
    if(this.phase==='charging'){this.chargeMs+=dt;this.power=shotPower(this.chargeMs);this.sync();}
    if(this.phase==='aim'||this.phase==='charging'){
      const mean=this.keeperTiles.reduce((sum,t)=>sum+t%3,0)/2;this.keeper.x=w*.5+(mean-1)*this.goal.w*.11+Math.sin(this.time.now/200)*3;
      this.boy.y=590+Math.sin(this.time.now/300)*1.3;this.marks.clear();
    }else if(['flight','between','finished'].includes(this.phase)&&this.lastResult){
      const t=this.flightProgress,target=this.point(this.lastResult.target),start={x:w*.5,y:547};
      if(this.lastResult.outcome==='over')target.y=this.goal.y-65;
      if(this.lastResult.outcome==='short')target.y=438;
      this.ball.setPosition(Phaser.Math.Linear(start.x,target.x,t),Phaser.Math.Linear(start.y,target.y,t)-Math.sin(t*Math.PI)*50).setDisplaySize(42-t*23,42-t*23);this.ball.rotation+=dt*.018;
      this.ballShadow.setPosition(this.ball.x,Phaser.Math.Linear(560,this.goal.y+this.goal.h,t)).setAlpha(1-t*.7);
      const a=this.point(this.keeperTiles[0]),b=this.point(this.keeperTiles[1]),kt=Phaser.Math.Easing.Cubic.Out(Math.min(1,t*1.5));
      this.keeper.setPosition(Phaser.Math.Linear(w*.5,(a.x+b.x)/2,kt),Phaser.Math.Linear(this.goal.y+this.goal.h-70,(a.y+b.y)/2,kt)).setDisplaySize(235,125).setFlipX((a.x+b.x)/2<w*.5);
      this.boy.x=Phaser.Math.Linear(w*.4,w*.44,Math.min(1,t*3));
      this.marks.clear();this.marks.lineStyle(2,0xeaf8bd,.2);this.marks.lineBetween(start.x,start.y,this.ball.x,this.ball.y);
    }
  }
}