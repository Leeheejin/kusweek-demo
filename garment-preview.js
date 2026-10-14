/**
 * Photo-based garment preview. No reconstructed 3D or simulated cloth.
 * Shape options always select prepared photographs; colors preserve their
 * luminance, folds and texture. Only transitions and resizing request frames.
 */
export const PREVIEW_COLORS = Object.freeze({
  bone: { label: '본', hex: '#d8d2c4' },
  navy: { label: '네이비', hex: '#293e54' },
  khaki: { label: '카키', hex: '#76785c' },
  charcoal: { label: '차콜', hex: '#444747' },
  clay: { label: '클레이', hex: '#9b7552' },
});

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const descriptor = value => typeof value === 'string' ? { src: value } : value;
const isSource = value => typeof value === 'string' || Boolean(value?.src);
const unique = list => [...new Set(list.filter(Boolean))];

function productConfig(sources, product) {
  if (!sources.products) return sources;
  return sources.products[product] || sources.products[Object.keys(sources.products)[0]];
}

function viewConfig(config, view = 'front') {
  const entry = config.views?.[view];
  if (entry) return isSource(entry) ? { hero: entry, variants: config.variants || [] } : { ...entry, variants: [...(config.variants || []), ...(entry.variants || [])] };
  return config;
}

/** Pure metadata helper. Unsupported shape changes are never offered. */
export function getPreviewCapabilities(imageSources, product, view = 'front') {
  const config = productConfig(imageSources, product);
  const current = viewConfig(config, view);
  const variants = current.variants || [];
  const values = key => variants.map(variant => variant.when?.[key]);
  const fit = current.fitted || current.fits?.regular || current.fits?.relaxed ? ['regular', 'relaxed'] : ['regular'];
  return {
    product: imageSources.products ? Object.keys(imageSources.products) : ['overshirt'],
    color: config.colorsAllowed || Object.keys(PREVIEW_COLORS),
    fit: unique([...fit, ...Object.keys(current.fits || {}), ...values('fit')]),
    sleeve: unique([current.sleeve || config.sleeve || 'long', ...values('sleeve')]),
    pocket: unique([current.pocket || config.pocket || 'utility', ...values('pocket')]),
    fabric: unique([current.fabric || config.fabric || 'cotton', ...values('fabric')]),
    view: unique(['front', ...Object.keys(config.views || {}), ...values('view')]),
  };
}

function selectSource(sources, state) {
  const config = productConfig(sources, state.product);
  const view = viewConfig(config, state.view);
  const variant = (view.variants || []).filter(entry => Object.entries(entry.when || {}).every(([key, value]) => state[key] === value))
    .sort((a, b) => Object.keys(b.when || {}).length - Object.keys(a.when || {}).length)[0];
  let base = view;
  if (variant) base = { ...view, ...variant, hero: variant.src ? variant : variant.hero || view.hero };
  else if (view.fits?.[state.fit]) base = isSource(view.fits[state.fit]) ? { hero: view.fits[state.fit] } : view.fits[state.fit];
  else if (state.fit === 'regular' && view.fitted) base = { hero: view.fitted, baseColor: view.baseColor };
  const hero = descriptor(base.hero || base.src && base || view.hero);
  if (!hero?.src) throw new Error(`No garment image for ${state.product}/${state.view}.`);
  const inferred = /ivory|bone/i.test(hero.src) ? 'bone' : /charcoal/i.test(hero.src) ? 'charcoal' : /khaki/i.test(hero.src) ? 'khaki' : 'clay';
  const nativeColor = hero.color || base.baseColor || config.baseColor || inferred;
  const exact = base.colors?.[state.color] || base[state.color] || (state.color === nativeColor ? hero : null);
  const selected = descriptor(exact || (state.color === 'navy' && base.charcoal) || hero);
  return { ...selected, native: Boolean(exact || variant?.when?.color === state.color), color: state.color };
}

