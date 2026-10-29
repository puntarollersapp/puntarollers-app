# PR Badges — uploaded artwork

Upload each user-approved transparent PNG to this folder, **not** `public/frames/`.

PR Badges are small independent corner accessories, not rings around the avatar. Use a square transparent canvas, with the complete accessory and text inside its boundaries. **Recommended master size: 512×512 px**; final UI renders each image at 48×48 CSS px on a 128×128 profile avatar (bottom-right). Check legibility at that size before approval. Do not crop the artwork or hollow out its center.

Suggested filenames:
- `constancia.png`
- `shifter-2026.png`
- `100km.png`
- `navidad-2026.png`
- `nuevo-2027.png`

The existing RollerWeen pumpkin remains at `/rollerween-pumpkin-transparent-20261002-r3.png` and is seasonal decoration, not a user-granted badge.

For each approved asset: upload here, then set the corresponding `pr_frame_catalog.image_url` to `/badges/<filename>.png` in **staging only**. The existing RPC-based unlock/equip/admin rules remain unchanged. `original` means no badge and must have `image_url = NULL`.

Do not merge this branch or run production migrations until visual QA and explicit approval.
