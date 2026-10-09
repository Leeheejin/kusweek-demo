# KUSWEEK · From thought to thread

Scroll-driven apparel design vision, implemented with Three.js r170. A moving line follows the source garment silhouette and introduces a photo-registered digital surface. Customer requirements refine that same surface, complete alternatives converge, and measurements lead into an authored apparel drafting sequence. One horizontal frontier clears the CAD sheet and introduces the garment; a vertical frontier then replaces its wire appearance with the source concept image.

The garment uses one 87,001-vertex subdivided surface, one UV field and the source image's alpha silhouette. Its shallow analytic relief adds limited depth around the torso, sleeves and collar. Digital quadrilateral lines and the original concept image are two states of this same mesh; the material frontier does not swap models, vertex positions, scale or UV coordinates. Original brown, charcoal and khaki concept images provide the color comparison.

The light uses a camera-facing ribbon with a bright core and tapered wake. Its finite history follows one moving head through the silhouette, requirements, measurements and CAD. Pen-up travel also follows a continuous route, without adding ink to the drawing. Scroll damping is disabled for reduced-motion preferences.

## Run and build

`npm install` then `npm run build`. The current entry point is `app-continuous.js`. The result is `dist/index.html`, a self-contained static page with embedded JavaScript, font and image assets. It can be hosted on GitHub Pages without a server or API.

Run `npm test` to verify the current implementation. It executes the real app code with browser/GPU boundaries stubbed and checks the shared mesh and UV field, embedded WebP dimensions/alpha metadata, pen-to-path registration, every pen-up boundary, shared CAD/garment scan planes, and reverse-scroll state at 500, 837 and 1265 pixel widths. It does not execute GLSL or decode rendered pixels: shader compilation, raster output and visual quality require browser review.

## Review

- Default: scroll controls the 105-second motion score in both directions.
- `?frame=wire`: wireframe keyframe.
- `?frame=cad`: actual path drawing keyframe.
- `?frame=photo`: completed concept image after the material frontier finishes.
- `?t=NUMBER`: exact position in the motion score.
- `?autoplay=1`: timed playback for presentation review; scrolling takes over.

CAD contains 67 authored drawing paths in six ordered groups: cutting outlines, sewing lines, seam allowances, construction lines, dimensions and notches. A per-vertex arc-length timeline clips each stroke at the actual pen position. Each of the 66 pen-up transfers moves continuously to the next path without leaving connecting ink. A narrow light wake follows the completed part of each stroke.

CAD uses screen-space line ribbons so cutting, sewing, allowance and dimension weights remain distinct when the camera zooms. The leading stroke and completed draft read the same arc-length progress. At the outgoing transition, CAD erasure and garment entry use the same world-space X boundary; the sheet is not rotated into a different model or assembled from flying panels.

## Motion references

- [Codrops Animated Mesh Lines](https://tympanus.net/Development/AnimatedMeshLines/): spline-driven ribbons with a leading head and tapered trail. The module here is independently authored; no demo source was copied.
- [Codrops Cinematic 3D Scroll](https://tympanus.net/Tutorials/Cinematic3DScroll/): staged scale and framing, synchronized foreground typography and breathing room between operations.
- [Active Theory](https://activetheory.net/): layered luminous core, atmospheric depth and restrained interface hierarchy. Its particles and explosive effects are deliberately not reproduced in this garment story.

## Scope

This is a vision demonstration. The photo-registered garment is a front-view 2.5D relief suitable for this presentation; it is not a reconstructed 360-degree garment, a CLO cloth simulation or a validated fitting result. The source clothing images are AI-created concept assets and do not claim to be photographs of a manufactured physical sample.

CAD linework illustrates a proposed drafting process. The stated shoulder 48 cm, chest circumference 114 cm, sleeve 60 cm and length 78 cm reference the supplied regular-shirt size-100 chart. These are not validated shacket cutting patterns. Production requires pattern-expert review. No AI inference, automatic CAD generation or customer-order backend runs in this page.

The public page contains no original company PDFs, private commercial terms, or customer-submission backend. The AX vision is expressed throughout the proposal and production process, not as a separate service step.

Three.js license is included in THREE-LICENSE.txt. Pretendard is embedded for consistent Korean typography; its license is in Pretendard-LICENSE.txt.
