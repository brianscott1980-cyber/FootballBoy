import * as Phaser from 'phaser';
import { makeArt } from './art';
import { loadCharacters, makeCharacters } from './characters';
import { PenaltyScene } from './penalty';
import { enemyProfile, applyEnemyHit, type EnemyKind } from './enemies';
import { LEVEL_END, CHARGE_PER_KNOCKOUT, type Special } from './rules';
import { LEVELS, LevelId, DEFAULT_LEVEL, LevelConfig } from './levels';
import { stadiumAudio } from './audio';
import './style.css';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const GROUND=425, FINISH=LEVEL_END, RUN_SPEED=285;
type Mode='ready'|'playing'|'transition'|'penalty'|'paused'|'won'|'lost';
type Enemy={sprite:Phaser.Physics.Arcade.Sprite; shadow:Phaser.GameObjects.Image; state:'walk'|'windup'|'slide'|'hurt'|'down'; timer:number; stars:Phaser.GameObjects.Text[]; home:number; kind:EnemyKind; scale:number; hp:number; maxHp:number; attacks:Set<number>; pips:Phaser.GameObjects.Text};
let mode:Mode='ready', resumeMode:'playing'|'penalty'='playing', finaleCheckpoint=false;
const touch={jump:false,shoot:false,special:false};
export function isTouchOrMobile():boolean{
  const ua=navigator.userAgent||'';
  const isMobileUA=/iPhone|iPod|iPad|Android|Mobile|Tablet|Touch/i.test(ua);
  const isIPadOS=/Macintosh/i.test(ua)&&navigator.maxTouchPoints>1;
  const isCoarse=window.matchMedia?.('(pointer: coarse)').matches||window.matchMedia?.('(hover: none)').matches;
  const hasTouch=navigator.maxTouchPoints>0||'ontouchstart' in window;
  return isMobileUA||isIPadOS||isCoarse||hasTouch||window.innerWidth<=1024;
}
function beep(freq:number,duration=.09,type:OscillatorType='sine',volume=.05){stadiumAudio.tone(freq,duration,type,volume);}
function syncSoundButton(){
  $('sound-label').textContent=stadiumAudio.enabled?'ON':'OFF';$('sound').setAttribute('aria-label',stadiumAudio.enabled?'Mute sound':'Enable sound');$('sound').setAttribute('aria-pressed',String(stadiumAudio.enabled));
}
syncSoundButton();


class FootballBoy extends Phaser.Scene {
  player!:Phaser.Physics.Arcade.Sprite; ball!:Phaser.GameObjects.Image; shadow!:Phaser.GameObjects.Image;
  enemies:Enemy[]=[]; platforms!:Phaser.Physics.Arcade.StaticGroup; keys!:Record<string,Phaser.Input.Keyboard.Key>;
  health=5; score=0; ballState:'feet'|'out'|'return'='feet'; shotStart=0; shotCooldown=0; invulnerable=0; runTime=0; lastJump=false; lastShoot=false; queuedJump=false; queuedShot=false; shootPose=0; jumpBuffer=0; shotBuffer=0; coyote=0;
  backdrop!:Phaser.GameObjects.TileSprite; pitch!:Phaser.GameObjects.TileSprite;
  currentLevel:LevelConfig=LEVELS[DEFAULT_LEVEL];
  introBannerText!:Phaser.GameObjects.Text; benchTexts:Phaser.GameObjects.Text[]=[];
  attackSequence=0;shotAttack=0;
  power=0;specialIndex=0;specialShots=0;activeSpecial:Special|null=null;specialElapsed=0;specialY=0;
  flickTarget:Enemy|null=null;flickOrigin={x:0,y:0};flickImpact={x:0,y:0};flickExploded=false;
  effects!:Phaser.GameObjects.Graphics;transitionTimer?:Phaser.Time.TimerEvent;checkpoints=new Set<number>();

