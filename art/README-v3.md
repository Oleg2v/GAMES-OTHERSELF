# Final authored assets and reproducibility

`./art/rebuild.sh` rebuilds the complete asset set with Blender 4.3.2, Python 3, NumPy and Pillow. It does not need network access or the user reference image. Do not run only the older intermediate sculpt exporter when preparing a release: the final anatomical pass is `shape_nim_v3.py`.

The sequence is important:

1. `build_assets.py` and `refine_nim.py` author continuous anatomy, high-detail sculpt, tangent normal/albedo bake, skin weights and the 12-bone rig.
2. `rebind_and_validate.py` validates the initial weight assignment and its deformation bounds.
3. `shape_nim_v3.py` performs the final proportional refinement while retaining those validated skin indices and weights: narrower head/body, more inset amber eyes, extended forearms/fingers and a raised cranium. The source stores `anatomy_version=3` to prevent applying the adjustment twice.
4. `add_nim_eyelids.py` adds broad olive upper/lower eyelid shells, reduces excessive amber brightness, and shifts head/shoulders slightly forward while keeping bind joints aligned. It preserves the rig and uses an idempotent source flag.
5. `validate_exported_assets.py` reads the shipped high and mobile GLBs and independently evaluates their joint matrices, inverse bind matrices, weights and positions over 17 gestures. It checks height, foot placement, normalized weights and displacement bounds. Both files pass; final height is approximately 1.434 m. The check uses the exported data, not Blender's source assumptions.
6. The remaining generators produce sail creatures, worker helmets and the local material pack.

Animated child joint names/rest rotation contract is unchanged. The root torso carries the Blender-to-glTF axis conversion. Runtime code may animate the arms, forearms, hands, legs, shins and head as before. Both models face local +Z.

`nim-proportions-comparison.jpg` compares the previous and final art inspection renders. `nim-preview.png` and `nim-pose-preview.png` show the final anatomy in rest and a limb gesture; they are studio inspections, not gameplay screenshots. The previous two inspection images are retained for an explicit visual comparison.

The industrial greenhouse PBR material pack is documented in `materials-v2/README.md`; its manifest is `public/assets/textures/v2/manifest.json`. Fourteen maps total approximately 927 KiB. Color maps are compressed WebP; tangent normal maps use lossless WebP to avoid color-subsampling distortion. Normal-vector length and tile-edge checks were run on the actual encoded files.

Nim's shipped skin material uses metalness 0, roughness .56 and baked normal strength .65. No missing normal map, accidental metallic skin, external resource path or material alpha defect was found. In-game distance and lighting determine how much sculpt detail is visible; a dark teal multiplier should not be added to the baked skin albedo.
