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

## Synology deployment

FootballBoy runs as the `footballboy` Docker container on the Synology NAS, independently of TeslaDash. It starts automatically after a NAS restart.

- Home network: **http://192.168.0.101:3010/**
- External: **http://mymedia.ddns.net:3010/**
- Router: TCP **3010 → 192.168.0.101:3010**.
- Health endpoint: `/healthz`.

The workstation builds the game with `npm ci` and `npm run build`. The Dockerfile packages only `dist/` and the static nginx configuration; Node is not needed in the running container. Build before using `docker compose up --build -d` for a fresh installation. The server runs as the nginx user with a read-only filesystem and temporary storage in `/tmp`. No TeslaDash credentials or vehicle data are included.

The initial NAS release is `footballboy:20261025-f96017e`, built from commit `f96017e`. Its build files and production assets are retained under `/volume1/docker/footballboy/releases/20261025-f96017e/source/`. Manage the running `footballboy` container in Synology's Docker package. Deployment files are also saved under `/volume1/docker/footballboy/`.

The existing Synology **UPnP Mapper** task (ID 5, scheduled at midnight) calls `/volume1/docker/tesladash/scripts/refresh-upnp.sh`. Its normal refresh now includes `map_port 3010 3010 FootballBoy` alongside TeslaDash port 3000. The router grants a seven-day lease, renewed by that task. Existing media mappings and TeslaDash's ports remain intact.

The public address may not work from inside the home network if the router does not support NAT loopback. Use the home-network address in that case. This deployment serves the game over HTTP on port 3010.

## The run

The boy runs and the camera scrolls automatically. The level is 14,550 world pixels (roughly 50 seconds), with 34 Rangers opponents and optional one-way platforms.

- Space or the touch JUMP button: jump; release early for a shorter jump.
- Right Option or X, or the touch SHOOT button: kick forwards. The ball returns.
- Land on an opponent's head to hit it and bounce; side tackles cost a heart. Agile Midfielders take one hit. Larger Bruisers and tall Long Legs take two hits, change to hunched, breathless artwork after the first, and briefly stagger. Their two markers show hits remaining. A piercing special counts once per enemy, so bigger opponents still require a second attack.
- Only a completed knockout awards score and adds 25% special power. At 100%, press C or SPECIAL to use the level move; normal shots preserve the charge.
- Celtic Park: **Toby the dog** runs ahead. Holytown: **fire slide** protects the player during a fiery sliding tackle. V uses a charged whistle blast, with a whistle and waving red card.
- Five hearts per run. Two crowd checkpoints restore one missing heart. Brief damage protection prevents repeated hits from one tackle.
- P or Escape pauses. The game fills the window by default and requests native fullscreen on Play. Exit is available in the toolbar. Translucent joypad controls appear on every device: jump left, shoot and special right.

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

## Level 03: Madrid vs PSG
Both sides wear Madrid white in a floodlit Madrid stadium. Four knockouts charge OVERHEAD FLICK (C or SPECIAL). The ball rises from behind the player, tracks the nearest standing enemy, and explodes on impact for an immediate knockout, including two-hit defenders. The explosion is visual; only the targeted enemy is defeated. The penalty finale also uses the Madrid kit.
