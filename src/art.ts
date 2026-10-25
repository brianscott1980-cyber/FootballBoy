import * as Phaser from 'phaser';

type Ctx = CanvasRenderingContext2D;
function canvas(scene: Phaser.Scene, key: string, w: number, h: number, draw: (c: Ctx) => void) {
  const t = scene.textures.createCanvas(key, w, h)!;
  draw(t.context); t.refresh();
}
function ellipse(c: Ctx, x: number, y: number, rx: number, ry: number, color: string) {
  c.fillStyle = color; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill();
}
function poly(c: Ctx, points: number[][], color: string) {
  c.fillStyle = color; c.beginPath(); points.forEach(([x,y],i) => i ? c.lineTo(x,y) : c.moveTo(x,y)); c.closePath(); c.fill();
}
function limb(c: Ctx, x: number, y: number, tx: number, ty: number, color: string, width: number) {
  c.strokeStyle = color; c.lineWidth = width; c.lineCap = 'round'; c.beginPath(); c.moveTo(x,y); c.lineTo(tx,ty); c.stroke();
}
export function makeArt(scene: Phaser.Scene) {
  canvas(scene,'stadium',1800,640,c=>{
    // Pitch-side view inspired by a European night at Celtic Park.
    const sky=c.createLinearGradient(0,0,0,530);
    sky.addColorStop(0,'#030607');sky.addColorStop(.55,'#080e10');sky.addColorStop(1,'#17251c');
    c.fillStyle=sky;c.fillRect(0,0,1800,640);
    let seed=824;const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
    const roofY=(x:number)=>105+80*Math.sin(Math.PI*x/1800);
    const bowl=(x:number)=>34*Math.sin(Math.PI*x/1800);

    // A continuous sweeping roof with dark steel ribs, rather than towers.
    c.beginPath();c.moveTo(0,roofY(0));
    for(let x=0;x<=1800;x+=15)c.lineTo(x,roofY(x));
    for(let x=1800;x>=0;x-=15)c.lineTo(x,roofY(x)+57);
    c.closePath();c.fillStyle='#172323';c.fill();
    for(let i=0;i<5;i++){
      c.beginPath();for(let x=0;x<=1800;x+=15){if(x===0)c.moveTo(x,roofY(x)+i*10);else c.lineTo(x,roofY(x)+i*10);}
      c.strokeStyle=i===0?'#3c4b46':'#263631';c.lineWidth=i===0?4:1;c.stroke();
    }
    for(let x=0;x<1800;x+=75){limb(c,x,roofY(x)+5,x+30,roofY(x+30)+51,'#080e0d',3);}
    c.fillStyle='#0b1312';c.fillRect(0,252,1800,220);

    // Thousands of small supporters follow the curve of the stadium bowl.
    for(let row=0;row<35;row++){
      for(let x=0;x<1800;x+=5){
        const px=x+(row%2)*2.5, y=238+row*6.1+bowl(px)*(1-row/40);
        const shade=random(),warm=row<13;
        c.fillStyle=shade>.94?'#e4dfb9':shade>.67?(warm?'#9b8954':'#899b78'):shade>.3?'#3e503a':'#1d2b25';
        c.fillRect(px,y,1.5+random(),1.5);
        c.fillStyle=shade>.8?'#b9c2a3':shade>.48?'#416647':'#15271e';c.fillRect(px-.5,y+1.7,3,2.4);
      }
    }
    // Curved walkways divide the three tiers; amber aisle lights pick them out.
    for(const base of [298,365]){
      c.beginPath();for(let x=0;x<=1800;x+=15){const y=base+bowl(x)*.6;if(x===0)c.moveTo(x,y);else c.lineTo(x,y);}
      c.lineWidth=12;c.strokeStyle='#080f0e';c.stroke();
      c.lineWidth=1;c.strokeStyle='#657044';c.stroke();
      for(let x=35;x<1800;x+=81){ellipse(c,x,base+bowl(x)*.6-1,1.8,1.1,'#d5a044');}
    }
    for(let x=75;x<1800;x+=190){
      const start=243+bowl(x);poly(c,[[x,start],[x+4,start],[x+25,458],[x+17,458]],'#101c16');
      for(let y=start+20;y<450;y+=15){c.fillStyle='#a08b453e';c.fillRect(x+((y-start)/215)*18,y,5,1);}
    }
    // Green match-night washes spilling across the crowd.
    for(const [x,y] of [[235,350],[785,410],[1380,385],[1670,300]]){
      const glow=c.createRadialGradient(x,y,0,x,y,115);glow.addColorStop(0,'#26e51a32');glow.addColorStop(.5,'#12b92c17');glow.addColorStop(1,'#04b62300');c.fillStyle=glow;c.fillRect(x-120,y-120,240,240);
    }
    // Illuminated club lettering on the front of the roof.
    c.save();c.translate(455,roofY(455)+26);c.rotate(.075);
    c.font='18px sans-serif';c.textAlign='center';c.shadowColor='#42ff3d';c.shadowBlur=12;c.fillStyle='#55e24d';c.fillText('CELTIC FOOTBALL CLUB 1888',0,0);c.restore();

    // A blue-edged stadium screen showing a miniature pitch and the teams.
    c.save();c.translate(1055,207);c.rotate(-.12);
    c.shadowColor='#1e70ff';c.shadowBlur=18;c.fillStyle='#15345d';c.fillRect(-7,-7,140,88);c.shadowBlur=0;
    c.fillStyle='#080f1b';c.fillRect(-3,-3,132,80);c.fillStyle='#dceaf2';c.fillRect(0,0,126,9);
    const screen=c.createLinearGradient(0,9,0,73);screen.addColorStop(0,'#718c8d');screen.addColorStop(.48,'#bcc5b8');screen.addColorStop(.5,'#3c8e4b');screen.addColorStop(1,'#1b6634');c.fillStyle=screen;c.fillRect(0,10,126,63);
    for(let i=0;i<14;i++){const x=8+i*8;ellipse(c,x,42+Math.sin(i)*4,2,2,'#f0d0ae');c.fillStyle=i%3?'#f3f7df':'#2351a0';c.fillRect(x-2,45+Math.sin(i)*4,4,9);c.fillStyle='#c6d7ae';c.fillRect(x-2,48+Math.sin(i)*4,4,2);}
    c.fillStyle='#e5edf2';c.font='bold 6px sans-serif';c.textAlign='center';c.fillText('CELTIC PARK  •  MATCH NIGHT',63,7);c.restore();

    // Roof-mounted white floods with bloom and long shafts through the haze.
    for(const x of [105,245,700,920,1250,1570,1740]){
      const y=roofY(x)+8;
      const beam=c.createLinearGradient(x,y,x+150,520);beam.addColorStop(0,'#e1f4ff36');beam.addColorStop(.45,'#dcefff0e');beam.addColorStop(1,'#e1f4ff00');
      c.fillStyle=beam;c.beginPath();c.moveTo(x-5,y);c.lineTo(x+5,y);c.lineTo(x+280,520);c.lineTo(x+40,520);c.closePath();c.fill();
      const bloom=c.createRadialGradient(x,y,1,x,y,42);bloom.addColorStop(0,'#f3ffffa8');bloom.addColorStop(.2,'#d7f3ff45');bloom.addColorStop(1,'#d7f3ff00');c.fillStyle=bloom;c.fillRect(x-42,y-42,84,84);
      c.shadowColor='#f4ffff';c.shadowBlur=15;ellipse(c,x,y,5,3,'#ffffff');ellipse(c,x+12,y+2,3,2,'#f4fff4');c.shadowBlur=0;
    }
    // Low green spotlights and bright LED advertising at pitch level.
    for(const x of [125,620,1415,1660]){
      const glow=c.createLinearGradient(x,435,x-110,315);glow.addColorStop(0,'#65ff3738');glow.addColorStop(1,'#38ff1400');c.fillStyle=glow;c.beginPath();c.moveTo(x,445);c.lineTo(x-160,310);c.lineTo(x-50,310);c.closePath();c.fill();
      ellipse(c,x,444,5,2,'#6cff3e');
    }
    c.fillStyle='#070e12';c.fillRect(0,462,1800,24);
    const boards=[['PARADISE','#123b85'],['CELTIC FC','#126a39'],['EUROPEAN NIGHTS','#254d98'],['1888','#ecefdf'],['THE BHOYS','#16875d'],['GLASGOW','#234c9b']];
    for(let i=0;i<16;i++){
      const [label,color]=boards[i%boards.length];c.fillStyle=color;c.fillRect(i*116,466,113,16);c.fillStyle=color==='#ecefdf'?'#174e36':'#f0f5e8';c.font='bold 10px sans-serif';c.textAlign='center';c.fillText(label,i*116+56,478);
    }
    // Lit far turf, with the foreground reserved for the playable touchline.
    const turf=c.createLinearGradient(0,485,0,540);turf.addColorStop(0,'#4e741e');turf.addColorStop(.2,'#37571c');turf.addColorStop(1,'#192f19');c.fillStyle=turf;c.fillRect(0,485,1800,155);
    for(let x=0;x<1800;x+=180){c.fillStyle='#d7ee6a06';c.fillRect(x,485,90,155);}
    const haze=c.createLinearGradient(0,280,0,510);haze.addColorStop(0,'#b5cccb00');haze.addColorStop(.65,'#b5cccb06');haze.addColorStop(1,'#b5cccb00');c.fillStyle=haze;c.fillRect(0,280,1800,230);
  });
  canvas(scene,'pitch',512,120,c=>{
    c.fillStyle='#254e22';c.fillRect(0,0,512,120);c.fillStyle='#2d5925';c.fillRect(0,0,256,120);c.fillStyle='#a6c794';c.fillRect(0,0,512,4);c.fillStyle='#164b35';c.fillRect(0,4,512,5);
    for(let i=0;i<700;i++){const x=(i*137.3)%512,y=(i*79.7)%116+7;c.fillStyle=i%2?'#8dba6920':'#143e2938';c.fillRect(x,y,2,3);}
    c.fillStyle='#c5d5a27a';c.fillRect(0,75,512,2);
  });
  canvas(scene,'ball',144,144,c=>{
    // Draw at four times the display resolution so the patterned panels stay
    // crisp while rotating. The silhouette remains the original 32 game pixels.
    c.scale(4,4);c.save();c.beginPath();c.arc(18,18,16,0,Math.PI*2);c.clip();
    const base=c.createRadialGradient(12,9,1,20,21,21);
    base.addColorStop(0,'#ffffff');base.addColorStop(.65,'#f0f4e9');base.addColorStop(1,'#b9c6b5');
    c.fillStyle=base;c.fillRect(0,0,36,36);
    const panels=[
      [[15,7],[21,6],[25,12],[22,18],[14,17],[12,12]],
      [[2,10],[7,5],[12,4],[10,9],[6,13],[2,18]],
      [[23,2],[29,5],[32,10],[28,9],[25,6]],
      [[29,14],[34,11],[35,22],[30,26],[27,21]],
      [[5,23],[11,20],[15,25],[13,31],[7,29]],
      [[20,27],[25,25],[30,29],[27,33],[18,35],[16,32]],
    ];
    for(const points of panels)poly(c,points,'#b9e9a2');
    // Broken green brushwork follows the irregular printed panels.
    let seed=1888;const random=()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646;};
    for(const points of panels){
      c.save();c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.clip();
      for(let i=0;i<95;i++){
        const x=random()*36,y=random()*36;
        c.fillStyle=i%3===0?'#087c42':i%3===1?'#35ab58':'#70c76a';
        c.globalAlpha=.3+random()*.5;
        c.fillRect(x,y,1+random()*2.4,.3+random()*1.1);
      }
      c.restore();
    }
    c.strokeStyle='#cad3c5';c.lineWidth=.22;
    for(const points of [ [[3,15],[10,18],[14,17]], [[10,18],[11,20]], [[22,18],[27,21]], [[22,18],[25,12],[31,11]], [[15,25],[20,27]], [[13,31],[16,32]] ]){
      c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();
    }
    // A small black three-stripe mark on the central lime panel.
    c.save();c.translate(18,19);c.rotate(-.43);c.fillStyle='#10251a';
    c.fillRect(-3.9,-.4,1.8,2.5);c.fillRect(-1.2,-2,1.8,4.1);c.fillRect(1.5,-3.8,1.8,5.9);c.restore();
    c.fillStyle='#426a39';c.font='1.25px sans-serif';c.textAlign='center';c.fillText('LEAGUE BALL',18,24);
    const shine=c.createRadialGradient(11,8,0,11,8,12);shine.addColorStop(0,'#ffffff70');shine.addColorStop(1,'#ffffff00');c.fillStyle=shine;c.fillRect(0,0,36,36);
    c.restore();c.strokeStyle='#c4d0bd';c.lineWidth=.45;c.beginPath();c.arc(18,18,15.8,0,Math.PI*2);c.stroke();
  });
  canvas(scene,'shadow',100,20,c=>ellipse(c,50,10,47,8,'#082f2570'));
  canvas(scene,'platform',150,40,c=>{c.fillStyle='#123f32';c.beginPath();c.roundRect(0,0,150,40,4);c.fill();c.fillStyle='#cce2a5';c.fillRect(0,0,150,5);c.font='bold 12px sans-serif';c.textAlign='center';c.fillText('PARADISE  ✦',75,27);});
  canvas(scene,'platform-holytown',150,40,c=>{c.fillStyle='#231215';c.beginPath();c.roundRect(0,0,150,40,4);c.fill();c.fillStyle='#e83e48';c.fillRect(0,0,150,5);c.font='bold 12px sans-serif';c.textAlign='center';c.fillText('COLTS  ✦',75,27);});
  canvas(scene,'spark',12,12,c=>{poly(c,[[6,0],[7,4],[12,6],[7,7],[6,12],[4,7],[0,6],[4,4]],'#f5e69b');});

  // Holytown Colts community football complex backdrop (Daylight artificial turf)
  canvas(scene,'stadium-holytown',1800,640,c=>{
    // Daylight sky gradient (blue to bright horizon)
    const sky=c.createLinearGradient(0,0,0,320);
    sky.addColorStop(0,'#4a8fc3');sky.addColorStop(.45,'#7eb4dc');sky.addColorStop(.8,'#bedbf0');sky.addColorStop(1,'#e2eef7');
    c.fillStyle=sky;c.fillRect(0,0,1800,640);

    // Fluffy daylight cumulus clouds
    function drawCloud(cx:number,cy:number,scale=1){
      c.fillStyle='#ffffff';
      for(const [ox,oy,r] of [[-35,4,28],[-12,-8,36],[18,-4,32],[42,6,24],[0,12,30]]){
        c.beginPath();c.arc(cx+ox*scale,cy+oy*scale,r*scale,0,Math.PI*2);c.fill();
      }
      c.fillStyle='#dbe7f2';
      c.beginPath();c.arc(cx,cy+14*scale,22*scale,0,Math.PI*2);c.fill();
    }
    for(const [cx,cy,s] of [[120,70,.85],[380,105,1.1],[720,65,.75],[1040,110,1.25],[1420,80,.9],[1710,115,1.05]])drawCloud(cx,cy,s);

    // Distant Scottish hills in soft atmospheric haze
    c.fillStyle='#6c9688';
    c.beginPath();c.moveTo(0,310);
    for(let x=0;x<=1800;x+=20)c.lineTo(x,270+35*Math.sin(x*.003)+15*Math.cos(x*.007));
    c.lineTo(1800,420);c.lineTo(0,420);c.closePath();c.fill();

    c.fillStyle='#527d6b';
    c.beginPath();c.moveTo(0,325);
    for(let x=0;x<=1800;x+=20)c.lineTo(x,295+25*Math.sin(x*.004+1.2)+12*Math.sin(x*.008));
    c.lineTo(1800,430);c.lineTo(0,430);c.closePath();c.fill();

    // Dense lush tree canopy lining the perimeter fence
    let seed=7731;const rnd=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
    for(let x=0;x<1800;x+=22){
      const th=55+rnd()*45,ty=340-th;
      c.fillStyle=rnd()>.5?'#315934':rnd()>.5?'#244627':'#457548';
      c.beginPath();c.arc(x+rnd()*12,ty+25,28+rnd()*16,0,Math.PI*2);c.fill();
      c.fillStyle=rnd()>.5?'#528854':'#3b6d3e';
      c.beginPath();c.arc(x+5,ty+12,20+rnd()*10,0,Math.PI*2);c.fill();
    }

    // Modern dark-clad community football pavilion & dugouts (Ourspace / Holytown)
    c.fillStyle='#161d21';c.fillRect(450,295,900,95);
    // Roofline trim
    c.fillStyle='#2b353b';c.fillRect(440,290,920,8);
    // Dugout bays and white framed viewing panels
    for(let i=0;i<7;i++){
      const bx=480+i*125;
      c.fillStyle='#232c32';c.fillRect(bx,315,95,65);
      c.fillStyle='#ffffff';c.fillRect(bx+5,320,85,4);
      // Dugout blue team seating inside central bays
      if(i>=2&&i<=4){
        c.fillStyle='#12181b';c.fillRect(bx+10,332,75,45);
        for(let s=0;s<4;s++){c.fillStyle='#2557a7';c.fillRect(bx+16+s*18,348,12,18);c.fillStyle='#1c4280';c.fillRect(bx+16+s*18,366,12,8);}
      }
    }
    // Pavilion club fascia sign
    c.save();c.translate(900,307);c.fillStyle='#ffffff';c.font='bold 11px sans-serif';c.textAlign='center';
    c.fillText('HOLYTOWN COMMUNITY FOOTBALL CLUB  •  OURSPACE ARENA',0,0);c.restore();

    // High perimeter chain-link mesh ball-stop fence
    c.strokeStyle='#21323a';c.lineWidth=3;
    for(let x=0;x<=1800;x+=75){c.beginPath();c.moveTo(x,225);c.lineTo(x,455);c.stroke();}
    // Horizontal fence rails
    c.strokeStyle='#21323a';c.lineWidth=2;
    for(const fy of [225,290,360,430]){c.beginPath();c.moveTo(0,fy);c.lineTo(1800,fy);c.stroke();}
    // Fine mesh texture
    c.strokeStyle='#3b525f25';c.lineWidth=1;
    for(let x=0;x<1800;x+=16){c.beginPath();c.moveTo(x,225);c.lineTo(x+30,430);c.stroke();c.beginPath();c.moveTo(x+30,225);c.lineTo(x,430);c.stroke();}

    // Floodlight pylons (tall galvanized steel lattice columns, daytime unlit)
    for(const px of [140,820,1580]){
      c.strokeStyle='#8295a0';c.lineWidth=3.5;
      c.beginPath();c.moveTo(px-10,445);c.lineTo(px-4,105);c.stroke();
      c.beginPath();c.moveTo(px+10,445);c.lineTo(px+4,105);c.stroke();
      // Lattice bracing
      c.lineWidth=1.2;c.strokeStyle='#71838d';
      for(let y=120;y<430;y+=30){c.beginPath();c.moveTo(px-8,y);c.lineTo(px+8,y+15);c.stroke();c.beginPath();c.moveTo(px+8,y);c.lineTo(px-8,y+15);c.stroke();}
      // Top floodlight rack (unlit in daylight)
      c.fillStyle='#2c3840';c.fillRect(px-32,95,64,12);
      for(let i=0;i<5;i++){c.fillStyle='#4c5c66';c.fillRect(px-28+i*12,86,9,10);c.fillStyle='#cedbe2';c.fillRect(px-27+i*12,88,7,7);}
    }

    // Spectator railing at pitch perimeter
    c.fillStyle='#1d282e';c.fillRect(0,440,1800,8);
    for(let x=0;x<1800;x+=50){c.fillStyle='#2a3840';c.fillRect(x,444,4,22);}

    // Sponsor & community banner boards along the touchline
    const holytownBoards=[
      ['HOLYTOWN COLTS FC','#8a161b'],['YETT FARM FC','#14438b'],['COMMUNITY DERBY','#1b2c45'],
      ['RESPECT THE GAME','#1e6338'],['MON THE COLTS!','#8a161b'],['LANARKSHIRE YOUTH LEAGUE','#c98a18'],
      ['BRING HOME THE TROPHY','#14438b'],['OURSPACE ARENA','#232c32']
    ];
    for(let i=0;i<16;i++){
      const [label,color]=holytownBoards[i%holytownBoards.length];
      c.fillStyle=color;c.fillRect(i*116,464,113,18);
      c.fillStyle='#ffffff';c.font='bold 9.5px sans-serif';c.textAlign='center';
      c.fillText(label,i*116+56,477);
    }

    // Daylight artificial grass runoff zone
    const turfRunoff=c.createLinearGradient(0,482,0,545);
    turfRunoff.addColorStop(0,'#3da34e');turfRunoff.addColorStop(.5,'#31873f');turfRunoff.addColorStop(1,'#226630');
    c.fillStyle=turfRunoff;c.fillRect(0,482,1800,158);
    // Subtle rubber crumb speckling on the runoff
    for(let i=0;i<400;i++){c.fillStyle='#101a1460';c.fillRect(rnd()*1800,485+rnd()*150,1.5,1.5);}
  });

  // Artificial Grass Pitch (3G / 4G Astro Turf with Rubber Crumb)
  canvas(scene,'pitch-astro',512,120,c=>{
    // Modern synthetic grass vibrant green with 2-tone cut bands
    c.fillStyle='#2a873b';c.fillRect(0,0,512,120);
    c.fillStyle='#339a45';c.fillRect(0,0,256,120);
    // Bright white painted turf touchline and border
    c.fillStyle='#ffffff';c.fillRect(0,0,512,5);
    c.fillStyle='#1d682c';c.fillRect(0,5,512,4);

    // Synthetic turf vertical blade fibers
    for(let i=0;i<800;i++){
      const x=(i*137.3)%512,y=(i*79.7)%114+6;
      c.fillStyle=i%3===0?'#42b55835':i%3===1?'#1e6a2e40':'#5cd27325';
      c.fillRect(x,y,1.5,3.5);
    }
    // Characteristic 3G SBR black rubber crumb infill granules
    for(let i=0;i<1200;i++){
      const x=(i*179.9)%512,y=(i*67.3)%112+7;
      c.fillStyle=i%2===0?'#101a13':'#18261e';
      c.fillRect(x,y,1.2,1.2);
    }
    // Painted white penalty area touchline marking
    c.fillStyle='#ffffff95';c.fillRect(0,75,512,2.5);
  });
}
