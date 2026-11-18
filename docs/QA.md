# Validation — 18 November 2026

## Version 2.2: control usability

Controls now use distinct SVG icons, contextual action names and visible ready/active/locked states. Mobile action targets are at least 56px, possession and the contextual action are 64px, and jump is 76px. Labels are 10–11px. Layout stays physically consistent across languages; touch hints omit keyboard badges. Unavailable actions explain their reason, and Space/Enter activate a focused button normally. Mouse/touch action use restores game focus. Engine rules, save format and joystick physics are unchanged.

**36 Node tests passed**, and the GitHub Pages subpath build passed in **2.92 seconds**. **33 targeted browser cases passed**: the 12-case focused batch took 1.6 minutes, the 20-case layout/lifecycle batch took 4.3 minutes, and the production check took 20.2 seconds (21.5 including the runner).

| Group | Cases | Evidence |
| --- | ---: | --- |
| New control UX | 4 | Valid saved-position fixtures test ladder guidance and actual door/rescue/exit actions; unavailable actions through both keyboard and touch explain the reason without changing the world; native focused-button Space/Enter and mouse focus work; six RU/EN/HE × 320px portrait/844px landscape combinations pass target sizing, separation, hit testing, bounds and fixed-position checks. No page/console errors. These fixtures are not additional complete playthroughs. |
| Existing input regressions | 8 | Five joystick cases, both single/multiple-contact touch cases and the held-key/room/pause/mouse-retry regression passed again. |
| Layout and lifecycle | 20 | All 15 RU/EN/HE viewport layouts, four expanded-text RU/HE cases and the desktop movement/possession/language/save lifecycle passed. |
| Production subpath | 1 | The final built bundle under `/GAMES-OTHERSELF/` passed real joystick movement, jumping, inventory, crawling, save/reload and Hebrew switching without a development hook, failed assets, external requests or page exceptions. Local staging used port 4185 and `/tmp/otherself-v22-release/`. |

Actual screenshots at five viewport sizes in RU/EN/HE were also inspected. The final 64px possession button was recaptured at 320/390px after correcting an orphaned final letter in the Russian label. [Mobile](screenshot-controls.png) and [desktop](screenshot-game.png) captures show the current integrated UI after the initial checkpoint toast expires. These are Chromium/software-WebGL checks, not physical-phone performance measurements.

The suite now registers **64 browser cases** in total. Complete route and ending coverage from version 2.0 below is historical evidence and was not rerun for this UI update. Run the four new cases with `BASE_URL=http://127.0.0.1:5174 npx playwright test tests/browser-controls-ux.spec.js`; the existing layout and production commands below also apply.

## Version 2.1: virtual joystick

The control update adds a left thumbstick with proportional speed, an 18% deadzone and dominant-axis hysteresis for ladders, plus round action buttons on the right. It preserves simultaneous movement/action touches and held input across room and language rendering. Pause, cancellation, resize and lost focus clear input. Level rules, art assets and the version 2 save format are unchanged.

**36 Node tests passed**, and the GitHub Pages subpath build passed in **3.45 seconds**. **29 targeted browser cases passed** for this update:

| Group | Cases | Evidence |
| --- | ---: | --- |
| Input | 8 | Five new joystick cases cover deadzone, proportional speed, travel clamp, keyboard override, single-pointer ownership, cancellation, ladder direction/hysteresis, pause/resize reset and room/language continuity. Two adapted touch cases include real two-contact movement and jumping, crawling and item actions. The held-key/room/pause/mouse-retry regression also passed. The batch took 1.1 minutes. |
| Layout and lifecycle | 20 | All 15 RU/EN/HE viewport layouts, four expanded-text RU/HE cases and the desktop movement/possession/language/save lifecycle passed in 4.3 minutes. |
| Production subpath | 1 | The built site under `/GAMES-OTHERSELF/` passed in 18.7 seconds (20.3 including the runner): a real joystick drag advanced the character and reached normal autosave; jumping, inventory, crawling, reload/continuation and Hebrew switching also passed. No development hook, failed assets, external requests or page exceptions. |

