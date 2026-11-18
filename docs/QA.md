# Validation — 18 November 2026

The standalone game was exercised in Chromium 156.0.8078.79 on the Linux cloud machine, using Playwright 1.56.1 and SwiftShader software WebGL. This is browser automation and device emulation, not testing on a physical phone.

## Completed checks

Results passed across targeted runs; there was no single monolithic 24-test invocation.

- Frozen dependency installation (`npm ci`), all **21 Node tests**, and the production build passed.
- **17 core browser cases passed:** real keyboard movement and possession/return; switching to Hebrew without losing body positions or keyboard control; pause/settings/resume; save, exit, reload and continuation; menu/help/game controls in all three languages at each of **360×640, 390×844, 844×390, 768×1024 and 1440×900**; on-screen direction controls in Hebrew.
- **3 complete browser routes passed, one each in RU, EN and HE:** all four halls, possession of both roles, keeper doors, return to Nim, both optional rescues, the final bell, the two-creature ending, and retaining the result screen when Escape is pressed. The driver uses actual keys and reads state only for assertions; it never teleports or edits the simulation.
- **4 error/recovery browser cases passed:** required model-load failure and retry; denied local storage and audio; resizing the renderer and handling non-bubbling WebGL context loss; unavailable WebGL with a recoverable error screen.
- A separate production-bundle smoke check passed menu, start and possession with no page errors or failed requests; the development state hook was absent.

The browser suite contains **24 distinct cases** in total. The final touch-specific follow-up is recorded below. `npm test` runs the Node checks; run `npx playwright test` with the development server on port 5173 to run browser checks, or supply `BASE_URL` for another local server.

Full routes used the low quality setting at **640×360 CSS pixels, emulated DPR 0.5 (320×180 rendering)** to make software rendering practical. This is functional acceptance evidence; the 15 layout checks used full-resolution viewports and DPR 1. The RU route took 3.3 minutes of wall time / 128.6 seconds of simulation time. EN and HE ran concurrently and completed in 5.9 minutes total / 126.9 and 127.1 simulation seconds respectively. These practiced automated routes do not establish the intended 10–15-minute first-play duration.

Technician bridge/cart alternatives and the zero-, one- and two-rescue endings are covered by the deterministic engine tests. Browser full-route acceptance used the keeper-door route, both worker roles and two rescues; it does not claim browser traversal of every alternative.

## Fixes found through validation

- Reloading from the menu overwrote progress with the menu's fresh simulation. Saving now runs only in active or paused play; exit → reload → continue preserves the original state.
- Locale changes could discard keyboard focus. The game restores focus to its container after switching language.
- Escape could dismiss a terminal result into a finished simulation. Win/loss screens retain their terminal state.
- The 844×390 landscape inherited a 480px minimum height and clipped controls. Compact layout and flex sizing were corrected and all three locales passed.
- Hebrew initially moved movement controls to the right. Direction controls now stay under the left thumb, action controls under the right; only reading order changes.
- Renderer sizing and non-bubbling context-loss handling received dedicated checks.
- Focusing a link near the bottom of a long result dialog hid the ending heading on short screens. Dialogs now start at scroll position zero and focus their container without scrolling. A separate isolated ending-layout fixture verified that the heading is visible and the dialog container has focus; closing menu help restores focus to its trigger. This fixture does not count as a gameplay playthrough.

The first automation routes also exposed two driver mistakes: attempting possession exactly at the 6m boundary, and overshooting the edge of cover while unnecessarily facing right. The game correctly cancelled the transition / detected Nim. The final driver waits for a target within 5.2m and stops in the center of cover. No game rule was weakened to pass the tests.

## Rendering observations

Short frame-time samples were taken during the live first-room scene, with the patrol and environment animating. These software-renderer observations are **not** a measurement of a normal desktop GPU or phone.

| CSS viewport / DPR | Quality | Sample | Mean frame time | Approximate FPS |
| --- | --- | --- | --- | --- |
| 960×640 / 1 | Low | 30 frames after warm-up | 196.7ms | 5.1 |
| 640×360 / 1 | Low | 30 frames after warm-up | 117.2ms | 8.5 |
| 640×360 / 0.5 | Low | 120 frames after warm-up | 70.6ms; p95 99.9ms | 14.2 |

The 60 FPS desktop / 30 FPS mobile targets remain unverified on representative hardware. Trace screenshots were disabled to reduce acceptance-test overhead; no simulation time or rules were accelerated. Optional repeat sampling is available with `OTHERSELF_BENCHMARK=1` on the English route.

## Remaining validation and limits

- Physical phones, Safari and Firefox have not been tested.
- Native-Hebrew review, player pacing/balance sessions and an auditory review of the mix remain outstanding.
- Keyboard focus, RTL and reduced-motion behavior are supported, but there is no nonvisual world-navigation mode, screen-reader certification or accessibility certification.
- This is a first playable authored episode, not evidence of commercial-release polish or exact visual parity with the reference.

Screenshots are generated in `/tmp/otherself-qa/`; failed runs retain traces in `test-results/`. Reduced-raster route images document mechanics, not the art's full-resolution quality.

## Touch follow-up

Passed in a separate 7.4-second run: actual Chromium CDP touch-start/touch-end events moved Nim right in the Hebrew 390×844 viewport; movement controls remained physically left of the action controls. This replaces the prior mouse-pointer check for the same core case and is not an additional distinct test. The final screenshot also confirms the corrected Hebrew gameplay brightness. This remains touch emulation, not a physical-phone test.

Informational toasts are suppressed while a modal is open, preventing checkpoint or ending notifications from covering the dialog heading. This final presentation-only CSS change was included in the successful production rebuild.