  preload(){loadCharacters(this);}
  create(){
    makeArt(this);makeCharacters(this);this.effects=this.add.graphics().setDepth(15);
    this.physics.world.setBounds(0,0,FINISH+450,640);
    this.backdrop=this.add.tileSprite(0,0,1280,640,this.currentLevel.backdropTexture).setOrigin(0).setScrollFactor(0);
    this.pitch=this.add.tileSprite(0,GROUND,FINISH+1200,230,this.currentLevel.pitchTexture).setOrigin(0);
    const ground=this.add.zone((FINISH+600)/2,GROUND+30,FINISH+600,60);this.physics.add.existing(ground,true);
    this.platforms=this.physics.add.staticGroup();
    for(const [x,y] of [[1200,335],[2520,322],[3690,330],[4470,315],[6200,328],[7700,320],[9050,335],[11050,325],[12800,315]]){
      const platform=this.platforms.create(x,y,this.currentLevel.platformTexture) as Phaser.Physics.Arcade.Sprite;platform.refreshBody();
      // One-way platforms let the automatic run continue beneath a missed jump.
      const body=platform.body as Phaser.Physics.Arcade.StaticBody;
      body.checkCollision.left=false;body.checkCollision.right=false;body.checkCollision.down=false;
    }
    this.introBannerText=this.add.text(380,395,this.currentLevel.introBanner,{fontFamily:'Barlow Condensed, sans-serif',fontSize:'30px',fontStyle:'bold',color:'#e3efc0',align:'center',stroke:'#143e35',strokeThickness:4}).setAlpha(.85);
    this.add.text(FINISH-320,370,'THE LAST\nKICK →',{fontFamily:'Barlow Condensed, sans-serif',fontSize:'38px',fontStyle:'bold',color:'#eff8c9',align:'center',stroke:'#143e35',strokeThickness:5});
    this.benchTexts=[];
    const benchXs=[5600,9600,13000];
    for(const [idx,x] of benchXs.entries()){
      const label=this.currentLevel.benchLabels[idx]||'ONE LAST PUSH';
      const txt=this.add.text(x,390,label,{fontFamily:'Barlow Condensed',fontSize:'30px',fontStyle:'bold',color:'#e0efba',stroke:'#143e35',strokeThickness:4});
      this.benchTexts.push(txt);
    }
    // Goal and the chequered finish.
    const net=this.add.graphics();net.lineStyle(1,0xe9f1dc,.35);for(let x=FINISH;x<FINISH+170;x+=15)net.lineBetween(x,330,x,GROUND);for(let y=330;y<GROUND;y+=15)net.lineBetween(FINISH,y,FINISH+165,y);net.lineStyle(7,0xe9f1dc,1);net.strokeRect(FINISH,330,165,200);
    this.shadow=this.add.image(155,GROUND-2,'shadow').setAlpha(.7);
    this.player=this.physics.add.sprite(150,GROUND-52,this.currentLevel.prefix+'boy0').setDepth(10);this.player.setCollideWorldBounds(true);this.player.body!.setSize(34,92);this.player.body!.setOffset(30,13);this.player.setGravityY(1450);
    this.physics.add.collider(this.player,ground);this.physics.add.collider(this.player,this.platforms);
    this.ball=this.add.image(195,GROUND-18,'ball').setDepth(11).setDisplaySize(31.32,31.32);
    for(const [i,x] of [770,1500,1900,2300,2910,3260,3540,4080,4430,4870,5140,5650,6070,6510,6880,7350,7770,8100,8550,8900,9370,9790,10100,10520,10900,11320,11680,12000,12450,12820,13150,13500,13850,14200].entries()){
      const profile=enemyProfile(i);
      const texture=this.enemyTexture({kind:profile.kind,hp:profile.hp,maxHp:profile.hp} as Enemy,'walk',0);
      const sprite=this.physics.add.sprite(x,GROUND-49*profile.scale,texture).setDepth(9).setScale(profile.scale);
      sprite.body!.setSize(38,90);sprite.body!.setOffset(28,15);sprite.setGravityY(1450);this.physics.add.collider(sprite,ground);this.physics.add.collider(sprite,this.platforms);
      const shadow=this.add.image(x,GROUND-2,'shadow').setScale(.8*profile.scale).setDepth(1);
      const pips=this.add.text(x,GROUND-125*profile.scale,'● ●',{fontSize:'12px',color:'#f4df9c',stroke:'#10372e',strokeThickness:3,letterSpacing:4}).setOrigin(.5).setDepth(12).setVisible(profile.hp>1);
      this.enemies.push({sprite,shadow,state:'walk',timer:i*50,stars:[],home:x,kind:profile.kind,scale:profile.scale,hp:profile.hp,maxHp:profile.hp,attacks:new Set(),pips});
    }
    this.cameras.main.setBounds(0,0,FINISH+320,640);this.cameras.main.startFollow(this.player,true,1,1,150-this.cameras.main.width/2,0);
    this.keys=this.input.keyboard!.addKeys({jump:'SPACE',shoot:'X',pause:'P',escape:'ESC'}) as Record<string,Phaser.Input.Keyboard.Key>;
    this.input.keyboard!.addCapture(['SPACE','LEFT','RIGHT','UP','DOWN']);
    this.input.keyboard!.on('keydown-SPACE', (event: KeyboardEvent)=>{if(!event.repeat&&mode==='playing')this.queuedJump=true;});
    this.input.keyboard!.on('keydown-C',(e:KeyboardEvent)=>{if(!e.repeat&&mode==='playing')this.shoot(true);});
    this.input.keyboard!.on('keydown-V',(e:KeyboardEvent)=>{if(!e.repeat&&mode==='playing')this.shoot(true,'WHISTLE BLAST');});
    this.input.keyboard!.on('keydown-X', (event: KeyboardEvent)=>{if(!event.repeat&&mode==='playing')this.queuedShot=true;});
    window.addEventListener('keydown',e=>{if(e.code==='AltRight'){e.preventDefault();touch.shoot=true;if(mode==='playing')this.queuedShot=true;}if(e.code==='Escape'&&isFullscreen()){if(!document.fullscreenElement)leaveFullscreen();return;}if(e.code==='KeyP'||e.code==='Escape'){if(!e.repeat)togglePause();}});
    window.addEventListener('keyup',e=>{if(e.code==='AltRight')touch.shoot=false;});
    window.addEventListener('blur',()=>{this.releaseControls();if(mode==='playing'||mode==='penalty')togglePause();});
    document.addEventListener('visibilitychange',()=>{if(document.hidden&&(mode==='playing'||mode==='penalty'))togglePause();});

    // Wire up level selector UI
    const pills=document.querySelectorAll<HTMLButtonElement>('.level-pill');
    pills.forEach(pill=>{
      pill.addEventListener('click',()=>{
        const lvl=pill.getAttribute('data-level') as LevelId;
        if(lvl&&LEVELS[lvl])this.selectLevel(lvl);
      });
    });

    this.physics.pause();
    Object.defineProperty(window,'footballBoy',{get:()=>({mode,audio:stadiumAudio.snapshot,level:this.currentLevel.id,levelEnd:FINISH,isTouchDevice:document.body.classList.contains('touch-device'),power:this.power,nextSpecial:this.levelSpecial(),activeSpecial:this.activeSpecial,specialShots:this.specialShots,penalty:penaltyScene.scene.isActive()?penaltyScene.snapshot:null,x:this.player.x,y:this.player.y,cameraX:this.cameras.main.scrollX,health:this.health,score:this.score,ball:this.ballState,enemies:this.enemies.map(e=>({x:e.sprite.x,y:e.sprite.y,state:e.state,kind:e.kind,scale:e.scale,hp:e.hp,maxHp:e.maxHp,tired:e.hp>0&&e.hp<e.maxHp,texture:e.sprite.texture.key})),grounded:this.player.body?.blocked.down,setLevel:(id:LevelId)=>this.selectLevel(id),beginPenalty:()=>this.beginPenalty()})});
  }

