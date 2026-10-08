# KUSWEEK · From thought to thread

Scroll-driven apparel design vision, implemented with Three.js r170. A luminous curve becomes a continuous garment wireframe; requirements refine the same mesh; complete variants converge; measurements lead into an animated apparel drafting sheet. The sheet turns as a whole into a luminous axis, and the garment returns before a short handoff to the photographic concept image.

## Run and build

`npm install` then `npm run build`. The result is `dist/index.html`, a self-contained static page with embedded JavaScript, font and image assets. It can be hosted on GitHub Pages without a server or API. `node check.mjs` checks geometry and reversible drafting state.

## Review

- Default: scroll controls the 105-second motion score in both directions.
- `?frame=wire`: wireframe keyframe.
- `?frame=cad`: actual path drawing keyframe.
- `?frame=photo`: completed concept image immediately following the handoff.
- `?t=NUMBER`: exact position in the motion score.
- `?autoplay=1`: timed playback for presentation review; scrolling takes over.

CAD is drawn in six ordered groups, with pauses: cutting outlines, sewing lines, seam allowances, construction lines, dimensions, notches. A per-vertex arc-length timeline clips each path at the actual pen position. A narrow light wake follows the completed part of the line. This is not a static bitmap wipe.

## Scope

This is a vision demonstration, not an AI inference endpoint or validated manufacturing-pattern generator. Draft dimensions reference the supplied regular-shirt size-100 chart and require expert validation for the proposed shacket. The final clothing assets are existing conceptual product images, not procedural fabric rendering or a fabricated claim of physical-sample photography. Because the image and procedural wireframe have different silhouettes, the final transition deliberately uses a short full-image dissolve rather than a misleading half-mesh/half-photo surface.

The public page contains no original company PDFs, private commercial terms, or customer-submission backend. The AX vision is expressed throughout the proposal and production process, not as a separate service step.

Three.js license is included in THREE-LICENSE.txt. Pretendard is embedded for consistent Korean typography.
