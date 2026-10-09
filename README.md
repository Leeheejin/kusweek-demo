# KUSWEEK — Thought to form

A new implementation of the proposal-led apparel development vision. The former garment geometry, cursor routes, CAD and animation system are not imported.

## Run / build

`node build.mjs path/to/index.html`

This produces a standalone HTML with embedded Three.js r170, Pretendard, three existing concept garment images, shaders and vector drafting artwork. It has no server, account, paid API or CDN dependency. To use this source elsewhere, run `npm install`, then `npm run build`. The working environment also supports an existing esbuild installation in `../qa/node_modules`.

## Narrative

1. A virtual proposal gives the customer a starting point.
2. Vague preferences become fit, length, sleeve and detail requirements.
3. Whole garment alternatives are compared and converge on a direction.
4. Measurements become a shared specification.
5. Existing CAD assets and pattern expertise inform production design.
6. The design is reviewed as a virtual sample.
7. Material and color directions are compared.
8. Expert review and physical sampling lead to manufacturing and reusable proposal assets.

AX is the connective process, not an extra workflow card or a claim of autonomous manufacturing.

## Rendering and motion

- Three.js orthographic composition, direct normalized scroll clock, no elapsed-time motion.
- The detailed garment is an image-based technical surface. It is not a reconstructed 360-degree model or a cloth solver. Continuous vertex warps illustrate fit/length/sleeve intent, rather than pretending to simulate tailoring.
- Surface gradients guide thin optical grid lines. One registered image surface changes from technical to fabric presentation via a scan mask.
- Whole alternatives maintain their silhouette through the convergence.
- CAD is newly authored SVG artwork. The forward optical boundary and reveal clip use the exact same X coordinate. The beam has no pen-up return or hidden per-path reset.
- The camera is fixed, and stationary scroll holds a stationary frame. Scroll up intentionally retraces the presentation.
- The final materials are concept visuals; physical handfeel, drape and production suitability require real sample verification.

## Source use

The supplied brand, diagnosis, schedule and company PDFs informed the wording: shirt manufacturing expertise, Soft Utility, washed cotton, proposal-led selling, expert CAD review, physical sample checks and reuse in sales content. Private PDFs, commercial terms, diagnosis scores and management details are not embedded.

The reference dimensions 48/114/60/78 cm are existing regular-fit shirt size-100 values, not approved measurements of the pictured shacket. CAD curves, seam allowance and placement are illustrative, not production cutting data. The website labels these limitations.

## Direction references

- Lusion WebGL Scroll Sync — https://webgl-scroll-sync.lusion.co/ : coherent movement of a visual subject relative to document content.
- Active Theory — https://v5.activetheory.net/ : restrained light, visual depth, a single dominant focal subject and minimal navigation.

No reference artwork or source code was copied. Third-party library and font licenses are included.
