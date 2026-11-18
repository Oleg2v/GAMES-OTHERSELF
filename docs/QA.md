# Episode 1.0 validation — 18 November 2026

The four-hall episode was exercised in Chromium 156.0.8078.79 on Debian Linux, using Playwright 1.56.1 and SwiftShader software WebGL. This report separates genuine input-driven playthroughs, isolated UI/save fixtures, and hardware or human checks that are still outstanding.

## Results

The frozen dependency installation, **32 Node tests** and production build passed. The Node suite covers possession geometry and obstacles, terrain, patrol/detection/recovery, mechanisms and backtracking, serialization, complete routes and all three endings, plus dictionary completeness, parameters, numbers and bidirectional interpolation.

**All 45 distinct browser cases passed.** The main batches were 36 short cases (4.0 minutes), four complete routes (6.1 minutes), and five final pseudolocalization/production checks (41.4 seconds). Browser results were collected across targeted runs, not one monolithic invocation:

| Group | Cases | Evidence |
| --- | ---: | --- |
| Core interface and lifecycle | 17 | Actual keyboard movement, possession/return, language changes without losing control or body position, pause/settings/resume, exit/reload/continue; 15 language/viewport layouts; CDP touch input in Hebrew |
| Genuine complete routes | 4 | RU, EN and HE keeper-door routes; a separate technician route with both bridges, the garden cart, closed-gate traversal in both directions, returning from the dock through the garden for the previously skipped sorting rescue, then boarding |
| UI and save acceptance | 14 | All 0/1/2-rescue results in all three languages; cinematic skip and natural completion with pause/language switching; exact saved-data retention; a running mechanism after return; glass blockage and the real opening; endangered-body return/escape; body discovery and checkpoint retry |
| Error recovery | 4 | Required model failure/retry, unavailable storage/audio, resize and non-bubbling WebGL context loss, unavailable WebGL |
| Audio graph | 1 | Distinct 0/1/2-rescue replies at the intended times, independent music/effects buses, mute, finite samples and no clipping under the stressed mix |
| Pseudolocalization | 4 | RU and HE text expanded with the supplied 45% helper at 360×640 and 844×390; objective, instructions, close button and important 44px touch targets |
| Production subpath | 1 | Built application under `/GAMES-OTHERSELF/`: scripts, styles, fonts and required GLBs stay under the base path; start/possession/save/reload/continue work; no development hook, failed requests, external HTTP requests or page exceptions |

The 15 regular layout cases cover **360×640, 390×844, 844×390, 768×1024 and 1440×900**, each in RU, EN and HE at DPR 1. Instructions, game controls and pause/resume were exercised. Hebrew reading direction changes independently from the physical placement of movement controls on the left and action controls on the right. The touch case sends actual emulated touch-start/touch-end events, not mouse clicks.

The four complete routes use actual keyboard input. Their drivers read the development state only to wait and assert; they do not teleport, change game rules or edit the simulation. All four halls, both worker roles, optional rescues and the bell are reached through gameplay. The technician case leaves passenger gates closed and explicitly proves traversal and return via the alternatives. The four-route batch passed in 6.1 minutes of wall time with two workers. The RU/EN/HE keeper routes reached the bell at 129.3/128.9/129.6 simulation seconds respectively; individual wall times were approximately 3.1/2.9/2.9 minutes. The longer technician/backtracking route took 3.2 minutes of wall time. These practiced routes do not establish a 10–15-minute first-time human play duration.

Ending-count and endangered-body fixtures load valid serialized saves to isolate branch presentation and persistence; they are not additional complete playthroughs. Pseudolocalization changes only dictionaries in isolated test pages before normal UI rendering. Engine tests independently exercise the zero-, one- and two-rescue outcomes.

## Rendering and audio observations

Full routes used Low quality at **640×360 CSS pixels, emulated DPR 0.5 (320×180 raster)** to make software rendering practical. The normal layout evidence uses full-resolution viewports; reduced-raster route screenshots are functional evidence, not the main art presentation. No simulation timestep or rules were accelerated.

A separate active-garden sample at **1440×900 CSS pixels**, Low quality, approximately **0.621 renderer pixel ratio / 500,000 pixels**, measured 45 animation frames with **94.99ms mean frame time (about 10.5 FPS)**; the observed range was 3.3–208.4ms. This was Linux SwiftShader software rendering, outside the concurrent acceptance run. It does not establish the desktop 60 FPS or mobile 30 FPS targets; those remain unverified on representative hardware.

Offline Web Audio checks rendered the production synthesis graph, including separate creature replies and stressed concurrent effects. They establish signal properties and branch timing, not a subjective listening review of the mix.

## Fixes verified during development

- Menu reload no longer overwrites the saved simulation. Locale changes preserve keyboard focus, bodies, the carrier and running mechanisms.
- Terminal screens remain terminal on Escape. Long result dialogs initially focus their container at scroll position zero, with headings visible; toasts do not cover modal or ending content.
- Compact landscape sizing, Hebrew control placement and brightness, important 44px touch targets, renderer resize and context-loss recovery have dedicated checks.
- True glass/ray obstruction and body danger receive feedback; returning immediately can escape discovery, while ignoring the warning produces the specific cause and restores the safe checkpoint.
- Complete technician routes remain usable after leaving the host and when backtracking through visited halls.
- The first 45%-expanded RU/HE help tests exposed horizontal overflow at 360px. Help now uses a single column on narrow screens, flexible grid tracks and wrapped text. All four pseudo cases passed after the fix; important controls remain at least 44×44 CSS pixels.
- A direct language query now tracks manual language selection, so reloading the standalone page preserves the new choice.

The input drivers wait inside cover and possess at a safe margin within the unchanged 6m range. Earlier failures from overshooting cover or attempting a transition at the exact range boundary were automation errors; no game rule was weakened to make a test pass.

## Deployment and remaining validation

The production bundle passed the local static staging check at `http://127.0.0.1:4183/GAMES-OTHERSELF/`, including a direct `?lang=en` visit, manual Hebrew selection, URL update and reload retaining Hebrew. See [DEPLOYMENT.md](DEPLOYMENT.md) for the current publication status. A successful local subpath check is not evidence that the public GitHub Pages URL is already available.

Physical phones, Safari and Firefox remain untested. Representative desktop/mobile performance, first-time-player pacing and balance, native-Hebrew review and subjective audio review still require their respective devices or people. Keyboard focus, RTL, reduced motion and control sizing were checked; this visual stealth game has no nonvisual world-navigation mode or screen-reader/accessibility certification. Authored assets and the finished episode flow do not establish exact visual parity with the supplied reference.

## Reproduction

`npm test` runs the Node suite. With the development server running, `BASE_URL=http://127.0.0.1:5173 npx playwright test --grep-invert 'production subpath deployment'` runs the 44 development-browser cases. `DEPLOY_URL=http://127.0.0.1:4183/GAMES-OTHERSELF/ npx playwright test tests/browser-deployment.spec.js` runs the independent production check against a separately served build. Adjust the URL and Chromium executable for another environment; the production case is explicitly skipped without `DEPLOY_URL`.

Screenshots are written to `/tmp/otherself-qa/`; the final audio WAV and metrics were retained under `/tmp/otherself-qa/audio/`. Failed runs retain traces in `test-results/`; later Playwright invocations may replace that directory. The default test configuration uses one worker; the cloud run used two workers for independent batches within its four-CPU quota.
