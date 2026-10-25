# Football Boy

An arcade runner and penalty shootout featuring interactive level setup, authentic team kits, and cohesive 3D animated CGI feature-film cartoon visuals. Generated character sprites, custom pitch textures, and procedural stadium environments load locally.

## Match Setup & Levels

Before kicking off, players can choose their match from the game setup stage on the title screen:

1. **Level 01: Celtic Park (Glasgow · Under the Lights)**
   - **The Boy**: Celtic green-and-white horizontal hoops, white shorts, white socks with green hoops, orange boots, #7 on back.
   - **Opposition**: Rangers in royal-blue shirts, white shorts, black socks with red trim. Midfielders, Bruisers, and Long Legs.
   - **Setting**: Floodlit night at Celtic Park (Paradise), Glasgow.

2. **Level 02: Holytown Colts (Lanarkshire · Open Daylight)**
   - **The Boy**: Holytown Colts FC kit in red-and-black vertical stripes with gold chest crest, black shorts, black socks, and boots, #7 on back.
   - **Opposition**: Yett Farm in royal-blue shirts with bright yellow sleeves and trim.
   - **Setting**: 3G/4G artificial grass pitch with two-tone green turf bands, black rubber crumb granule infill, open daylight blue sky, Scottish hills, lush trees, and the Holytown Community Football Club pavilion and dugouts.

## Run

```sh
npm install
npm run dev
```

Open the address printed by Vite. `npm run build` type-checks and builds to `dist/`; `npm run preview` serves the build.

## The run

The boy runs and the camera scrolls automatically. The level is 14,550 world pixels (roughly 50 seconds), with 34 Rangers opponents and optional one-way platforms.

- Space or the touch JUMP button: jump; release early for a shorter jump.
- Right Option or X, or the touch SHOOT button: kick forwards. The ball returns.
- Land on an opponent's head to hit it and bounce; side tackles cost a heart. Agile Midfielders take one hit. Larger Bruisers and tall Long Legs take two hits, change to hunched, breathless artwork after the first, and briefly stagger. Their two markers show hits remaining. A piercing special counts once per enemy, so bigger opponents still require a second attack.
- Only a completed knockout awards score and adds 25% special power. At 100%, the next kick automatically uses the named special, then the selection advances.
- Specials cycle through **rainbow flick** (lob with landing burst), **bicycle kick** (spinning overhead strike), **fireball** (fast piercing shot), and **whistle blast** (a wave that knocks down opponents ahead).
- Five hearts per run. Two crowd checkpoints restore one missing heart. Brief damage protection prevents repeated hits from one tackle.
- P or Escape pauses. Fullscreen is available in the game toolbar.

## The last kick

Reaching the end changes the view to behind the boy. Score **two goals from three shots** to win.

1. Choose one of nine goal squares by clicking/tapping, using arrow keys, or pressing 1–9 in reading order.
2. Read the keeper's lean and amber squares. He commits to two adjacent squares when charging starts.
3. Hold right Option or X, or the on-screen HOLD TO SHOOT button. The power marker travels up and down over a 1.8-second cycle.
4. Release to shoot. Under 12% rolls short; 12–34% drops to the bottom row in your chosen column; 35–64% drops one row; 65–92% hits the selected square; above 92% goes over the bar. The keeper saves a shot landing in either of his two squares.

The keeper dives and the ball flies to the resolved target. Early wins/losses end the challenge once the result is decided. If you lose the finale, **Retry the final shots** keeps your completed run. The toolbar's Restart always starts the entire level again. Pausing cancels a held shot safely.

## Checks

```sh
npx playwright install chromium
npm test
```

The configured browser is the installed Google Chrome. Browser checks cover automatic running, shots, head stomps, side damage, all four charged specials over a full extended run, the finale transition, charge/release, pause, checkpoint retries, and desktop/mobile goal UI. Rule checks cover the oscillating meter, power-dependent targets, exact two-square saves, and best-of-three outcomes.

This is an unofficial fan-game prototype; no official club artwork or player likeness files are included.

## Stadium soundtrack

Sound is on by default after clicking Play. The sound button mutes music, crowd and effects together and remembers the preference. Pausing, changing tabs or losing focus suspends audio; resuming continues it without creating duplicate loops.

The game includes an original string/brass/wordless-choir match-night fanfare, a layered **“Liam! Liam! Liam!”** supporter chant, continuous low crowd ambience, and cheers for knockouts, special tricks and goals. Reactions briefly lower the music so the crowd remains clear. Assets and generation notes are in `public/assets/audio/`; the original score and crowd-building script is `scripts/generate-audio.py`.
