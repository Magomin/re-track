# Re-track

Learn Ableton Live by rebuilding real songs. Re-track reverse-engineers a track with AI, recreates it in your own Ableton set, and turns the process into an interactive, verified lesson — checked against the real state of your Live project, not screenshots.

Status: early development. Built as a learning project — the code is written by a student with an AI teacher reviewing every line.

## How it works (target architecture)

1. **Lesson player** — a floating panel next to Ableton Live that walks you through rebuilding a song step by step.
2. **Verification** — each step is checked against the live state of your Ableton set (clips, notes, devices, mixer) through a Remote Script socket. No pixel-reading.
3. **Remake runner** (later) — an AI pipeline that takes any song and produces the lesson data automatically: stems, measurements, sound-matching, step generation.
