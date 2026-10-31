import * as Phaser from 'phaser';

export function loadCharacters(scene: Phaser.Scene) {
  // Celtic / Rangers
  scene.load.image('boy-run-source','/assets/characters/boy-run.png');
  scene.load.image('boy-action-source','/assets/characters/boy-actions.png');
  scene.load.image('enemy-variants-source','/assets/characters/enemy-variants.png');
  scene.load.image('finale-source','/assets/characters/finale-poses.png');
  scene.load.image('zombie-source','/assets/characters/zombie-actions.png');

  // Holytown Colts / Yett Farm
  scene.load.image('boy-holytown-run-source','/assets/characters/boy-holytown-run.png');
  scene.load.image('boy-holytown-action-source','/assets/characters/boy-holytown-actions.png');
  scene.load.image('enemy-yettfarm-source','/assets/characters/enemy-yettfarm-actions.png');
  scene.load.image('enemy-yettfarm-variants-source','/assets/characters/enemy-yettfarm-variants.png');
  scene.load.image('finale-holytown-source','/assets/characters/finale-holytown-poses.png');
}

type Cutout={image:HTMLCanvasElement;left:number;top:number;width:number;height:number;headX:number};
function cutouts(scene: Phaser.Scene,key:string,columns:number,rows:number):Cutout[]{
  const source=scene.textures.get(key).getSourceImage() as HTMLImageElement;
  return Array.from({length:columns*rows},(_,index)=>{
    const left=Math.round(index%columns*source.width/columns),top=Math.round(Math.floor(index/columns)*source.height/rows);
    const w=Math.round((index%columns+1)*source.width/columns)-left,h=Math.round((Math.floor(index/columns)+1)*source.height/rows)-top;
    const image=document.createElement('canvas');image.width=w;image.height=h;
    const context=image.getContext('2d',{willReadFrequently:true})!;context.drawImage(source,left,top,w,h,0,0,w,h);
    const pixels=context.getImageData(0,0,w,h),data=pixels.data;
    // Keep the character's connected silhouette, discarding stray generated
    // pixels in transparent margins so neighbouring frames cannot bleed in.
    const visited=new Uint8Array(w*h);let largest:number[]=[];
    for(let start=0;start<w*h;start++){
      if(visited[start]||data[start*4+3]<40)continue;
      const component=[start];visited[start]=1;
      for(let i=0;i<component.length;i++){
        const p=component[i],x=p%w;
        for(const next of [x>0?p-1:-1,x<w-1?p+1:-1,p-w,p+w]){
          if(next<0||next>=w*h||visited[next]||data[next*4+3]<40)continue;
          visited[next]=1;component.push(next);
        }
      }
      if(component.length>largest.length)largest=component;
    }
    const keep=new Uint8Array(w*h);let minX=w,minY=h,maxX=0,maxY=0;
    for(const p of largest){keep[p]=1;minX=Math.min(minX,p%w);maxX=Math.max(maxX,p%w);minY=Math.min(minY,Math.floor(p/w));maxY=Math.max(maxY,Math.floor(p/w));}
    let headSum=0,headCount=0;
    for(let p=0;p<w*h;p++){
      if(!keep[p])data[p*4+3]=0;
      else if(Math.floor(p/w)<minY+(maxY-minY)*.3){headSum+=p%w;headCount++;}
    }
    context.putImageData(pixels,0,0);
    return {image,left:minX,top:minY,width:maxX-minX+1,height:maxY-minY+1,headX:headSum/headCount};
  });
}

