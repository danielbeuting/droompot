# Droompot V1.5.1 source in V2

This directory is the editable HTML source for the V1.5.1 public Droompot experience.

## Rule
V1.5.1 is the visual and functional baseline. Changes to the public Droompot should preserve its DOM, interaction model and styling unless a product change is explicitly intended.

## Source layout
- `index.part1.html` through `index.part4.html`: readable HTML source, split only to keep repository edits manageable.
- `/style.css`: the editable V1.5.1 stylesheet.
- `/app.js`: the editable V1.5.1 interaction logic.
- `/v151-bootstrap.js`: thin V2 integration layer for loading/saving Supabase-backed Droompot data.
- `scripts/write-v151.mjs`: assembles these normal source files into `dist/v151` during the Vite build.

The production/preview build does **not** depend on `snapshot-v151` or compressed/base64 source files anymore. The snapshot folder is retained temporarily only as a historical fallback while the new source-based build is being verified.
