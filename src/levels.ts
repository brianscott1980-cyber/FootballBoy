export type LevelId = 'celtic' | 'holytown' | 'madrid';

export interface LevelConfig {
  id: LevelId;
  name: string;
  tag: string;
  badge: string;
  teamName: string;
  opponentName: string;
  kitName: string;
  eyebrow: string;
  title: string;
  description: string;
  hint: string;
  location: string;
  matchLabel: string;
  startToast: string;
  backdropTexture: string;
  pitchTexture: string;
  platformTexture: string;
  prefix: string;
  introBanner: string;
  benchLabels: string[];
  wonHeader: string;
  wonTitle: string;
  wonText: (hearts: number, score: number) => string;
  lostHeader: string;
  lostTitle: string;
  lostText: string;
  penaltyHeroWon: string;
  penaltyHeroLost: string;
  penaltySummaryWon: string;
  penaltySummaryLost: string;
}

export const LEVELS: Record<LevelId, LevelConfig> = {
  celtic: {
    id: 'celtic',
    name: 'CELTIC PARK',
    tag: 'LEVEL 01 · CELTIC PARK',
    badge: 'PARADISE, GLASGOW',
    teamName: 'Celtic FC',
    opponentName: 'Rangers',
    kitName: 'Green & White Hoops',
    eyebrow: 'A LITTLE BHOY. A BIG NIGHT.',
    title: 'A night at<br/><em>Paradise.</em>',
    description: 'One football. A stadium full of believers.<br/>Charge four knockouts for a special.<br/>Survive the run. Beat the keeper.',
    hint: 'SPACE: JUMP / X: SHOOT / C: SPECIAL / V: WHISTLE',
    location: 'PARADISE, GLASGOW',
    matchLabel: 'MATCH NIGHT / CELTIC PARK',
    startToast: 'WELCOME TO PARADISE',
    backdropTexture: 'stadium',
    pitchTexture: 'pitch',
    platformTexture: 'platform',
    prefix: '',
    introBanner: 'YOUR NIGHT.\nYOUR STADIUM.',
    benchLabels: ['THE NORTH STAND', 'ONE LAST PUSH', 'MAKE PARADISE ROAR'],
    wonHeader: 'FULL TIME. ALL HEART.',
    wonTitle: 'Paradise.<br/><em>Conquered.</em>',
    wonText: (hearts, score) => `You made it through Celtic Park with ${hearts} ${hearts === 1 ? 'heart' : 'hearts'} left.<br/>${score} Rangers players sent for a lie-down.`,
    lostHeader: 'DOWN, BUT NEVER OUT.',
    lostTitle: 'Another run?<br/><em>Always.</em>',
    lostText: 'Those tackles caught you out.<br/>Jump the slides, or let your football do the talking.',
    penaltyHeroWon: 'PARADISE HAS A NEW HERO.',
    penaltyHeroLost: 'THE KEEPER HAD YOUR NUMBER.',
    penaltySummaryWon: 'The whole stadium is on its feet.',
    penaltySummaryLost: 'Retry the final challenge. Your run is saved.',
  },
  madrid: {
    id:'madrid',name:'MADRID VS PSG',tag:'LEVEL 03 / MADRID',badge:'MADRID, SPAIN',
    teamName:'Real Madrid',opponentName:'PSG',kitName:'Both teams in Madrid white',
    eyebrow:'MADRID VS PSG / ALL IN WHITE',title:'Magic in<br/><em>Madrid.</em>',
    description:'Madrid vs PSG. Both sides in Madrid white.<br/>Four knockouts charge the overhead flick.<br/>Drop an explosive finish onto the closest opponent!',
    hint:'SPACE: JUMP / X: SHOOT / C: SPECIAL / V: WHISTLE',location:'MADRID, SPAIN',
    matchLabel:'EUROPEAN NIGHT / MADRID VS PSG',startToast:'HALA MADRID!',
    backdropTexture:'stadium-madrid',pitchTexture:'pitch',platformTexture:'platform',prefix:'madrid-',
    introBanner:'ALL WHITE.\nALL MAGIC.',benchLabels:['HALA MADRID','EUROPEAN NIGHTS','ONE OVERHEAD FINISH'],
    wonHeader:'FULL TIME. MADRID MAGIC.',wonTitle:'Madrid.<br/><em>Magnificent.</em>',
    wonText:(hearts,score)=>hearts+' hearts left. '+score+' PSG defenders beaten.',
    lostHeader:'KEEP BELIEVING.',lostTitle:'Another night?<br/><em>Hala Madrid.</em>',lostText:'PSG held the line. Charge your flick and try again.',
    penaltyHeroWon:'MADRID HAS A NEW HERO.',penaltyHeroLost:'PSG DENIES THE FINISH.',
    penaltySummaryWon:'The Madrid crowd celebrates a European night to remember.',penaltySummaryLost:'Your run is saved. Retry the final shots.',
  },
  holytown: {
    id: 'holytown',
    name: 'HOLYTOWN COLTS',
    tag: 'LEVEL 02 · COMMUNITY TURF',
    badge: 'HOLYTOWN, LANARKSHIRE',
    teamName: 'Holytown Colts',
    opponentName: 'Yett Farm',
    kitName: 'Red & Black Stripes vs Blue & Yellow',
    eyebrow: 'HOLYTOWN COLTS VS YETT FARM',
    title: 'The Colts at<br/><em>Holytown.</em>',
    description: 'Artificial turf under the open daylight.<br/>Face Yett Farm in the community derby.<br/>Charge four knockouts and take the trophy!',
    hint: 'SPACE: JUMP / X: SHOOT / C: SPECIAL / V: WHISTLE',
    location: 'HOLYTOWN, LANARKSHIRE',
    matchLabel: 'DAYLIGHT DERBY / HOLYTOWN COLTS VS YETT FARM',
    startToast: 'MON THE COLTS!',
    backdropTexture: 'stadium-holytown',
    pitchTexture: 'pitch-astro',
    platformTexture: 'platform-holytown',
    prefix: 'holytown-',
    introBanner: 'OUR COMMUNITY.\nOUR CLUB.',
    benchLabels: ['COMMUNITY DERBY', 'HOLYTOWN COLTS', 'BRING HOME THE TROPHY'],
    wonHeader: 'FULL TIME. CHAMPIONS!',
    wonTitle: 'Holytown.<br/><em>Champions.</em>',
    wonText: (hearts, score) => `You brought home the trophy with ${hearts} ${hearts === 1 ? 'heart' : 'hearts'} left.<br/>${score} Yett Farm players sent for a lie-down.`,
    lostHeader: 'HEAD UP, COLTS.',
    lostTitle: 'Another run?<br/><em>Mon the Colts!</em>',
    lostText: 'Yett Farm held the line this time.<br/>Leap their tackles and take another crack at the title.',
    penaltyHeroWon: 'THE COLTS LIFT THE CUP!',
    penaltyHeroLost: 'THE YETT FARM KEEPER DENIES YOU.',
    penaltySummaryWon: 'The Colts sideline erupts into celebration!',
    penaltySummaryLost: 'Line up the spot kick again and win the silverware.',
  },
};

export const DEFAULT_LEVEL: LevelId = 'celtic';