  selectLevel(id:LevelId){
    if(!LEVELS[id])return;
    this.currentLevel=LEVELS[id];

    // Update backdrop and pitch textures
    if(this.backdrop)this.backdrop.setTexture(this.currentLevel.backdropTexture);
    if(this.pitch)this.pitch.setTexture(this.currentLevel.pitchTexture);

    // Update platforms
    if(this.platforms){
      this.platforms.getChildren().forEach(p=>{
        (p as Phaser.Physics.Arcade.Sprite).setTexture(this.currentLevel.platformTexture);
      });
    }

    // Update in-game texts
    if(this.introBannerText)this.introBannerText.setText(this.currentLevel.introBanner);
    if(this.benchTexts){
      this.benchTexts.forEach((txt,idx)=>{
        if(this.currentLevel.benchLabels[idx])txt.setText(this.currentLevel.benchLabels[idx]);
      });
    }

    // Update player texture
    if(this.player)this.player.setTexture(this.currentLevel.prefix+'boy0');

    // Update enemies textures
    for(const e of this.enemies){
      e.sprite.setTexture(this.enemyTexture(e,e.state==='down'?'down':'walk',0));
    }

    // Update DOM UI elements
    document.querySelectorAll<HTMLButtonElement>('.level-pill').forEach(pill=>{
      const active=pill.getAttribute('data-level')===id;
      pill.classList.toggle('active',active);
      pill.setAttribute('aria-checked',String(active));
    });

    $('overlay-tag').textContent=this.currentLevel.tag;
    $('overlay-title').innerHTML=this.currentLevel.title;
    $('overlay-description').innerHTML=this.currentLevel.description;
    $('overlay-hint').textContent=this.currentLevel.hint;

    const locBadge=document.querySelector('.location-badge span');
    if(locBadge)locBadge.textContent=this.currentLevel.location;

    const matchLabel=document.querySelector('.match-label');
    if(matchLabel)matchLabel.innerHTML=`<span class="live-dot"></span> `+this.currentLevel.matchLabel;

    const introEyebrow=document.querySelector('.intro .eyebrow');
    if(introEyebrow)introEyebrow.textContent=this.currentLevel.eyebrow;

    const introH1=document.querySelector('.intro h1');
    if(introH1)introH1.innerHTML=id==='madrid'?'Welcome to <em>Madrid.</em>':id==='holytown'?'Welcome to <em>Holytown.</em>':'Welcome to <em>Paradise.</em>';

    const stampBadge=document.querySelector('.level-stamp span');
    if(stampBadge)stampBadge.textContent=this.currentLevel.tag.split('·')[0].trim();

    const stampTitle=document.querySelector('.level-stamp strong');
    if(stampTitle)stampTitle.textContent=this.currentLevel.name;

    const stampSmall=document.querySelector('.level-stamp small');
    if(stampSmall)stampSmall.textContent=id==='madrid'?'MADRID / EUROPEAN NIGHT':id==='holytown'?'LANARKSHIRE · OPEN DAYLIGHT':'GLASGOW · UNDER THE LIGHTS';

    beep(520,.08,'sine',.03);
  }

