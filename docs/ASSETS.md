# OTHERSELF — asset provenance and production notes

All character geometry, pigmentation, materials and membrane shapes below were authored specifically for this repository with the included Blender and offline Python generators. No marketplace meshes, generated reference-image planes or third-party textures are included. The user's supplied illustration informs Nim's proportions, eyes and swamp palette; it is not embedded in the game or redistributed as an asset.

| Asset | Game file | Editable sources | Purpose and technical budget |
| --- | --- | --- | --- |
| Nim, main quality | `public/assets/nim.glb` | `art/nim.blend`, `art/build_assets.py`, `art/refine_nim.py`, `art/nim-albedo.png`, `art/nim-normal.png` | Continuous original swamp anatomy, asymmetric skull, circular amber eyes, graphite mantle, rust scarf. 28,182 triangles; 13 material batches; 12 weighted bones; two embedded 1024px baked maps; 2.61 MiB. |
| Nim, mobile quality | `public/assets/nim-low.glb` | Same editable rig, `art/export_mobile.py`, `art/nim-albedo-low.png`, `art/nim-normal-low.png` | Same skeleton and shape with 9,568 triangles, 512px maps; 935 KiB. |
| Sail creature | `public/assets/sail.glb` | `art/sail.blend`, `art/build_sail.py` | Original warm-air glider with ribbed amber membranes and a flexible rudder. 7,720 triangles; 5 material batches; 188 KiB. |
| Keeper head and collar | `public/assets/keeper-head.glb` | `art/keeper-worker.blend`, `art/build_workers.py` | Broad shaped ceramic shell, curved visor, chipped segmented collar and hand insignia. 4,004 triangles; 5 material batches; 153 KiB. |
| Technician head and collar | `public/assets/tech-head.glb` | `art/tech-worker.blend`, `art/build_workers.py` | Narrow asymmetric helmet, optical apertures, gear collar and mechanical latches. 5,308 triangles; 5 material batches; 202 KiB. |
| Industrial greenhouse surfaces | `public/assets/textures/v2/` | `art/build_materials_v2.py`, `art/materials-v2/` | 14 authored maps for painted riveted teal metal, raised bronze tread, damp mineral structures, veined leaves and glass condensation. 512/1024px; 927 KiB combined. |
| Studio inspection renders | Not shipped | `art/nim-preview.png`, `art/nim-pose-preview.png`, `art/keeper-worker-preview.png`, `art/tech-worker-preview.png` | Source-art and deformation inspection. These are not screenshots of gameplay. |

Nim's glTF coordinates are Y-up, feet at Y≈0, height≈1.434 m, facing local +Z. Animation joints: `torso`, `head`, `arm.L/R`, `forearm.L/R`, `hand.L/R`, `leg.L/R`, `shin.L/R`. Animated child joints have identity local rotation in the rest pose (the torso root carries Blender-to-glTF axis conversion); GLTFLoader may sanitize dots to underscores. The smooth skin deforms across shoulders, elbows, hips, knees and wrists with blended weights. Runtime movement is procedural skeletal animation. The sail is oriented forward +Z with membranes spanning X.

The reproducible art pipeline unions the anatomical volumes, smooths their transitions, retains a dense sculpture with layered skin-grain and pore displacement, decimates the game surface, unwraps a UV atlas, and **bakes actual selected-to-active tangent normals and continuous 3D pigmentation** in Cycles. The hidden `SCULPT • Nim high detail bake source` remains editable inside the compressed `.blend` alongside the game mesh and rig. Main and mobile assets preserve the same rig and maps at different resolutions. Mantle and scarf are authored cloth surfaces, with seam and fringe geometry; runtime cloth simulation is not used.

Rebuild from the repository root with Blender 4.3.2:

```sh
blender --background --python art/build_assets.py
blender --background art/nim.blend --python art/rebind_and_validate.py
blender --background art/nim.blend --python art/shape_nim_v3.py
blender --background art/nim.blend --python art/add_nim_eyelids.py
python3 art/validate_exported_assets.py
blender --background --python art/build_sail.py
blender --background --python art/build_workers.py
python3 art/build_materials_v2.py
python3 art/validate_materials.py
```

`rebind_and_validate.py` checks normalized weights, prevents hand/arm influence on toe vertices, evaluates 17 walking/gesture poses against displacement bounds, exports both quality levels and renders rest and flexed poses. The initial pose inspection exposed an outer-toe vertex classification error; it was corrected by bounding arm classification vertically. The corrected full pose sweep passes, and the rendered hand/leg gesture has no stretched geometry.

The final proportion pass preserves UVs and the existing rig: narrower head/body, longer forearms and fingers, smaller inset amber eyes, broad conforming olive upper/lower eyelids and a slight forward head/shoulder posture. Eyelids are skin surfaces, not eyebrows. `art/nim-proportions-comparison.jpg` shows the previous/final source-art comparison. `validate_exported_assets.py` independently evaluates **both actual shipped GLBs** over 17 poses using glTF joint matrices, inverse bind matrices and vertex weights; both passed with unchanged foot/height bounds. `art/rebuild.sh` runs the complete ordered pipeline; see `art/README-v3.md`.

The environment material pack uses deterministic periodic fields plus authored joints, rivets, raised treads, cracks and venation. Albedos are sRGB; normal/roughness are linear data. Tangent normals use lossless WebP after validation exposed distortion from lossy encoding. `validate_materials.py` checks encoded dimensions, periodic edges, normal lengths and manifest byte sizes. All 14 maps pass. No external source image is used. Detailed renderer settings are in `art/materials-v2/README.md` and the shipped manifest.

All GLBs embed their buffers and textures; no network requests are required for artwork. `.blend` files, bake sources and inspection previews stay outside the public build. The project's own authored assets are stylized; no photorealistic reference-image reconstruction or external art award is claimed.

## License inventory

- Original project art and scripts: created for this repository; no external art license obligations. A public distribution license for the project has not been assigned here.
- Blender 4.3.2: GPL-licensed authoring tool; Blender's license does not impose GPL on ordinary exported artwork.
- Three.js 0.181.2: MIT; renderer/runtime dependency.
- Vite 7.2.2: MIT; development/build dependency.
- Playwright 1.56.1: Apache-2.0; validation tooling only.

See package lock metadata and dependency license files for full third-party notices. No fonts or audio files were downloaded by the art pipeline.

## Interface and sound

- Manrope, Unbounded and Heebo are served locally from pinned `@fontsource` packages. These fonts use the SIL Open Font License; copies are shipped in `public/licenses/` alongside the Three.js MIT license.
- Station architecture, guard bodies, icons, weather particles and game VFX are original code-authored meshes in `src/scene.js`.
- The original soundscape is synthesized in `src/audio.js`; no sampled music or external audio files are used.
