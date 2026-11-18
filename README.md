# OTHERSELF / ЧУЖОЕ ТЕЛО / גוף אחר

An original playable 2.5D stealth episode for **Kikkey Games**: four halls, two borrowable roles, two optional rescues, three endings. Built with Three.js, authored Blender geometry and procedural Web Audio. The episode includes a complete route to the shuttle, both worker roles, optional rescues and a staged finale.

![OTHERSELF, actual browser-rendered menu](docs/screenshot-menu.png)

## Run

Requires Node.js 22.12+ (validated with 24.22.1), npm and a browser supporting WebGL2.

```sh
npm ci
npm run dev
```

The development server listens on port 5173. All game models, fonts and audio generation are local; no CDN, account, API key or backend is required. Direct language selection: `?lang=ru`, `?lang=en`, `?lang=he`.

```sh
npm test                 # deterministic game rules, complete routes, dictionaries
npm run build           # distributable static site in dist/
npm run preview         # serve production build
npx playwright test     # browser acceptance; dev server must be running
```

Playwright configuration uses `/usr/bin/chromium` with software WebGL in this cloud environment. Adjust the executable path when testing on another computer. Do not interpret software rendering or a touch-sized viewport as a physical-phone performance result.

## Controls

- A/D or left/right arrows: movement (physical keyboard codes, unchanged in RTL).
- E: contextual action; Q or Space: possess / return. Touch controls expose the same actions.
- Escape: pause/resume. Help, journal, settings, retry and exit are accessible through the interface.

Face a worker within six metres; the double amber collar marks your target. Stay connected for 0.6 seconds. Leave Nim in a protected recess: his body remains vulnerable. A keeper can use hand readers, a technician operates gear consoles. Use E at the ramp to take a deployed covered bridge. Only Nim crosses hall boundaries. Rescue the two sail creatures if you wish; the final bell ends the episode. Backtracking remains possible before ringing it.

Local save includes room, active body, all worker positions and investigation state, machinery progress, gates, rescues and safe checkpoint. Settings persist separately. Corrupt saves fall back safely. No cloud synchronization or analytics.

## Structure and embedding

`src/engine.js` is deterministic world logic, independent of the renderer and browser. `src/scene.js` renders true 3D geometry, `src/audio.js` owns Web Audio, `src/i18n.js` contains complete dictionaries. `src/main.js` exposes `mount(container)`, returning `start`, `pause`, `resume`, `destroy`, `getState`, `getMode`; the standalone bootstrap mounts the local page. Destroy releases listeners, animation frame, audio and GPU resources. CSS is scoped under `.otherself` except the minimal standalone page defaults.

Editable Blender files and generators live in `art/`; optimized GLBs live in `public/assets/`. See [asset provenance](docs/ASSETS.md), [design](docs/DESIGN.md), [localization/audio notes](docs/LOCALIZATION_AUDIO.md), and [validation/limitations](docs/QA.md).

## Validation boundaries

The practiced automated route is roughly 100–150 seconds of simulation; the 10–15 minute first-play target has not been measured with first-time human players. Nim now uses a weighted skeleton and baked normal/albedo maps, with a lower-detail mobile mesh. Automatic crouching, low ledges and narrow gaps are implemented. The eight-second finale includes boarding, rescued creatures and departure, and can be paused or skipped. Physical-phone performance and native-speaker Hebrew review remain external validation tasks; see the exact test evidence in docs/QA.md.

Possible next episode: a wind-harvesting pier with the same two roles and rescued gliders as environmental storytellers. It is outside this build's scope.

**[Play OTHERSELF](https://oleg2v.github.io/GAMES-OTHERSELF/)** on GitHub Pages. The deployment and verification status are described in [deployment instructions](docs/DEPLOYMENT.md). No existing Kikkey site routes, DNS, analytics or outbound messages are changed. Post-game contact buttons only open the existing Kikkey email/WhatsApp destinations.
