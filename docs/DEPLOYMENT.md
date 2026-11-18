# Deployment

The standalone target is GitHub Pages for `Oleg2v/GAMES-OTHERSELF`. No production Kikkey routes or DNS changes are required.

The workflow `.github/workflows/pages.yml` installs the frozen lockfile, runs game and localization tests, builds with Vite base `/GAMES-OTHERSELF/`, and uploads only the static `dist/` artifact. Source `.blend` files and the development-only state hook are excluded from the published site.

Repository Pages must use GitHub Actions as its build source. A push to `main` or manual workflow dispatch publishes an updated site. The authoritative public URL is the URL returned by the successful deployment; a guessed URL or a saved workflow does not prove publication.

Local reproduction:

```sh
npm ci
npm test
npm run build -- --base=/GAMES-OTHERSELF/
```

Verify the final site by its full repository path, including script/style/font/GLB responses, menu/start/possession, language switching and browser refresh. Do not use the development-state test hook to validate a production deployment.

## Publication status

Version **2.1.0**, with an analog touch joystick and round action controls, is published at **[https://oleg2v.github.io/GAMES-OTHERSELF/](https://oleg2v.github.io/GAMES-OTHERSELF/)**. It retains the vertical levels and throwable distractions introduced in version 2.0.

[Workflow run 44293138815](https://github.com/Oleg2v/GAMES-OTHERSELF/actions/runs/44293138815) successfully built and deployed commit `bbbec42` on `main` in 49 seconds. The deployment returned the public URL above. This update passed 36 Node tests and 29 targeted browser cases, including real joystick movement and saved continuation in the production bundle. The earlier version 2.0 release passed its separate 55-case browser matrix; see [QA.md](QA.md) for the version-specific scope and evidence.

The production build passed the local subpath browser check described in [QA.md](QA.md). Direct checks of the public site from this cloud environment are blocked by its outbound network policy before the request reaches GitHub Pages. Publication is confirmed by the successful GitHub deployment; a live public browser check is not claimed.
