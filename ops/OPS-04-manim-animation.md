# OPS-04: Produce a Manim animation for a concept

Pre-rendered "3Blue1Brown-style" videos for step-by-step derivations/transformations that benefit from choreographed motion (vs. user-driven interaction → OPS-03).

## Prereqs (one-time, machine-level)
Manim CE + ffmpeg installed: `pip install manim` (verify `manim --version`). If missing, stop and report — the orchestrator handles installs.

## Steps
1. Scene source: `manim/<concept-id>.py`, one Scene class per animation, named descriptively (e.g., `PositionVelocityAccelerationCascade`).
2. Style: dark background (Manim default), English labels, consistent color coding across the catalog (position=BLUE, velocity=GREEN, acceleration=RED for kinematics; note new conventions in the file header).
3. Length: 20–90 seconds per scene. Narration is text-on-screen (Japanese OK inside videos via a CJK-capable font, else English) — no audio.
4. Render: `manim -qm manim/<concept-id>.py <SceneClass> -o <concept-id>-<scene>.mp4` (720p30 medium quality is the catalog standard; -qh only if fine detail demands it).
5. Copy output to `public/video/<concept-id>-<scene>.mp4` and commit the video (it's a build artifact by design — renders are slow).
6. Embed in MDX:
   ```html
   <video controls muted playsinline preload="metadata"
          src={`${import.meta.env.BASE_URL}video/<concept-id>-<scene>.mp4`} />
   ```
7. Keep videos under ~15 MB; if larger, reduce length or quality.

## Verify
Video plays in `npm run preview`; file size checked; scene source committed alongside.
