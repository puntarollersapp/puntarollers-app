# PR Frames — assets

All frame assets are **1024 × 1024 px transparent PNG** files. The platform displays them at 160 × 160 CSS px over a centered 128 × 128 CSS px rounded-square profile avatar. The central rounded-square region (x/y 102–921 at master resolution, corner radius 230 px) must be fully transparent, including shadows and glow. Keep the entire visual design outside that protected zone.

Upload approved files to this directory on branch `feature/pr-frames-current-platform-20261029`, one by one, using exact names:

- `original.png`
- `constancia.png`
- `shifter-2026.png`
- `100km.png`
- `navidad-2026.png`
- `nuevo-2027.png`

Do not replace an approved asset or merge this branch into production without review. The gallery currently reads `image_url` from the frame catalog; point that value to `/frames/<filename>.png` only after the PNG exists in this directory.