export function makeCharacters(scene: Phaser.Scene){
  function bakeSet(runKey: string, actionKey: string, enemyKey: string, variantsKey: string, finaleKey: string, prefix = '') {
    const run=cutouts(scene,runKey,4,2),actions=cutouts(scene,actionKey,2,2),enemy=cutouts(scene,enemyKey,4,2);
    function bake(key:string,pose:Cutout,referenceHeight:number,grounded=true){
      const texture=scene.textures.createCanvas(key,96,112)!,c=texture.context;
      const scale=Math.min(102/referenceHeight,88/pose.width);
      const width=pose.width*scale,height=pose.height*scale;
      // Align the head between frames, while keeping boots above the collision
      // baseline. Airborne poses preserve scale with their feet tucked upwards.
      const x=Phaser.Math.Clamp(48-(pose.headX-pose.left)*scale,4,92-width);
      c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
      c.drawImage(pose.image,pose.left,pose.top,pose.width,pose.height,x,grounded?105-height:4,width,height);
      texture.refresh();
    }
    const boyHeight=run[0].height,enemyHeight=enemy[0].height;
    for(let i=0;i<8;i++){
      const passing=i===2||i===6;
      bake(prefix+'boy'+i,passing?actions[0]:run[i],passing?actions[0].height:boyHeight);
    }
    bake(prefix+'boy-jump',actions[2],actions[0].height,false);
    bake(prefix+'boy-kick',actions[3],actions[0].height);
    for(let i=0;i<4;i++)bake(prefix+'zombie'+i,enemy[i],enemyHeight);
    bake(prefix+'zombie-windup',enemy[4],enemyHeight);
    bake(prefix+'zombie-slide',enemy[5],enemyHeight);

    // Render a fallen silhouette within the same logical frame, rather than
    // rotating a live physics sprite or leaving the defeated player standing.
    const fallen=enemy[6],texture=scene.textures.createCanvas(prefix+'zombie-down',96,112)!,c=texture.context;
    const scale=Math.min(88/fallen.height,58/fallen.width),w=fallen.width*scale,h=fallen.height*scale;
    c.imageSmoothingQuality='high';c.translate(48,105-w/2);c.rotate(-Math.PI/2);
    c.drawImage(fallen.image,fallen.left,fallen.top,fallen.width,fallen.height,-w/2,-h/2,w,h);
    texture.refresh();

    const variants=cutouts(scene,variantsKey,6,2);
    for(const [row,kind] of ['brute','tower'].entries()){
      const poses=variants.slice(row*6,row*6+6),height=poses[0].height;
      for(let frame=0;frame<2;frame++){
        bake(`${prefix}${kind}-walk${frame}`,poses[frame],height);
        bake(`${prefix}${kind}-tired${frame}`,poses[frame+2],height);
      }
      bake(`${prefix}${kind}-slide`,poses[4],height);
      bake(`${prefix}${kind}-down`,poses[5],height);
    }

    const finale=cutouts(scene,finaleKey,2,2);
    for(const [index,key] of ['boy-back','boy-back-kick','keeper-ready','keeper-dive'].entries()){
      const pose=finale[index],width=index===3?768:384,height=index===3?384:448;
      const texture=scene.textures.createCanvas(prefix+key,width,height)!,context=texture.context;
      const scale=Math.min((width-16)/pose.width,(height-20)/pose.height),w=pose.width*scale,h=pose.height*scale;
      context.imageSmoothingQuality='high';context.drawImage(pose.image,pose.left,pose.top,pose.width,pose.height,(width-w)/2,height-10-h,w,h);texture.refresh();
    }
  }

  bakeSet('boy-run-source','boy-action-source','zombie-source','enemy-variants-source','finale-source','');
  // Derive the white Madrid strip from the existing shaded character textures.
  // Only fabric hues change; skin, hair, silhouettes and animation frames stay aligned.
  for(const key of scene.textures.getTextureKeys().filter(key=>/^(boy[0-7]|boy-jump|boy-kick|zombie[0-3]|zombie-(windup|slide|down)|(?:brute|tower)-(?:walk|tired)[01]|(?:brute|tower)-(?:slide|down)|boy-back|boy-back-kick|keeper-ready|keeper-dive)$/.test(key))){
    const source=scene.textures.get(key).getSourceImage() as HTMLCanvasElement;
    const texture=scene.textures.createCanvas('madrid-'+key,source.width,source.height)!,c=texture.context;
    c.drawImage(source,0,0);const pixels=c.getImageData(0,0,source.width,source.height),d=pixels.data;
    for(let i=0;i<d.length;i+=4){
      if(d[i+3]<10)continue;const r=d[i],g=d[i+1],b=d[i+2];
      const fabric=(g>r*1.12&&g>b*1.05)||(b>r*1.15&&b>g*1.05);
      const y=Math.floor(i/4/source.width)/source.height;
      const socks=!key.includes('back')&&!key.includes('keeper')&&y>.62&&y<.9&&((r>g*1.8&&g<80&&b<90)||(r<70&&g<70&&b<70));
      if(fabric||socks){const light=190+Math.round((r*.21+g*.72+b*.07)*.24);d[i]=light;d[i+1]=light;d[i+2]=Math.min(255,light+5);}
    }
    c.putImageData(pixels,0,0);texture.refresh();
  }
  bakeSet('boy-holytown-run-source','boy-holytown-action-source','enemy-yettfarm-source','enemy-yettfarm-variants-source','finale-holytown-source','holytown-');
}