export function createGarmentPreview(canvas, { imageSources, onReady, onError, initial = {}, duration = 260, shadow = true } = {}) {
  if (!canvas?.getContext) throw new TypeError('A canvas element is required.');
  if (!imageSources) throw new TypeError('imageSources is required.');
  const context = canvas.getContext('2d', { alpha: true });
  if (!context) throw new Error('Canvas 2D is unavailable.');
  const sourceCache = new Map(), imageCache = new Map(), renderCache = new Map();
  let destroyed = false, requestId = 0, animation = 0, transition = null;
  let current = null, state = null, pending = null;
  let viewport = { width: 1, height: 1, dpr: 1 };
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const linear = Float32Array.from({ length: 256 }, (_, i) => {
    const value = i / 255; return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
  });
  const encode = value => Math.round(clamp(value <= .0031308 ? value * 12.92 : 1.055 * Math.max(0, value) ** (1 / 2.4) - .055) * 255);

  function loadImage(src) {
    if (!imageCache.has(src)) imageCache.set(src, new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = 'async';
      if (!src.startsWith('data:') && !src.startsWith('blob:')) image.crossOrigin = 'anonymous';
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Unable to load garment image: ${src}`));
      image.src = src;
    }));
    return imageCache.get(src);
  }

  // Connected neutral background, used only for an opaque studio photograph.
  // Black collars and neutral details inside the garment are not flood-filled.
  function neutralBackground(data, width, height) {
    const mask = new Uint8Array(width * height), queue = new Int32Array(width * height);
    let read = 0, write = 0;
    function add(index) {
      if (mask[index]) return;
      const p = index * 4, r = data[p] / 255, g = data[p + 1] / 255, b = data[p + 2] / 255;
      const hi = Math.max(r, g, b), lo = Math.min(r, g, b);
      if (hi < .45 || (hi - lo) / Math.max(hi, .01) > .19) return;
      mask[index] = 1; queue[write++] = index;
    }
    for (let x = 0; x < width; x++) { add(x); add((height - 1) * width + x); }
    for (let y = 1; y < height - 1; y++) { add(y * width); add(y * width + width - 1); }
    while (read < write) {
      const index = queue[read++], x = index % width;
      if (x) add(index - 1);
      if (x < width - 1) add(index + 1);
      if (index >= width) add(index - width);
      if (index < width * (height - 1)) add(index + width);
    }
    return mask;
  }

  async function sourceData(source) {
    const key = JSON.stringify([source.src, source.crop || null, source.matte || null]);
    if (!sourceCache.has(key)) sourceCache.set(key, (async () => {
      const image = await loadImage(source.src);
      const crop = source.crop || [0, 0, image.naturalWidth, image.naturalHeight];
      if (crop.length !== 4 || crop.some(value => !Number.isFinite(value)) || crop[2] <= 0 || crop[3] <= 0) throw new Error('Invalid garment crop.');
      const ratio = Math.min(1, 1600 / Math.max(crop[2], crop[3]));
      const width = Math.max(1, Math.round(crop[2] * ratio)), height = Math.max(1, Math.round(crop[3] * ratio));
      const work = document.createElement('canvas'); work.width = width; work.height = height;
      const ctx = work.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(image, ...crop, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height), data = imageData.data;
      let transparentCount = 0;
      for (let i = 3; i < data.length; i += 4) if (data[i] < 170) transparentCount++;
      const cutout = transparentCount > width * height * .01;
      const background = cutout ? null : neutralBackground(data, width, height);
      let minX = width, maxX = 0, minY = height, maxY = 0;
      const histogram = new Uint32Array(256);
      let histogramCount = 0;
      for (let i = 0; i < width * height; i++) {
        const p = i * 4, x = i % width, y = Math.floor(i / width);
        if (cutout) data[p + 3] = Math.round(smooth(.68, .965, data[p + 3] / 255) * 255);
        else if (source.matte === 'neutral' && background[i]) data[p + 3] = 0;
        const garmentPixel = data[p + 3] > 128 && !background?.[i];
        if (garmentPixel) {
          minX = Math.min(minX, x); maxX = Math.max(maxX, x);
          minY = Math.min(minY, y); maxY = Math.max(maxY, y);
          if (x > width * .2 && x < width * .8 && y > height * .2 && y < height * .82) {
            const light = Math.sqrt(.2126 * linear[data[p]] + .7152 * linear[data[p + 1]] + .0722 * linear[data[p + 2]]);
            if (light > .12 && light < .92) { histogram[Math.round(light * 255)]++; histogramCount++; }
          }
        }
      }
      let accumulated = 0, median = 110;
      for (let i = 0; i < 256; i++) { accumulated += histogram[i]; if (accumulated >= histogramCount * .5) { median = i; break; } }
      const transparent = cutout || source.matte === 'neutral';
      const box = minX < maxX ? [minX, minY, maxX - minX + 1, maxY - minY + 1] : [0, 0, width, height];
      // Opaque backgrounds stay intact unless explicitly removed. Cutouts
      // reserve padding around the garment, not around the image rectangle.
      const marginX = box[2] * .065, marginY = box[3] * .028;
      const frame = transparent ? [box[0] - marginX, box[1] - marginY, box[2] + marginX * 2, box[3] + marginY * 2] : [0, 0, width, height];
      return { key, data, width, height, background, transparent, frame, pivot: clamp(median / 255, .2, .82) };
    })());
    return sourceCache.get(key);
  }

  async function prepare(source) {
    const base = await sourceData(source);
    const key = `${base.key}|${source.native ? 'native' : source.color}`;
    if (renderCache.has(key)) { const cached = renderCache.get(key); renderCache.delete(key); renderCache.set(key, cached); return cached; }
    const result = document.createElement('canvas'); result.width = base.width; result.height = base.height;
    const ctx = result.getContext('2d');
    const pixels = new Uint8ClampedArray(base.data);
    if (!source.native) {
      const color = PREVIEW_COLORS[source.color] || PREVIEW_COLORS.clay;
      const target = [1, 3, 5].map(index => linear[parseInt(color.hex.slice(index, index + 2), 16)]);
      const targetLuminance = .2126 * target[0] + .7152 * target[1] + .0722 * target[2];
      const targetLight = Math.sqrt(targetLuminance);
      const ratios = target.map(channel => channel / Math.max(targetLuminance, .001));
      for (let i = 0; i < pixels.length / 4; i++) {
        const p = i * 4;
        if (pixels[p + 3] < 2 || base.background?.[i]) continue;
        const luminance = .2126 * linear[pixels[p]] + .7152 * linear[pixels[p + 1]] + .0722 * linear[pixels[p + 2]];
        const light = Math.sqrt(luminance);
        // A monotone luminance mapping retains small textile variations.
        // Deep recesses and dark hardware remain dark when selecting bone.
        const offset = light - base.pivot;
        const desired = clamp(targetLight + offset * (targetLight > base.pivot ? .82 : .80), .005, .985);
        const protection = smooth(.045, .25, light);
        const mapped = light + (desired - light) * protection;
        const energy = mapped * mapped;
        const neutral = smooth(.64, .94, light) * .24;
        let r = energy * (ratios[0] + (1 - ratios[0]) * neutral);
        let g = energy * (ratios[1] + (1 - ratios[1]) * neutral);
        let b = energy * (ratios[2] + (1 - ratios[2]) * neutral);
        const maximum = Math.max(r, g, b);
        if (maximum > .985) { const scale = .985 / maximum; r *= scale; g *= scale; b *= scale; }
        const lowChroma = (Math.max(pixels[p], pixels[p + 1], pixels[p + 2]) - Math.min(pixels[p], pixels[p + 1], pixels[p + 2])) / 255;
        const hardware = (1 - smooth(.012, .055, lowChroma)) * (1 - smooth(.13, .29, light));
        pixels[p] = Math.round(encode(r) * (1 - hardware) + pixels[p] * hardware);
        pixels[p + 1] = Math.round(encode(g) * (1 - hardware) + pixels[p + 1] * hardware);
        pixels[p + 2] = Math.round(encode(b) * (1 - hardware) + pixels[p + 2] * hardware);
      }
    }
    ctx.putImageData(new ImageData(pixels, base.width, base.height), 0, 0);
    const prepared = { canvas: result, frame: base.frame, transparent: base.transparent, key };
    renderCache.set(key, prepared);
    while (renderCache.size > 8) renderCache.delete(renderCache.keys().next().value);
    return prepared;
  }

  function paint(target, width, height, asset, alpha = 1, drawShadow = shadow) {
    if (!asset || alpha <= 0) return;
    const [sx, sy, sw, sh] = asset.frame;
    const scale = Math.min(width * .94 / sw, height * .94 / sh);
    const dw = sw * scale, dh = sh * scale, dx = (width - dw) * .5, dy = (height - dh) * .5;
    target.save(); target.globalAlpha = alpha;
    target.imageSmoothingEnabled = true; target.imageSmoothingQuality = 'high';
    if (drawShadow && asset.transparent) {
      const shadowY = dy + dh * .98;
      const gradient = target.createRadialGradient(width * .5, shadowY, 0, width * .5, shadowY, dw * .32);
      gradient.addColorStop(0, 'rgba(26,32,29,.09)'); gradient.addColorStop(1, 'rgba(26,32,29,0)');
      target.save(); target.translate(0, shadowY); target.scale(1, .09); target.translate(0, -shadowY);
      target.fillStyle = gradient; target.fillRect(dx, shadowY - dw * .35, dw, dw * .7); target.restore();
    }
    // Drawing the whole source with an offset supports padded frames outside
    // the image bounds without stretching or clipping the garment.
    target.drawImage(asset.canvas, dx - sx * scale, dy - sy * scale, asset.canvas.width * scale, asset.canvas.height * scale);
    target.restore();
  }

  function render(now = performance.now()) {
    if (destroyed) return;
    animation = 0; context.clearRect(0, 0, canvas.width, canvas.height);
    if (transition) {
      const progress = clamp((now - transition.start) / transition.duration), blend = progress * progress * (3 - 2 * progress);
      paint(context, canvas.width, canvas.height, transition.from, 1 - blend);
      context.globalCompositeOperation = 'lighter';
      paint(context, canvas.width, canvas.height, transition.to, blend);
      context.globalCompositeOperation = 'source-over';
      if (progress < 1) animation = requestAnimationFrame(render);
      else { current = transition.to; transition = null; }
    } else paint(context, canvas.width, canvas.height, current);
  }

  function resize(width, height, dpr) {
    if (destroyed) return;
    const bounds = canvas.getBoundingClientRect();
    viewport = { width: Math.max(1, width || bounds.width || 1), height: Math.max(1, height || bounds.height || 1), dpr: clamp(dpr || globalThis.devicePixelRatio || 1, 1, 2) };
    const w = Math.round(viewport.width * viewport.dpr), h = Math.round(viewport.height * viewport.dpr);
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
    if (animation) cancelAnimationFrame(animation);
    render();
  }

  async function update(next = {}) {
    if (destroyed) throw new Error('Garment preview has been disposed.');
    const ticket = ++requestId;
    const product = next.product || state?.product || initial.product || (imageSources.products ? Object.keys(imageSources.products)[0] : 'overshirt');
    const requested = { product, color: 'clay', fit: 'regular', sleeve: 'long', pocket: 'utility', fabric: 'cotton', view: 'front', ...state, ...next, product };
    let caps = getPreviewCapabilities(imageSources, product, requested.view), warnings = [];
    if (!caps.view.includes(requested.view)) { warnings.push(`Unsupported view: ${requested.view}`); requested.view = 'front'; caps = getPreviewCapabilities(imageSources, product, 'front'); }
    for (const key of ['color', 'fit', 'sleeve', 'pocket', 'fabric']) {
      if (!caps[key].includes(requested[key])) { warnings.push(`Unsupported ${key}: ${requested[key]}`); requested[key] = caps[key][0]; }
    }
    const task = prepare(selectSource(imageSources, requested)); pending = task;
    let asset;
    try { asset = await task; } catch (error) { if (ticket === requestId) onError?.(error); throw error; }
    if (destroyed || ticket !== requestId) return { stale: true };
    state = requested; pending = null;
    if (animation) cancelAnimationFrame(animation);
    const from = transition?.to || current;
    transition = from && from.key !== asset.key && !reduced && duration > 0 ? { from, to: asset, start: performance.now(), duration } : null;
    current = asset; render();
    return { state: { ...state }, capabilities: caps, warnings };
  }

  async function exportPng({ width = 1400, height = 1700, background = null, shadow: includeShadow = false } = {}) {
    while (pending && !destroyed) await pending;
    if (!current) await ready;
    if (destroyed) throw new Error('Garment preview has been disposed.');
    const output = document.createElement('canvas'); output.width = clamp(Math.round(width), 64, 4096); output.height = clamp(Math.round(height), 64, 4096);
    const ctx = output.getContext('2d');
    if (background) { ctx.fillStyle = background; ctx.fillRect(0, 0, output.width, output.height); }
    paint(ctx, output.width, output.height, transition?.to || current, 1, includeShadow);
    return new Promise((resolve, reject) => output.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG export failed.')), 'image/png'));
  }

  function dispose() {
    destroyed = true; requestId++;
    if (animation) cancelAnimationFrame(animation);
    observer?.disconnect(); sourceCache.clear(); imageCache.clear(); renderCache.clear();
    current = transition = null; context.clearRect(0, 0, canvas.width, canvas.height);
  }
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(() => resize()) : null;
  observer?.observe(canvas);
  const api = { update, resize, exportPng, dispose, getCapabilities: () => getPreviewCapabilities(imageSources, state?.product || initial.product, state?.view || initial.view), get state() { return state ? { ...state } : null; } };
  resize();
  const ready = update(initial).then(result => { if (!destroyed) onReady?.(api); return result; });
  api.ready = ready;
  return api;
}