Actual game captures at 320/360/390px portrait and 844×390 landscape were also inspected for controls, labels and scene clearance. [The mobile capture](screenshot-controls.png) and [desktop capture](screenshot-game.png) show the integrated controls. These are Chromium/software-WebGL checks, not physical-phone performance measurements.

Version 2.1 registered **60 browser cases** in total; the full version 2.0 route/ending matrix below was not rerun for that input-only update. Reproduce the five new cases with `BASE_URL=http://127.0.0.1:5174 npx playwright test tests/browser-joystick.spec.js`. The 20-case layout/lifecycle batch uses `npx playwright test tests/browser.spec.js tests/browser-pseudolocale.spec.js --grep 'layout|pseudolocalization|desktop: movement' --workers=2 --fully-parallel` with the same `BASE_URL`. Production staging and its independent browser check are described below.

## Version 2.0: vertical levels

The current iteration adds manual jumping, crawling and ladders, connected elevations, throwable distractions and revised guard behavior. Its route design is described in [LEVEL_DESIGN.md](LEVEL_DESIGN.md). The checks below ran in the development environment; publication status is recorded separately in [DEPLOYMENT.md](DEPLOYMENT.md).

### Version 2.0 evidence

The current **36 Node tests passed** (26 engine and 10 localization tests), and the refreshed GitHub Pages subpath build passed in **3.77 seconds** after the final input-focus correction. **All 55 distinct browser cases passed across targeted runs**, including the refreshed production check. The earlier 45-case result below belongs to the flat episode and is not counted as evidence for this iteration.

| Current browser group | Cases | Current result and scope |
| --- | ---: | --- |
| Core interface and lifecycle | 17 | Passed: all 15 RU/EN/HE viewport layouts, the desktop lifecycle/save/language sequence and the original single-touch RTL movement case. The final two cases took 1.2 minutes and 13.8 seconds respectively. |
| Fresh-start complete routes | 3 | Passed with actual input through all four vertical rooms, both rescues and both worker roles: RU 103.8 simulation seconds / 3.6 minutes wall time; EN 103.4 seconds / 3.2 minutes; HE 104.9 seconds / 3.2 minutes. The final EN/HE batch used two workers and took 3.3 minutes. |
| Presentation and save fixtures | 14 | Passed: nine localized ending variants, natural cinematic completion/pause, language and active-mechanism reload, manual glass-opening traversal, endangered-body escape and checkpoint retry. |
| Isolated role alternatives | 3 | Passed: sorting and dock upper spans crossed in both directions while their passenger doors stay closed; the garden cart finishes after release and opens a lower route that is crossed both ways. These fixtures are not additional full playthroughs. |
| New traversal, distraction and input | 7 | Passed: explicit Space jump and C clearance, W/S ladder and mid-climb save, airborne held-item save, in-flight object/impact response and recovery, actual multi-contact Hebrew touch, readable danger warning over a transient toast, and held-key/room transition/pause/mouse-retry regression. The object case proves that the guard physically reaches the impact point and begins inspection after reload; the final input regression passed in 12.2 seconds. |
| Error recovery | 4 | Passed: missing required art/retry, storage and audio denial, resize/context loss, unavailable WebGL. |
| Audio | 2 | Passed: existing branch/mix checks and the new movement/object/guard cues. |
| Pseudolocalization | 4 | Passed with expanded RU/HE text in narrow portrait and landscape. Together with the 15 normal layouts, this batch took 6.8 minutes. |
| Production subpath | 1 | Passed against the built site under `/GAMES-OTHERSELF/`: local assets and correct base path, no development hook, jumping/inventory/crawling, save/language continuation and no unexpected requests. The final refreshed-build rerun took 14.9 seconds / 16.4 seconds including the runner. The earlier combined production/error batch took 50.4 seconds. |

The EN/HE route attempts exposed a real input bug: room rendering cleared an already-held keyboard direction, stopping movement until another key press. Rendering now preserves held keyboard keys while clearing old touch pointers, and room/retry transitions restore game focus. Both complete routes passed again on the corrected application, as did the dedicated regression covering pause clearing movement and keyboard movement after a mouse-operated retry. Failed or intentionally interrupted attempts are excluded from the successful results. Browser screenshots and software WebGL validate visible behavior and layout; they do not establish real-phone performance or human play duration.