  releaseControls(){Object.keys(touch).forEach(k=>touch[k as keyof typeof touch]=false);this.input.keyboard?.resetKeys();this.queuedJump=false;this.queuedShot=false;this.shotBuffer=0;this.jumpBuffer=0;}
  start(){
    void stadiumAudio.start('run');
    this.transitionTimer?.remove();this.scene.stop('finale');this.cameras.main.resetFX();finaleCheckpoint=false;this.tweens.killTweensOf(this.player);this.player.setAngle(0);this.power=0;this.specialIndex=0;this.specialShots=0;this.activeSpecial=null;this.specialElapsed=0;this.attackSequence=0;this.shotAttack=0;this.effects.clear();this.checkpoints.clear();this.ball.setVisible(true).clearTint().setDisplaySize(31.32,31.32);
    $('overlay-hint').textContent=this.currentLevel.hint;
    this.health=5;this.score=0;this.invulnerable=0;this.ballState='feet';this.shotCooldown=0;this.runTime=0;this.lastJump=false;this.lastShoot=false;this.jumpBuffer=0;this.shotBuffer=0;this.coyote=0;this.shootPose=0;
    this.player.setPosition(150,GROUND-52).setVelocity(0).setAlpha(1);this.player.setTexture(this.currentLevel.prefix+'boy0');
    for(const e of this.enemies){
      this.tweens.killTweensOf(e.sprite);e.state='walk';e.timer=0;e.hp=e.maxHp;e.attacks.clear();
      e.sprite.setPosition(e.home,GROUND-49*e.scale).setAngle(0).setAlpha(1).clearTint().setTexture(this.enemyTexture(e,'walk',0)).setVelocity(0);
      e.sprite.body!.enable=true;e.sprite.body!.setSize(38,90);e.sprite.body!.setOffset(28,15);
      e.shadow.setScale(.8*e.scale);e.pips.setText('● ●').setVisible(e.maxHp>1);e.stars.forEach(s=>s.destroy());e.stars=[];
    }
    this.releaseControls();mode='playing';$('overlay').classList.add('hidden');this.physics.resume();this.cameras.main.setScroll(0,0);this.updateHud();this.toast(this.currentLevel.startToast);
  }
  toast(message:string){$('toast').textContent=message;$('toast').style.opacity='1';this.time.delayedCall(1600,()=>{$('toast').style.opacity='0';});}
  levelSpecial():Special{return this.currentLevel.id==='madrid'?'OVERHEAD FLICK':this.currentLevel.id==='celtic'?'TOBY THE DOG':'FIRE SLIDE';}
  updateHud(){
    $('hearts').textContent='♥ '.repeat(this.health)+'♡ '.repeat(5-this.health);$('score').textContent=String(this.score).padStart(2,'0');
    const progress=Math.min(100,Math.max(0,Math.floor((this.player.x-150)/(FINISH-150)*100)));$('progress').style.width=progress+'%';$('progress-label').textContent=progress+'%';
    $('special-fill').style.width=this.power+'%';$('special-count').textContent=this.power===100?'READY!':(this.power/25)+' / 4';$('special-name').textContent=this.levelSpecial()+(this.power===100?' / C: SPECIAL!':'');
    document.querySelector('.special-hud')!.classList.toggle('ready',this.power===100);const b=document.querySelector<HTMLButtonElement>('[data-control=special]')!;b.disabled=this.power<100||mode!=='playing';b.classList.toggle('ready',this.power===100);
  }
  shoot(special=false,override?:Special){
    if(special&&this.power<100)return;
    if(this.ballState!=='feet'||this.shotCooldown>0)return;
    if(special&&(override??this.levelSpecial())==='OVERHEAD FLICK'){
      this.flickTarget=this.enemies.filter(e=>e.state!=='down').sort((a,b)=>Phaser.Math.Distance.Between(this.player.x,this.player.y,a.sprite.x,a.sprite.y)-Phaser.Math.Distance.Between(this.player.x,this.player.y,b.sprite.x,b.sprite.y))[0]??null;
      if(!this.flickTarget)return;
      this.flickOrigin={x:this.player.x-28,y:this.player.y+36};this.flickExploded=false;
    }
    this.shotAttack=++this.attackSequence;this.ballState='out';this.shotStart=this.player.x;this.shotCooldown=.5;this.shootPose=.22;this.specialY=this.player.y+21;
    this.ball.setPosition(this.player.x+43,this.specialY);beep(330,.12,'triangle');
    if(special){
      this.activeSpecial=override??this.levelSpecial();stadiumAudio.react('trick');this.specialShots++;this.power=0;this.specialElapsed=0;this.updateHud();this.toast(this.activeSpecial+'!');
      if(this.activeSpecial==='OVERHEAD FLICK'){this.ball.setPosition(this.flickOrigin.x,this.flickOrigin.y);this.shootPose=.55;}
      if(this.activeSpecial==='BICYCLE KICK')this.tweens.add({targets:this.player,angle:-360,duration:520,onComplete:()=>this.player.setAngle(0)});
      if(this.activeSpecial==='FIREBALL')this.ball.setTint(0xffb044).setDisplaySize(43,43);
      if(this.activeSpecial==='WHISTLE BLAST'){
        this.ball.setVisible(false);beep(1600,.45,'sine',.04);
        for(const e of this.enemies)if(e.state!=='down'&&e.sprite.x>this.player.x-35&&e.sprite.x<this.player.x+850)this.hitEnemy(e,this.shotAttack);
        this.toast('WHISTLE BLAST!');
      }
    }
  }
  endSpecial(){
    this.activeSpecial=null;this.player.setAngle(0);this.effects.clear();this.ball.setVisible(true).clearTint().setDisplaySize(31.32,31.32);this.ballState='return';
  }
  updateSpecial(dt:number){
    this.specialElapsed+=dt;this.effects.clear();const type=this.activeSpecial;
    if(type==='OVERHEAD FLICK'){
      const target=this.flickTarget!;
      if(!this.flickExploded){
        const t=Math.min(1,this.specialElapsed/1.05),x=target.sprite.x,y=(target.sprite.body as Phaser.Physics.Arcade.Body).top+18;
        // A quadratic arc lifts the ball from behind the heel, over the head,
        // and steers down onto the selected opponent even while they move.
        this.ball.x=Phaser.Math.Linear(this.flickOrigin.x,x,t);
        this.ball.y=Phaser.Math.Linear(this.flickOrigin.y,y,t)-Math.sin(Math.PI*t)*210;
        this.ball.rotation+=dt*22;
        this.effects.lineStyle(3,0xffe7a6,.65);this.effects.strokeCircle(this.ball.x,this.ball.y,22);
        this.effects.lineStyle(2,0xffdf8a,.7);this.effects.strokeEllipse(x,GROUND-5,65,15);
        if(t===1){
          this.flickImpact={x,y};this.flickExploded=true;this.ball.setVisible(false);
          if(target.state!=='down'){target.hp=0;this.knockOut(target);}
          this.cameras.main.shake(180,.009);beep(85,.28,'sawtooth',.06);
        }
      }
      if(this.flickExploded){
        const t=Math.min(1,(this.specialElapsed-1.05)/.48),g=this.effects,{x,y}=this.flickImpact;
        g.fillStyle(0xfff3b5,(1-t)*.8);g.fillCircle(x,y,18+t*65);
        g.lineStyle(7,0xffa12d,1-t);g.strokeCircle(x,y,20+t*100);
        for(let i=0;i<12;i++){const a=i*Math.PI/6;g.fillStyle(i%2?0xffc53c:0xff7130,1-t);g.fillCircle(x+Math.cos(a)*t*110,y+Math.sin(a)*t*80,12*(1-t)+2);}
        if(t===1){this.flickTarget=null;this.endSpecial();}
      }
      return;
    }
    if(type==='TOBY THE DOG'||type==='FIRE SLIDE'){
      const slide=type==='FIRE SLIDE',x=slide?this.player.x+65:this.shotStart+this.specialElapsed*720,y=GROUND-32,g=this.effects;
      this.ball.setVisible(false);
      if(slide){this.player.setAngle(-65);this.invulnerable=Math.max(this.invulnerable,.12);}
      for(let i=0;i<12;i++){g.fillStyle(slide?(i%2?0xff6428:0xffcc49):0xcce8ac,.65-i*.05);g.fillCircle(x-i*9,GROUND-18-Math.sin(i+this.specialElapsed*22)*9,12-i*.65);}
      if(!slide){const bounce=Math.sin(this.specialElapsed*24)*6;g.fillStyle(0xb77a45);g.fillEllipse(x,y+bounce,65,30);g.fillCircle(x+31,y-13+bounce,18);g.fillStyle(0x65432d);g.fillEllipse(x+21,y-12+bounce,13,28);g.lineStyle(8,0xb77a45);g.lineBetween(x-28,y,x-46,y-25+bounce);for(const offset of [-20,18]){g.lineStyle(7,0xb77a45);g.lineBetween(x+offset,y+8,x+offset+Math.sin(this.specialElapsed*24+offset)*12,GROUND-3);}g.fillStyle(0x191d20);g.fillCircle(x+43,y-14+bounce,4);g.fillCircle(x+35,y-20+bounce,3);g.lineStyle(4,0x39b66a);g.lineBetween(x+22,y-3+bounce,x+30,y+1+bounce);}
      for(const e of this.enemies)if(e.state!=='down'&&Math.abs(e.sprite.x-x)<85)this.hitEnemy(e,this.shotAttack);
      if(this.specialElapsed>(slide?1.5:1.8))this.endSpecial();return;
    }
    if(type==='WHISTLE BLAST'){
      const x=this.player.x,y=this.player.y,wave=Math.sin(this.specialElapsed*24)*10;
      this.player.setTexture(this.currentLevel.prefix+'boy0');
      this.effects.lineStyle(9,0xe6b18c);this.effects.lineBetween(x+8,y-10,x+8,y-16);this.effects.lineBetween(x-12,y-8,x-30,y-65+wave);
      this.effects.fillStyle(0xf04444);this.effects.fillRoundedRect(x-42,y-95+wave,25,35,3);
      this.effects.lineStyle(2,0x173a35);this.effects.lineBetween(x+8,y-16,x+5,y-20);this.effects.fillStyle(0xdce6e9);this.effects.fillRoundedRect(x+1,y-21,12,7,3);

      for(let i=0;i<3;i++){const radius=(this.specialElapsed*850+i*90)%850;this.effects.lineStyle(4,0xdaf6b1,Math.max(0,1-radius/850));this.effects.strokeEllipse(this.shotStart+radius*.6,GROUND-75,radius*.9,radius*.45);}
      if(this.specialElapsed>.8)this.endSpecial();return;
    }
    const range=type==='FIREBALL'?1100:type==='BICYCLE KICK'?950:820;
    const speed=type==='FIREBALL'?1050:950;this.ball.x+=dt*speed;this.ball.rotation+=dt*28;
    const fraction=Math.min(1,(this.ball.x-this.shotStart)/range);
    this.ball.y=this.specialY-(type==='RAINBOW FLICK'?Math.sin(fraction*Math.PI)*125:type==='BICYCLE KICK'?Math.sin(fraction*Math.PI)*38:0);
    const colors=type==='RAINBOW FLICK'?[0xef6b78,0xffb85a,0xf3ed85,0x91de82,0x6fcbe1,0xa392e5]:type==='FIREBALL'?[0xfff2a0,0xffb640,0xff7a2b,0xf24b36]:[0xeafbc5,0xb0ecc5,0x80d6ef];
    for(let i=0;i<16;i++){this.effects.fillStyle(colors[i%colors.length],Math.max(0,.7-i*.045));this.effects.fillCircle(this.ball.x-12-i*7,this.ball.y+Math.sin(this.specialElapsed*12-i*.3)*6,Math.max(2,12-i*.5));}
    for(const e of this.enemies){
      if(e.state==='down')continue;
      if(this.ballHitsEnemy(e))this.hitEnemy(e,this.shotAttack);
    }
    if(fraction>=1||this.ball.x>FINISH+220){
      if(type==='RAINBOW FLICK')for(const e of this.enemies)if(e.state!=='down'&&Math.abs(e.sprite.x-this.ball.x)<175)this.hitEnemy(e,this.shotAttack);
      this.endSpecial();
    }
  }
  beginPenalty(){
    if(stadiumAudio.snapshot.playing)stadiumAudio.setMood('penalty');else void stadiumAudio.start('penalty');
    this.transitionTimer?.remove();this.physics.pause();this.releaseControls();this.player.setAngle(0);this.effects.clear();mode='penalty';finaleCheckpoint=true;$('overlay').classList.add('hidden');$('progress').style.width='100%';$('progress-label').textContent='THE LAST KICK';
    this.scene.stop('finale');this.scene.launch('finale',{levelId:this.currentLevel.id,sound:beep,onComplete:(won:boolean,goals:number,shots:number)=>{
      mode=won?'won':'lost';stadiumAudio.setMood('result');showOverlay(won?this.currentLevel.penaltyHeroWon:this.currentLevel.penaltyHeroLost,won?'What a run.<br/><em>What a finish.</em>':'One more go?<br/><em>From the spot.</em>',`${goals} goals from ${shots} shots. ${this.score} defenders beaten.<br/>${won?this.currentLevel.penaltySummaryWon:this.currentLevel.penaltySummaryLost}`,won?'PLAY AGAIN':'RETRY THE FINAL SHOTS');
      $('overlay-hint').textContent='CHOOSE 1–9 · HOLD RIGHT ⌥ / X · RELEASE IN THE GREEN ZONE';
    }});
  }
  enemyTexture(e:Pick<Enemy,'kind'|'hp'|'maxHp'>,pose:'walk'|'windup'|'slide'|'down',frame=0){
    const p=this.currentLevel.prefix;
    if(e.kind==='zombie')return pose==='walk'?`${p}zombie${frame%4}`:`${p}zombie-${pose}`;
    if(pose==='walk'||pose==='windup')return `${p}${e.kind}-${e.hp<e.maxHp?'tired':'walk'}${frame%2}`;
    return `${p}${e.kind}-${pose}`;
  }
  hitEnemy(e:Enemy,attack:number,stomp=false){
    const result=applyEnemyHit(e,attack);if(result==='ignored')return;
    if(result==='down'){this.knockOut(e,stomp);return;}
    e.state='hurt';e.timer=0;e.sprite.setAngle(0).clearTint().setTexture(this.enemyTexture(e,'walk',0)).setVelocityX(85);
    e.sprite.body!.setSize(38,90);e.sprite.body!.setOffset(28,15);
    e.pips.setText('○ ●');
    this.tweens.add({targets:e.sprite,alpha:.45,duration:75,yoyo:true,repeat:2});
    beep(215,.12,'triangle');this.toast('BIG LAD! ONE MORE HIT!');
  }
  ballHitsEnemy(e:Enemy){
    const body=e.sprite.body as Phaser.Physics.Arcade.Body,radius=this.activeSpecial?22:15;
    return this.ball.x+radius>=body.left&&this.ball.x-radius<=body.right&&this.ball.y+radius>=body.top&&this.ball.y-radius<=body.bottom;
  }
  knockOut(e:Enemy,stomp=false){
    if(e.state==='down')return;e.state='down';e.sprite.setVelocity(0);e.sprite.body!.enable=false;e.pips.setVisible(false);this.tweens.killTweensOf(e.sprite);e.sprite.setAlpha(1).clearTint().setTexture(this.enemyTexture(e,'down')).setAngle(0).setPosition(e.sprite.x,GROUND-49*e.scale);e.shadow.setScale(1.1*e.scale);
    for(let i=0;i<3;i++)e.stars.push(this.add.text(e.sprite.x,GROUND-65*e.scale,'★',{fontSize:'19px',color:'#f8e89e',stroke:'#796e2f',strokeThickness:1}).setOrigin(.5).setDepth(12));
    stadiumAudio.react(stomp?'trick':'knockout');
    this.score++;this.power=Math.min(100,this.power+CHARGE_PER_KNOCKOUT);this.updateHud();beep(180,.16,'square',.025);this.cameras.main.shake(75,.002);
    for(let i=0;i<7;i++){const p=this.add.image(e.sprite.x,GROUND-60,'spark').setDepth(15);this.tweens.add({targets:p,x:p.x+Phaser.Math.Between(-55,55),y:p.y-Phaser.Math.Between(20,80),alpha:0,scale:0,duration:450,onComplete:()=>p.destroy()});}
    const cheers=this.currentLevel.id==='holytown'?['WHAT A SHOT!','COLTS ON FIRE!','KEEP IT GOING!']:['WHAT A SHOT!','BHOY, OH BHOY!','KEEP IT GOING!'];
    this.toast(stomp?'WHAT A JUMP!':cheers[this.score%3]);
  }
  finish(won:boolean){
    mode=won?'won':'lost';stadiumAudio.setMood('result');this.physics.pause();
    showOverlay(won?this.currentLevel.wonHeader:this.currentLevel.lostHeader,won?this.currentLevel.wonTitle:this.currentLevel.lostTitle,won?this.currentLevel.wonText(this.health,this.score):this.currentLevel.lostText,'PLAY AGAIN');
    if(won){$('progress').style.width='100%';$('progress-label').textContent='100%';beep(780,.4,'triangle');}
  }
  update(_time:number,delta:number){
    if(!this.player)return;
    const dt=Math.min(delta/1000,.04);this.runTime+=dt;
    this.backdrop.tilePositionX=this.cameras.main.scrollX*.24;
    if(mode!=='playing')return;
    this.invulnerable=Math.max(0,this.invulnerable-dt);this.shotCooldown=Math.max(0,this.shotCooldown-dt);this.shootPose=Math.max(0,this.shootPose-dt);
    const body=this.player.body as Phaser.Physics.Arcade.Body;
    const jump=this.keys.jump.isDown||touch.jump,shoot=this.keys.shoot.isDown||touch.shoot;
    this.player.setVelocityX(RUN_SPEED);this.player.setFlipX(false);
    if(body.blocked.down)this.coyote=.10;else this.coyote=Math.max(0,this.coyote-dt);
    if(this.queuedJump||(jump&&!this.lastJump))this.jumpBuffer=.13;else this.jumpBuffer=Math.max(0,this.jumpBuffer-dt);
    const jumped=this.jumpBuffer>0&&this.coyote>0;
    if(jumped){this.player.setVelocityY(-680);this.coyote=0;this.jumpBuffer=0;beep(540,.1,'sine',.035);}
    if(!jump&&this.lastJump&&body.velocity.y< -260)this.player.setVelocityY(-260);
    if(this.queuedShot||(shoot&&!this.lastShoot))this.shotBuffer=.18;else this.shotBuffer=Math.max(0,this.shotBuffer-dt);
    if(this.shotBuffer>0&&this.ballState==='feet'&&this.shotCooldown<=0){this.shotBuffer=0;this.shoot();}
    this.queuedJump=false;this.queuedShot=false;this.lastJump=jump||jumped;this.lastShoot=shoot;
    const p=this.currentLevel.prefix;
    const frame=this.shootPose>0?`${p}boy-kick`:!body.blocked.down?`${p}boy-jump`:`${p}boy${Math.floor(this.runTime*13)%8}`;
    this.player.setTexture(frame);
    this.player.setAlpha(this.invulnerable>0?(Math.floor(this.runTime*15)%2?.35:1):1);
    this.shadow.setPosition(this.player.x,GROUND-2).setScale(body.blocked.down? .8:.55).setAlpha(body.blocked.down?.65:.3);
    if(this.ballState==='feet'){
      const footX=this.player.x+42;this.ball.x=footX+Math.sin(this.runTime*13)*7;this.ball.y=body.blocked.down?this.player.y+38-Math.abs(Math.sin(this.runTime*13))*6:this.player.y+40;
      this.ball.rotation+=dt*11;
    }else if(this.ballState==='out'&&this.activeSpecial){
      this.updateSpecial(dt);
    }else if(this.ballState==='out'){
      this.ball.x+=dt*840;this.ball.rotation+=dt*25;
      for(const e of this.enemies){if(e.state==='down')continue;if(this.ballHitsEnemy(e)){this.hitEnemy(e,this.shotAttack);this.ballState='return';break;}}
      if(this.ball.x-this.shotStart>540||this.ball.x>FINISH+250)this.ballState='return';
    }else{
      const target=new Phaser.Math.Vector2(this.player.x+40,this.player.y+36),distance=Phaser.Math.Distance.Between(this.ball.x,this.ball.y,target.x,target.y);if(distance<dt*1000+10){this.ballState='feet';this.shotCooldown=0;}else{const v=target.subtract(new Phaser.Math.Vector2(this.ball.x,this.ball.y)).normalize().scale(dt*1000);this.ball.x+=v.x;this.ball.y+=v.y;}this.ball.rotation-=dt*20;
    }
    for(const e of this.enemies){
      e.timer+=dt;const s=e.sprite;
      e.pips.setPosition(s.x,(s.body as Phaser.Physics.Arcade.Body).top-14);
      if(e.state==='down'){e.stars.forEach((star,i)=>{const a=this.runTime*3+i*Math.PI*2/3;star.setPosition(s.x+Math.cos(a)*27,GROUND-62*e.scale+Math.sin(a)*7).setScale(.8+Math.sin(a)*.15);});continue;}
      const enemyBody=s.body as Phaser.Physics.Arcade.Body;
      const overlapsHead=body.right>enemyBody.left&&body.left<enemyBody.right;
      const crossedHead=body.prev.y+body.height<=enemyBody.top+14&&body.bottom>=enemyBody.top;
      if(body.velocity.y>0&&overlapsHead&&crossedHead&&body.top<enemyBody.top){
        this.player.y-=Math.max(0,body.bottom-enemyBody.top)+2;
        this.player.setVelocityY(-430);this.coyote=0;this.jumpBuffer=0;
        this.hitEnemy(e,++this.attackSequence,true);continue;
      }
      const dist=s.x-this.player.x;
      const difficulty=e.home>10000?1.25:e.home>6000?1.1:1;
      const tired=e.hp<e.maxHp;
      if(e.state==='hurt'){
        if(e.timer>.4){e.state='walk';e.timer=0;e.sprite.setAlpha(1);}
      }else if(e.state==='walk'){
        if(Math.abs(dist)<610){s.setVelocityX(dist>0?-46*difficulty*(tired?.65:1):28);s.setFlipX(dist>0);s.setTexture(this.enemyTexture(e,'walk',Math.floor(e.timer*(tired?5:8))));}else s.setVelocityX(0);
        if(dist>0&&dist<215&&Math.abs(s.y-this.player.y)<150){e.state='windup';e.timer=0;s.setVelocityX(0);s.setTexture(this.enemyTexture(e,'windup'));s.setTint(0xf2d68b);}
      }else if(e.state==='windup'){
        if(e.timer>(tired?.6:.48)/difficulty){e.state='slide';e.timer=0;s.clearTint();s.setTexture(this.enemyTexture(e,'slide'));if(tired)s.setTint(0xc6d1b9);s.setAngle(0);s.body!.setSize(65,55);s.body!.setOffset(13,45);s.setVelocityX(-335*difficulty);}
      }else if(e.state==='slide'&&e.timer>.75){e.state='walk';e.timer=0;s.setAngle(0);s.body!.setSize(38,90);s.body!.setOffset(28,15);s.setVelocityX(-40);}
      e.shadow.x=s.x;
      if(e.state!=='hurt'&&this.invulnerable<=0&&this.physics.overlap(this.player,e.sprite)){
        this.health--;this.invulnerable=1.8;this.player.setVelocityY(-290);this.cameras.main.shake(160,.007);beep(110,.22,'sawtooth',.035);this.updateHud();if(this.health<=0){this.finish(false);return;}this.toast('WATCH THE TACKLE!');
      }
    }
    for(const checkpoint of [5200,10200])if(this.player.x>=checkpoint&&!this.checkpoints.has(checkpoint)){
      this.checkpoints.add(checkpoint);if(this.health<5){this.health++;this.toast('THE CROWD LIFTS YOU! +1 HEART');}
    }
    this.updateHud();if(this.player.x>=FINISH){
      mode='transition';this.physics.pause();this.releaseControls();this.cameras.main.fadeOut(500,4,12,10);
      this.transitionTimer=this.time.delayedCall(550,()=>this.beginPenalty());
    }
  }
}
function showOverlay(tag:string,title:string,description:string,button:string){$('overlay-tag').textContent=tag;$('overlay-title').innerHTML=title;$('overlay-description').innerHTML=description;$('play').innerHTML=button+' <span>→</span>';$('overlay').classList.remove('hidden');}
const scene=new FootballBoy('match');
const penaltyScene=new PenaltyScene();
export const game=new Phaser.Game({type:Phaser.AUTO,parent:'game',width:1280,height:640,backgroundColor:'#142d38',antialias:true,physics:{default:'arcade',arcade:{gravity:{x:0,y:0},fixedStep:false,debug:false}},scene:[scene,penaltyScene],scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},render:{roundPixels:true}});
function togglePause(){
  if(mode==='playing'||mode==='penalty'){
    resumeMode=mode;mode='paused';stadiumAudio.pause();scene.physics.pause();scene.releaseControls();
    if(resumeMode==='penalty'){penaltyScene.cancelCharge();scene.scene.pause('finale');}
    showOverlay('TAKE A BREATHER.','Half-time?<br/><em>Your call.</em>','The crowd will wait.<br/>Your next great moment is just a touch away.','BACK TO THE GAME');$('pause').setAttribute('aria-label','Resume game');
  }else if(mode==='paused'){
    mode=resumeMode;void stadiumAudio.resume();scene.releaseControls();if(mode==='penalty')scene.scene.resume('finale');else scene.physics.resume();$('overlay').classList.add('hidden');$('pause').setAttribute('aria-label','Pause game');
  }
}
$('play').addEventListener('click',()=>{if(frame.classList.contains('is-fullscreen')&&!document.fullscreenElement)void frame.requestFullscreen?.().catch(()=>{});if(!scene.player)return;if(mode==='paused')togglePause();else if(mode==='lost'&&finaleCheckpoint)scene.beginPenalty();else scene.start();});
$('restart').addEventListener('click',()=>{if(scene.player)scene.start();});$('pause').addEventListener('click',togglePause);
$('sound').addEventListener('click',()=>{void stadiumAudio.setEnabled(!stadiumAudio.enabled);syncSoundButton();});
for(const button of document.querySelectorAll<HTMLButtonElement>('[data-control]')){const control=button.dataset.control as keyof typeof touch;button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);touch[control]=true;if(control==='jump'&&mode==='playing')scene.queuedJump=true;if(control==='shoot'&&mode==='playing')scene.queuedShot=true;if(control==='special'&&mode==='playing')scene.shoot(true);if(mode==='penalty'&&control==='shoot')penaltyScene.beginCharge();button.classList.add('active');});const release=()=>{touch[control]=false;if(mode==='penalty'&&control==='shoot')penaltyScene.releaseCharge();button.classList.remove('active');};button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);}
const frame=document.querySelector<HTMLElement>('.game-frame')!;
function isFullscreen(){return !!document.fullscreenElement||frame.classList.contains('is-fullscreen');}
function syncFullscreen(){
  const active=isFullscreen();
  $('fullscreen').setAttribute('aria-label',active?'Exit fullscreen':'Enter fullscreen');
  $('fullscreen').setAttribute('aria-pressed',String(active));
  $('fullscreen').innerHTML=active?'⛶ <span>EXIT FULLSCREEN</span>':'⛶ <span>FULLSCREEN</span>';
  document.body.classList.toggle('fullscreen-active',active);
  requestAnimationFrame(resize);
}
function leaveFullscreen(){
  if(document.fullscreenElement)void document.exitFullscreen().catch(()=>{});
  frame.classList.remove('is-fullscreen');syncFullscreen();
}
$('fullscreen').addEventListener('click',async()=>{
  if(isFullscreen()){leaveFullscreen();return;}
  if(frame.requestFullscreen){
    try{await frame.requestFullscreen();}catch{frame.classList.add('is-fullscreen');}
  }else frame.classList.add('is-fullscreen');
  syncFullscreen();
});
document.addEventListener('fullscreenchange',syncFullscreen);
function syncTouchDevice(){
  document.body.classList.toggle('touch-device',isTouchOrMobile());
}
window.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')document.body.classList.add('touch-device');},{passive:true});
function resize(){
  syncTouchDevice();
  const viewport=document.querySelector<HTMLElement>('.viewport')!;
  const width=isFullscreen()?Math.max(400,Math.round(viewport.clientWidth/viewport.clientHeight*640)):(window.innerWidth<=600?864:1280);
  game.scale.setGameSize(width,640);
  if(scene.backdrop){scene.backdrop.width=width;scene.cameras.main.setFollowOffset(150-width/2,0);}
}
frame.classList.add('is-fullscreen');syncFullscreen();
window.addEventListener('resize',resize);game.events.once('ready',resize);resize();