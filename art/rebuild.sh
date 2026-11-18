#!/usr/bin/env bash
set -euo pipefail
art_repository_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$art_repository_root"
blender --background --python art/build_assets.py
blender --background art/nim.blend --python art/rebind_and_validate.py
blender --background art/nim.blend --python art/shape_nim_v3.py
blender --background art/nim.blend --python art/add_nim_eyelids.py
python3 art/validate_exported_assets.py
blender --background --python art/build_sail.py
blender --background --python art/build_workers.py
python3 art/build_materials_v2.py
python3 art/validate_materials.py