The 17 presentation/alternative cases passed across a 17-case batch and focused reruns. Their initial failures exposed driver assumptions: v2 investigation is an object and requires deep comparison; a patrol needs simulation time rather than a short wall-clock wait under software rendering; and the dock mechanism fixture must include the reachable earlier keeper-parking setup instead of assuming a second guard will ignore the console noise. The final fixture leaves that guard's recovery, patrol, sight and hearing active. None of these corrections changed game rules or removed the closed-door return traversal assertion.

Independent deterministic checks of the current engine passed:

- A fresh-start route through all four rooms, using explicit crawl, ladder, jump, movement, possession and action inputs, both worker roles and both rescues, reached the final bell in **96.68 simulation seconds**. It also visited the vestibule's upper observatory. No world state was edited after `createGame()`.
- The same route stopped before the bell and returned through all four rooms to the original entry, with both rescues retained, in **155.50 simulation seconds total**. The reverse route uses the actual exit gaps, ladders and garden ground opening. An initial unsafe possession left an exposed body and correctly lost; the successful route borrows from cover instead.
- Four saved states captured from the actual v1 engine migrated: fresh start, a borrowed keeper, an advanced garden state with a prior rescue, and Nim on the old bridge. Migration preserved room, opened doors, completed route flags and rescues, reset the incompatible bodies to the safe entry, survived three seconds of simulation and produced a valid v2 save.
- Exact v2 save round trips passed while holding an object, crouching, partway up a ladder, rising after a jump, during projectile flight, and after the impact response. These are serialization checks, not extra completed playthroughs.

These timings describe practiced automated paths, not first-time-player pacing. Temporary independent route drivers and captured migration fixtures are under `/tmp/otherself-v2-review/` in the validation environment.

The v2 full routes, role/ending fixtures and five isolated physics/save/input-transition cases use Low quality at **640×360 CSS pixels, emulated DPR 0.5 (320×180 raster)** so software rendering can complete the functional checks. The 15 regular layouts and Hebrew **390×844** touch/danger captures use DPR 1. Reduced-raster route images establish traversal and behavior, not final visual quality or hardware performance; no game simulation timestep was accelerated.

### Reproduce the vertical-level checks

`npm test` runs the 36 Node cases. With the development server running, `BASE_URL=http://127.0.0.1:5174 npx playwright test --grep-invert 'production subpath deployment' --workers=2` runs the development-browser cases (54 in version 2.0; 59 in 2.1; 63 in 2.2). The 5174 server used for the final browser runs had hot reload disabled so source-file writes could not reset an active test.

The tested production staging procedure was:

```sh
npm run build -- --base=/GAMES-OTHERSELF/
mkdir -p /tmp/otherself-v2-release/GAMES-OTHERSELF
cp -a dist/. /tmp/otherself-v2-release/GAMES-OTHERSELF/
python3 -m http.server 4184 --bind 127.0.0.1 --directory /tmp/otherself-v2-release
```

With that static server running in another terminal, run `DEPLOY_URL=http://127.0.0.1:4184/GAMES-OTHERSELF/ npx playwright test tests/browser-deployment.spec.js --output=/tmp/otherself-v2-release-results`. The production case is skipped when `DEPLOY_URL` is absent; a skipped case is not a successful deployment check. This local staging does not publish the new version or establish public-site behavior. A normal public-site request from this cloud environment was rejected by its outbound proxy before reaching GitHub Pages; no live public-browser check is claimed. Publication status is tracked separately in [DEPLOYMENT.md](DEPLOYMENT.md).

Current fixtures and full routes use Chromium with software WebGL. No separate v2 frame-time benchmark was taken during the concurrent acceptance runs; the old frame-time sample below is historical. Screenshot/trace output from concurrent runs is isolated under separate `/tmp/otherself-v2-*` directories; scene and interface captures are also retained under `/tmp/otherself-qa/`. Real-device performance, first-time-player pacing, a native Hebrew edit and subjective sound review remain external checks.

## Archived Episode 1.0 validation — 18 November 2026

