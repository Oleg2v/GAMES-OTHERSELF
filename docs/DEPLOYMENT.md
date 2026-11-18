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
