# OTHERSELF V2 — local industrial greenhouse materials

These are original authored procedural surfaces. They use coherent macro shapes (panel joints, rivets, rain runs, tread ridges, mineral damage and leaf veins), rather than a shared random-noise texture on every object. No photograph, reference image or third-party texture was used.

Reproduce all maps and this directory's visual contact sheet with:

```sh
python3 art/build_materials_v2.py
```

Requires NumPy and Pillow. All random fields use explicit fixed seeds. Uncompressed source maps and 16-bit height sources stay here; only the small WebP maps and manifest in `public/assets/textures/v2/` ship to the browser. Fourteen shipped maps total approximately **927 KiB**.

## Renderer contract

- Prefix paths from `manifest.json` with Vite's `import.meta.env.BASE_URL`.
- Albedo maps: `THREE.SRGBColorSpace`. Normal and roughness maps: `THREE.NoColorSpace`.
- Normal maps use the OpenGL tangent convention (+Y); do not invert green for Three.js.
- Use `RepeatWrapping`. Physical size: teal/tread 1.5 m per tile; mineral surface 2 m; leaf .6 m; glass 1.8 m.
- These are colored albedos: set material color to white or a light tint. A dark teal multiplier will make them unnecessarily dark.
- Set material `roughness: 1` when using the roughness maps. Their authored values already represent the intended surface roughness.
- Suggested metalness: painted panel .32; worn exposed tread .72; concrete/glass 0; leaf .02. Painted pipes should be substantially rougher and less metallic than an exposed handrail.
- Suggested normal scale: panel .65; tread/concrete/leaf .8; glass .35. Keep fine normal detail modest at distant camera scales.
- Leaf V follows the leaf length, U its width. Use a single tile across a leaf, rather than repeating multiple midribs.
- Glass has roughness and normal maps only. Preserve the material's transparency; the grime map is not an opaque glass color.
- The tread material represents a solid embossed metal sheet. Actual open grates should still use geometry and physical gaps.

The full mapping, resolution, byte count and descriptions are machine-readable in `public/assets/textures/v2/manifest.json`.