The four-hall episode was exercised in Chromium 156.0.8078.79 on Debian Linux, using Playwright 1.56.1 and SwiftShader software WebGL. This report separates genuine input-driven playthroughs, isolated UI/save fixtures, and hardware or human checks that are still outstanding.

### Results

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

### Rendering and audio observations

Full routes used Low quality at **640×360 CSS pixels, emulated DPR 0.5 (320×180 raster)** to make software rendering practical. The normal layout evidence uses full-resolution viewports; reduced-raster route screenshots are functional evidence, not the main art presentation. No simulation timestep or rules were accelerated.

A separate active-garden sample at **1440×900 CSS pixels**, Low quality, approximately **0.621 renderer pixel ratio / 500,000 pixels**, measured 45 animation frames with **94.99ms mean frame time (about 10.5 FPS)**; the observed range was 3.3–208.4ms. This was Linux SwiftShader software rendering, outside the concurrent acceptance run. It does not establish the desktop 60 FPS or mobile 30 FPS targets; those remain unverified on representative hardware.

Offline Web Audio checks rendered the production synthesis graph, including separate creature replies and stressed concurrent effects. They establish signal properties and branch timing, not a subjective listening review of the mix.

### Fixes verified during development

- Menu reload no longer overwrites the saved simulation. Locale changes preserve keyboard focus, bodies, the carrier and running mechanisms.
- Terminal screens remain terminal on Escape. Long result dialogs initially focus their container at scroll position zero, with headings visible; toasts do not cover modal or ending content.
- Compact landscape sizing, Hebrew control placement and brightness, important 44px touch targets, renderer resize and context-loss recovery have dedicated checks.
- True glass/ray obstruction and body danger receive feedback; returning immediately can escape discovery, while ignoring the warning produces the specific cause and restores the safe checkpoint.
- Complete technician routes remain usable after leaving the host and when backtracking through visited halls.
- The first 45%-expanded RU/HE help tests exposed horizontal overflow at 360px. Help now uses a single column on narrow screens, flexible grid tracks and wrapped text. All four pseudo cases passed after the fix; important controls remain at least 44×44 CSS pixels.
- A direct language query now tracks manual language selection, so reloading the standalone page preserves the new choice.

The input drivers wait inside cover and possess at a safe margin within the unchanged 6m range. Earlier failures from overshooting cover or attempting a transition at the exact range boundary were automation errors; no game rule was weakened to make a test pass.

### Deployment and remaining validation

The production bundle passed the local static staging check at `http://127.0.0.1:4183/GAMES-OTHERSELF/`, including a direct `?lang=en` visit, manual Hebrew selection, URL update and reload retaining Hebrew. [GitHub Actions run 44255305018](https://github.com/Oleg2v/GAMES-OTHERSELF/actions/runs/44255305018) subsequently deployed commit `81d5d7d` successfully to [the public game](https://oleg2v.github.io/GAMES-OTHERSELF/). Direct public-site browser verification remains limited by this cloud environment's outbound network policy; see [DEPLOYMENT.md](DEPLOYMENT.md).

Physical phones, Safari and Firefox remain untested. Representative desktop/mobile performance, first-time-player pacing and balance, native-Hebrew review and subjective audio review still require their respective devices or people. Keyboard focus, RTL, reduced motion and control sizing were checked; this visual stealth game has no nonvisual world-navigation mode or screen-reader/accessibility certification. Authored assets and the finished episode flow do not establish exact visual parity with the supplied reference.

### Reproduction

`npm test` runs the Node suite. With the development server running, `BASE_URL=http://127.0.0.1:5173 npx playwright test --grep-invert 'production subpath deployment'` runs the 44 development-browser cases. `DEPLOY_URL=http://127.0.0.1:4183/GAMES-OTHERSELF/ npx playwright test tests/browser-deployment.spec.js` runs the independent production check against a separately served build. Adjust the URL and Chromium executable for another environment; the production case is explicitly skipped without `DEPLOY_URL`.

Screenshots are written to `/tmp/otherself-qa/`; the final audio WAV and metrics were retained under `/tmp/otherself-qa/audio/`. Failed runs retain traces in `test-results/`; later Playwright invocations may replace that directory. The default test configuration uses one worker; the cloud run used two workers for independent batches within its four-CPU quota.
