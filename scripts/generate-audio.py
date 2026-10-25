"""Build original stadium audio. Requires numpy, scipy, ffmpeg and macOS say.
All notes, orchestration, crowd layering and room effects are generated here;
no commercial music, match broadcasts, or club anthem recordings are sampled.
"""
from pathlib import Path
import subprocess
import numpy as np
from scipy.io import wavfile
from scipy.signal import fftconvolve, resample

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/assets/audio'; TMP=ROOT/'.audio-generation'
OUT.mkdir(parents=True,exist_ok=True);TMP.mkdir(exist_ok=True)
SR=32000; BEAT=.6; RNG=np.random.default_rng(1888)

def hz(note): return 440*2**((note-69)/12)
def env(n,attack=.06,release=.2):
    e=np.ones(n,dtype=np.float32);a=min(n,int(attack*SR));r=min(n-a,int(release*SR))
    if a:e[:a]=np.sin(np.linspace(0,np.pi/2,a))**2
    if r:e[-r:]=np.cos(np.linspace(0,np.pi/2,r))**2
    return e

def tone(note,duration,kind):
    n=int(duration*SR);t=np.arange(n,dtype=np.float32)/SR;f=hz(note)
    vibrato=.00045*np.sin(2*np.pi*5.1*t);p=2*np.pi*f*(t+vibrato)
    sound=np.zeros(n,dtype=np.float32)
    if kind=='choir':
        for k in range(1,min(36,int(10000/f))):
            formant=sum(np.exp(-.5*((k*f-c)/w)**2)*a for c,w,a in [(720,180,1),(1120,230,.65),(2500,450,.18)])
            sound+=(.12+formant)/k*np.sin(k*p)
        return sound*env(n,.45,.7)*.45
    if kind=='strings':
        for k in range(1,13):sound+=np.sin(k*p+.2*np.sin(2*np.pi*.33*t))/(k**1.25)
        sound=(sound+np.sin(p*1.0025)*.2)*env(n,.3,.55)*.35
    elif kind=='brass':
        for k in range(1,9):sound+=np.sin(k*p)*(1/k**1.5)
        sound*=env(n,.09,.25)*.45
    else:sound=(np.sin(p)+.25*np.sin(p*2))*env(n,.02,.2)*.4
    return sound.astype(np.float32)

def add(track,clip,at,gain=1,pan=0,wrap=False):
    start=int(at*SR);stereo=clip if clip.ndim==2 else np.column_stack((clip*np.sqrt((1-pan)/2),clip*np.sqrt((1+pan)/2)))
    end=start+len(stereo)
    if start>=len(track):return
    count=min(len(stereo),len(track)-start);track[start:start+count]+=stereo[:count]*gain
    if wrap and end>len(track):track[:min(end-len(track),len(track))]+=stereo[count:count+min(end-len(track),len(track))]*gain

def room(track,seconds=2.7,wet=.22,wrap=False):
    n=int(SR*seconds);t=np.arange(n)/SR
    for ch in range(2):
        impulse=RNG.normal(0,1,n)*np.exp(-t*3.5/seconds);impulse[:int(.045*SR)]=0
        impulse/=np.sqrt(np.sum(impulse**2))*2
        tail=fftconvolve(track[:,ch],impulse)
        track[:,ch]+=tail[:len(track)]*wet
        if wrap:track[:min(len(tail)-len(track),len(track)),ch]+=tail[len(track):len(track)+min(len(tail)-len(track),len(track))]*wet
    return track

def export(name,track):
    peak=np.max(np.abs(track));track=np.tanh(track/(peak+.001)*1.3)*.78
    wav=TMP/(name+'.wav');wavfile.write(wav,SR,(track*32767).astype(np.int16))
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(wav),'-codec:a','libmp3lame','-q:a','3',str(OUT/(name+'.mp3'))],check=True)
    print(name,round(len(track)/SR,2),'seconds',flush=True)

