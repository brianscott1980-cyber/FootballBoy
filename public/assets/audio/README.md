# Football Boy stadium audio

- `paradise-anthem.mp3`: original 38.4-second looping minor-key stadium fanfare, with synthesized strings, brass, bass, timpani, cymbals, and wordless choir. Its melody is composed in `scripts/generate-audio.py`; no club anthem or broadcast recording is sampled.
- `liam-chant.mp3`: supporters chanting “Liam! Liam! Liam!”, built by layering and timing four system speech voices with pitch/timing variation, stomps, stereo width and stadium reverberation.
- `crowd-cheer.mp3`: layered supporter cheers and applause for knockouts, special moves and goals.
- `crowd-bed.mp3`: quiet, diffuse crowd ambience underneath the music.

All files are bundled locally. Sound begins after pressing Play, can be muted using the sound button, and suspends with the game. Chant and cheer levels are compressed and the music ducks underneath important crowd reactions. Rapid multi-opponent specials share a roar rather than stacking many full-volume clips.

Regenerate on macOS with `python3 scripts/generate-audio.py` (requires numpy, scipy, ffmpeg, and the listed installed system speech voices). Temporary WAV and speech-source files are kept in `.audio-generation/`, which is excluded from Git.
