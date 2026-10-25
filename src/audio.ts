/** Original match-night music and layered supporter audio, mixed locally. */
export type CrowdReaction='knockout'|'trick'|'goal'|'miss';
type Mood='run'|'penalty'|'result';
const FILES={music:'paradise-anthem',chant:'liam-chant',cheer:'crowd-cheer',bed:'crowd-bed'} as const;
export class StadiumAudio {
  enabled=true;private playing=false;private paused=false;private context?:AudioContext;
  private master?:GainNode;private musicGain?:GainNode;private crowdGain?:GainNode;private effectsGain?:GainNode;
  private buffers=new Map<string,AudioBuffer>();private loading?:Promise<void>;private loadError:string|null=null;
  private loops:AudioBufferSourceNode[]=[];private oneShots=new Set<AudioScheduledSourceNode>();
  private timer?:ReturnType<typeof setInterval>;private nextChant=0;private lastCheer=-10;private lastPriority=0;private mood:Mood='run';
  private generation=0;private loopsStarted=0;private chants=0;private reactions=0;private lastReaction:CrowdReaction|null=null;
  constructor(){try{this.enabled=localStorage.getItem('football-boy-sound')!=='off';}catch{/* Storage is optional. */}}
  get snapshot(){return {enabled:this.enabled,playing:this.playing,paused:this.paused,contextState:this.context?.state??'not-started',loaded:this.buffers.size===4,loopsStarted:this.loopsStarted,chants:this.chants,crowdReactions:this.reactions,lastReaction:this.lastReaction,loadError:this.loadError};}
  private setup(){
    if(this.context)return;
    const ctx=this.context=new AudioContext();const limiter=ctx.createDynamicsCompressor();
    limiter.threshold.value=-14;limiter.knee.value=12;limiter.ratio.value=5;limiter.attack.value=.005;limiter.release.value=.25;limiter.connect(ctx.destination);
    this.master=ctx.createGain();this.master.gain.value=.75;this.master.connect(limiter);
    this.musicGain=ctx.createGain();this.musicGain.gain.value=.28;this.musicGain.connect(this.master);
    this.crowdGain=ctx.createGain();this.crowdGain.gain.value=.7;this.crowdGain.connect(this.master);
    this.effectsGain=ctx.createGain();this.effectsGain.gain.value=.5;this.effectsGain.connect(this.master);
    this.loading=Promise.all(Object.entries(FILES).map(async([key,file])=>{
      const response=await fetch(`/assets/audio/${file}.mp3`);if(!response.ok)throw new Error(`Audio asset unavailable: ${file}`);
      this.buffers.set(key,await ctx.decodeAudioData(await response.arrayBuffer()));
    })).then(()=>{}).catch(error=>{this.loadError=String(error);});
  }
  async start(mood:Mood='run'){
    this.playing=true;this.paused=false;this.mood=mood;const generation=++this.generation;
    this.stopSources();if(!this.enabled)return;
    this.setup();await this.context!.resume();await this.loading;
    if(generation!==this.generation||!this.enabled||this.paused||!this.playing)return;
    this.beginLoops();
  }
  private beginLoops(){
    if(this.loops.length||!this.context||this.buffers.size!==4)return;
    const ctx=this.context;
    for(const [key,gain] of [['music',1],['bed',.045]] as const){
      const source=ctx.createBufferSource(),level=ctx.createGain();source.buffer=this.buffers.get(key)!;source.loop=true;level.gain.value=gain;source.connect(level);level.connect(key==='music'?this.musicGain!:this.crowdGain!);source.start();this.loops.push(source);
    }
    this.loopsStarted++;this.nextChant=ctx.currentTime+1.2;this.setMood(this.mood);
    this.timer=setInterval(()=>{if(!this.enabled||this.paused||!this.context||this.context.state!=='running')return;if(this.context.currentTime+.1>=this.nextChant){this.playChant(this.nextChant,.48);this.nextChant=this.context.currentTime+9.6;}},100);
  }
  private sample(key:string,when:number,gain:number,rate=1){
    if(!this.context||!this.buffers.has(key))return;
    const source=this.context.createBufferSource(),level=this.context.createGain();source.buffer=this.buffers.get(key)!;source.playbackRate.value=rate;level.gain.value=gain;source.connect(level);level.connect(this.crowdGain!);this.oneShots.add(source);
    source.onended=()=>{this.oneShots.delete(source);source.disconnect();level.disconnect();};source.start(Math.max(when,this.context.currentTime));
  }
  private playChant(when:number,gain:number){this.chants++;this.sample('chant',when,gain);}
  setMood(mood:Mood){this.mood=mood;if(this.context&&this.musicGain){this.musicGain.gain.cancelScheduledValues(this.context.currentTime);this.musicGain.gain.setTargetAtTime(mood==='penalty'?.17:mood==='result'?.21:.28,this.context.currentTime,.3);}}
  react(type:CrowdReaction){
    this.reactions++;this.lastReaction=type;
    if(!this.enabled||this.paused||!this.playing||!this.context||this.context.state!=='running')return;
    const now=this.context.currentTime,priority=type==='goal'?4:type==='trick'?3:type==='knockout'?2:1;
    // Multi-hit specials make one rising roar rather than stacking a new crowd
    // on every opponent in the same frame.
    if(now-this.lastCheer<.65&&priority<=this.lastPriority)return;
    this.lastCheer=now;this.lastPriority=priority;
    if(type==='miss'){this.tone(145,.3,'triangle',.035);return;}
    this.sample('cheer',now,type==='goal'?.85:type==='trick'?.65:.38,type==='knockout'?1.03:1);
    if(type==='trick'||type==='goal'){this.playChant(now+.35,type==='goal'?.65:.5);this.nextChant=now+9.6;}
    this.musicGain!.gain.cancelScheduledValues(now);this.musicGain!.gain.setTargetAtTime(.12,now,.05);this.musicGain!.gain.setTargetAtTime(this.mood==='penalty'?.17:.28,now+2.1,.35);
  }
  tone(frequency:number,duration=.09,type:OscillatorType='sine',volume=.05){
    if(!this.enabled||this.paused||!this.context||this.context.state!=='running')return;
    const ctx=this.context,source=ctx.createOscillator(),gain=ctx.createGain();source.type=type;source.frequency.setValueAtTime(frequency,ctx.currentTime);source.frequency.exponentialRampToValueAtTime(Math.max(40,frequency*.45),ctx.currentTime+duration);gain.gain.setValueAtTime(volume,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+duration);source.connect(gain);gain.connect(this.effectsGain!);this.oneShots.add(source);source.onended=()=>{this.oneShots.delete(source);source.disconnect();gain.disconnect();};source.start();source.stop(ctx.currentTime+duration);
  }
  pause(){this.paused=true;if(this.context?.state==='running')void this.context.suspend();}
  async resume(){
    this.paused=false;if(!this.enabled||!this.playing)return;
    if(!this.context){await this.start(this.mood);return;}
    await this.context.resume();await this.loading;if(this.paused||!this.enabled)return;this.beginLoops();
  }
  async setEnabled(enabled:boolean){
    this.enabled=enabled;try{localStorage.setItem('football-boy-sound',enabled?'on':'off');}catch{/* Optional preference. */}
    if(!enabled){if(this.master&&this.context)this.master.gain.value=0;if(this.context?.state==='running')await this.context.suspend();}
    else{if(this.master)this.master.gain.value=.75;if(this.playing&&!this.paused)await this.resume();}
  }
  private stopSources(){
    if(this.timer)clearInterval(this.timer);this.timer=undefined;
    for(const source of [...this.loops,...this.oneShots]){try{source.stop();}catch{/* Already ended. */}}
    this.loops=[];this.oneShots.clear();this.lastCheer=-10;
  }
}
export const stadiumAudio=new StadiumAudio();