# An original sixteen-bar minor-key fanfare, strings, brass and wordless choir.
# Deliberately its own melody and harmony rather than a transcription of an anthem.
chords=[[55,58,62],[51,55,58],[58,62,65],[53,57,60],[48,51,55],[56,60,63],[51,55,58],[50,54,57]]
melody=[[62,65,67,69],[67,65,63,62],[58,62,65,70],[69,67,65,60],[63,67,70,67],[60,63,68,67],[67,70,74,72],[69,66,62,57]]
length=64*BEAT;music=np.zeros((int(length*SR),2),dtype=np.float32)
for bar in range(16):
    chord=chords[bar%8];at=bar*4*BEAT
    for j,note in enumerate(chord):
        add(music,tone(note,4*BEAT+.65,'strings'),at,.31,[-.5,0,.5][j],True)
        add(music,tone(note+12,4*BEAT+.7,'choir'),at,.22,[-.4,.1,.4][j],True)
    for beat in range(4):
        add(music,tone(chord[0]-12,BEAT*.9,'bass'),at+beat*BEAT,.45,0,True)
        if bar>=2:
            note=melody[bar%8][beat]+(12 if bar>=12 and beat%2==0 else 0)
            add(music,tone(note,BEAT*.92,'brass'),at+beat*BEAT,.27 if bar>=8 else .2,.15,True)
        t=np.arange(int(SR*.28))/SR
        drum=np.sin(2*np.pi*(48*t+8*(1-np.exp(-t*23))))*np.exp(-t*15)
        add(music,drum,at+beat*BEAT,.30 if beat in (0,2) else .1,0,True)
        if beat in (1,3):
            clap=RNG.normal(0,1,int(SR*.12))*np.exp(-np.arange(int(SR*.12))/SR*40)
            add(music,clap,at+beat*BEAT,.055,-.25,True)
    if bar%4==3:
        n=int(SR*.8);t=np.arange(n)/SR;cymbal=RNG.normal(0,1,n)*np.exp(-t*6)
        add(music,cymbal,at+3*BEAT,.035,.5,True)
export('paradise-anthem',room(music,3.2,.2,True))

voices=['Daniel','Eddy (English (UK))','Reed (English (UK))','Grandpa (English (UK))']
def speech(word,index):
    path=TMP/f'voice-{index}-{word.replace("!","")}.aiff';wav=path.with_suffix('.wav')
    subprocess.run(['say','-v',voices[index],'-r','165','-o',str(path),word],check=True)
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(path),'-ac','1','-ar',str(SR),str(wav)],check=True)
    _,data=wavfile.read(wav);data=data.astype(np.float32)/32768
    active=np.flatnonzero(np.abs(data)>.012)
    if len(active):data=data[max(0,active[0]-int(.015*SR)):min(len(data),active[-1]+int(.04*SR))]
    return data/(np.max(np.abs(data))+.001)*.7

liam=[speech('Liam!',i) for i in range(4)]
yeah=[speech('Yeah!',i) for i in range(4)]
def crowd_word(samples):
    track=np.zeros((int(SR*1.1),2),dtype=np.float32)
    for person in range(28):
        clip=samples[person%len(samples)];ratio=RNG.uniform(.83,1.13);clip=resample(clip,max(1,int(len(clip)/ratio))).astype(np.float32)
        add(track,clip,RNG.uniform(0,.085),.1,RNG.uniform(-.95,.95))
    return track
name=crowd_word(liam);chant=np.zeros((int(SR*4.8),2),dtype=np.float32)
for at in [0,.6,1.2,2.4,3,3.6]:
    add(chant,name,at,.6)
    t=np.arange(int(.18*SR))/SR;stomp=np.sin(2*np.pi*62*t)*np.exp(-t*24)
    add(chant,stomp,at,.09)
export('liam-chant',room(chant,2,.25))
cheer=np.zeros((int(SR*3.2),2),dtype=np.float32)
for at in [0,.2,.45,.8]:add(cheer,crowd_word(yeah),at,.5)
n=int(SR*2.6);t=np.arange(n)/SR
for pan in [-.7,.7]:
    noise=RNG.normal(0,1,n);smooth=np.convolve(noise,np.ones(5)/5,mode='same');noise=(noise-smooth)*.10
    add(cheer,noise*np.minimum(1,t*9)*np.exp(-t*1.5),0,1,pan)
for at in RNG.uniform(.15,2.5,22):
    n=int(.06*SR);clap=RNG.normal(0,1,n)*np.exp(-np.arange(n)/SR*70);add(cheer,clap,at,.05,RNG.uniform(-1,1))
export('crowd-cheer',room(cheer,2.6,.28))
ambient=np.zeros((int(SR*6),2),dtype=np.float32)
for ch in range(2):
    white=RNG.normal(0,1,len(ambient));soft=np.convolve(white,np.ones(18)/18,mode='same');t=np.arange(len(ambient))/SR
    ambient[:,ch]=soft*(.45+.15*np.sin(2*np.pi*t/6+.7*ch))
    for note in [43,46,50]:ambient[:,ch]+=.006*np.sin(2*np.pi*hz(note)*t+.3*ch)*(.5+.5*np.sin(2*np.pi*t/6))
export('crowd-bed',room(ambient,2,.15,True))
