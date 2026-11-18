# Localization and audio

## Localization

`src/i18n.js` owns all game copy in Russian, English and Hebrew, including engine events, interaction names, result variants, errors, controls and the final commission choices. `t(locale,key,params)` uses `Intl.NumberFormat` for numeric parameters. Hebrew parameters use Unicode first-strong isolates; layout is RTL while the world and physical left/right controls stay unchanged. Control instructions refer to physical E (interaction) and Q (possess/return) keys.

`validateTranslations()` rejects missing keys, empty values and mismatched interpolation names. Unknown runtime keys show a conspicuous bracketed key rather than pretending that localization is complete. The dictionary tests cover 0, 1, 2, 3, 5, 11, 21 and 101, mixed scripts, times, parameter isolation and engine key coverage. Copy expresses the rescue counter as a label with a number, so no incorrect singular/plural noun concatenation is needed.

`pseudo(text)` expands grapheme-aware strings by 45% for layout QA. It does not alter real production translations. Viewport and browser layout results belong in the main verification report; a dictionary test alone does not verify RTL geometry or clipping.

Hebrew is authored text and has not received independent native-speaker review. No claim of accessibility certification is made. Controls and game state remain visual: the game does not provide an audio-only navigation mode.

## Audio

`src/audio.js` synthesizes an original low-volume score and Foley with Web Audio. It contains no third-party recordings or external audio requests. The scene palette combines filtered wind/surf noise, a soft harmonic drone, sparse pitched notes, a ceramic possession click, two footstep weights, machinery, sail-fin noise and a closing chord. Guard alert changes the upper harmonic tension. Four rooms subtly change ambient and melodic behavior.

AudioContext is created only after an explicit UI call to `unlock()`, intended for a user gesture. Missing/denied Web Audio returns `false`; all remaining methods remain safe and silent. Music and effects have independent gains plus master mute. Application preferences persist those levels. Pausing suspends the audio context; destroying stops sources and closes it. Transient sources disconnect after their envelopes finish. There is no voice acting, so no voice-language mismatch or voice download dependency.

Important events also carry engine event keys for visible localized notifications. Hearing is not required for the basic possession, detection and gate signals. Subjective balancing should still be reviewed on real headphones and phone speakers; cloud browser playback does not establish listening comfort across hardware.

## Final cinematic and validation

The eight-second ending has localized bell, quiet, one-response and two-response captions. `bodyLocation` formats the current distance with parameter `distance`; blocked sightline and staged tutorial prompts use the same complete dictionary checks. Russian wording and Hebrew control labels were edited for clarity, including physical key hints. This editorial pass is not independent native-speaker validation.

`audio.event(type, details)` accepts the full engine event. For `won`, `details.count` (0, 1 or 2) chooses the response. A bronze bell opens the scene at 0 seconds; Nim taps the hull at 2.15 seconds. A bright reed-like creature call replies at 3.0 seconds if at least one was rescued. The second creature has a lower, breathier, differently timed call at 4.45 seconds. No creature calls occur with zero rescues. A coastal chord replaces the station tension at 5.8 seconds. The calls are original synthesized animal sounds, with no language-dependent spoken words. Starting a replay cancels the old cinematic sources. Pausing suspends the audio clock, including scheduled replies.

`renderAudioPreview()` uses the production graph with `OfflineAudioContext`. `tests/browser-audio.spec.js` verifies non-silent finite signals, no clipped samples, distinct response windows, independent music/effects channels, full mute and overlapping loud cues. It writes an 11-second PCM WAV for audition and measured JSON into `test-results/audio/`. `docs/AUDIO_VALIDATION.json` retains the measured result from Chromium 156 on 18 November 2026: ending peak 0.117, RMS 0.014–0.019; stressed simultaneous cues peak 0.198; mute and zeroed buses exact silence. The test exposed and fixed a short initial-gain leak when both volume sliders were zero. These measurements verify headroom and routing; they do not replace listening on speakers or headphones.

## V2 manual traversal and distraction update

This section describes V2 and does not replace the historical V1 measurements above. Controls now include Space to jump, C to toggle crouching, W/S or up/down arrows to use ladders, and F to pick up or throw a nearby metal object. Q remains possession/return; Space is no longer an alternative possession key. Only Nim jumps, crouches or throws; workers can climb ladders. All three language dictionaries now describe the actual room levels, glass bypass, upper bridges, rescue locations and final shuttle jump. They also cover inventory, elevation, obstruction messages, search states, falling and migration of an earlier save. The Hebrew text remains unreviewed by an independent native speaker.

V2 adds quiet jump/landing, ladder, pickup, throw, impact and investigation cues. `event(type, details)` reads normalized `strength` for landings and object impacts. Repeated cues are rate-limited. Actual vertical movement produces ladder rung sounds; standing still on a ladder does not. Crouched footsteps are softer and slower, and footsteps are suppressed while airborne or climbing. Investigation completion and mechanism completion use short resolving sounds instead of repeating the initial alert or motor.

`tests/i18n.test.js` verifies V2 controls, distinct pickup/throw and crouch/stand labels, numeric elevation with Hebrew bidi isolation, and literal engine notification/interaction coverage. `tests/browser-audio.spec.js` now includes a V2 source-graph check: all eight cue types add finite, nonzero signals over the same ambient baseline; impact strength changes the signal; moving on a ladder produces rungs while staying still does not. The test routes the actual audio module directly and needs no running game server. `docs/AUDIO_VALIDATION_V2.json` preserves the current V2 measurements. These are signal measurements, not a claim of a listening review on physical speakers or headphones.
