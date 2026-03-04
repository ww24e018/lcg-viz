# lcg-viz — Design Document

## Purpose

Visually validate the seeded Fisher-Yates shuffle used in the portfolio About page.
The function uses a Linear Congruential Generator (LCG) with Knuth's constants.
Goal: confirm visually that the shuffle looks unbiased across many seeds.

The original motivation: rather than auditing the math, do a quick visual check —
run the function over many seeds and look for unexpected patterns (stripes, bands, clustering).

---

## Algorithm

Original source: portfolio `AboutView.vue`. The LCG step has since been extracted into
a named function and generator to allow standalone visualisation of the raw LCG sequence.
The shuffle output is identical to the original.

```ts
// One LCG step (Knuth constants)
function lcg(s: number): number {
  return (s * 1664525 + 1013904223) & 0xffffffff
}

// Infinite generator — yields the raw LCG sequence from a seed
export function* lcgIterator(seed: number): Generator<number, never, unknown> {
  let s: number = lcg(seed)
  while (true) {
    yield s
    s = lcg(s)
  }
}

// Fisher-Yates shuffle driven by lcgIterator
export function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr]
  const lcgSeries = lcgIterator(seed)
  for (let i = a.length - 1; i > 0; i--) {
    const s = lcgSeries.next().value
    const j = Math.abs(s) % (i + 1)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
```

**LCG constants:**
- Multiplier: `1664525`
- Increment: `1013904223`
- Modulus: `2^32` (via `& 0xffffffff`)
- Standard Knuth parameters — well-known for general non-crypto use

**Algorithm:** Fisher-Yates (Knuth) shuffle, using the LCG output as the random source.

---

## Visualizations

### 1. Position Heatmap

**What it shows:**
For each of K seeds, run shuffle on array `[0, 1, ..., N-1]`.
Record where each item lands. After K runs, build an N×N frequency matrix:
`matrix[i][j]` = how many times item `i` ended up in slot `j`.

**Rendering (D3):**
- N×N grid of colored rectangles
- Color scale: sequential (user-selectable; default YlGnBu: light yellow → dark blue), mapped to min/max frequency
- A perfectly uniform shuffle → all cells roughly the same color (count ≈ K/N)
- Watch for: diagonal stripes, dark/light rows or columns → indicate systematic bias

**Legend (below heatmap):**
- Four labeled swatches always ordered by value: `min`, lower-of(avg/med), upper-of(avg/med), `max`
- `avg` = K/N (analytical expected value per cell); `med` = median of all N×N cell counts
- avg and med swap positions as parameters change — which is larger indicates skew direction
- Helps gauge how large the actual deviation is relative to the expected uniform distribution

**Interaction:**
- Hover tooltip: `item i → slot j: count times`
- Color scale selector (inside heatmap card, above the SVG): dropdown + left/right arrow keys cycle through scales when the selector is focused

**Default params:** N = 52, K = 2 000

---

### 2. Scatter / Dot Cloud

**What it shows:**
For each run i (x-axis = loop index 0..K-1), where does element `0` land after the shuffle (y-axis = output position 0..N-1)?

**Rendering (D3):**
- SVG scatter plot
- X: loop index (0..K-1), Y: landing position of item 0
- Each point = one shuffle run
- Good result → noise-like cloud filling the space
- Bad result → diagonal bands, horizontal stripes, periodic patterns

**Interaction:**
- Hover tooltip: `seed index: X, position: Y`

**Default params:** K = 2 000 (fewer points needed for visual clarity)

---

## What to look for

| Pattern | Meaning |
|---|---|
| Uniform heatmap colors | Shuffle is well-distributed across positions |
| Diagonal stripe in heatmap | LCG period causes item i to prefer slot i+k |
| Horizontal band in scatter | Item 0 is over-represented in certain slots |
| Noise cloud in scatter | Good — no obvious periodicity |

---

## App controls

Global controls bar:
- **N slider** (array size): range 8–52, default 52
- **K slider** (seed count): range 500–20 000, default 2 000 (shared between both charts)
- **Seed MSB nibble** (bits 28–31 of start seed): range 0–15, default 0
- **Seed LSB nibble** (bits 0–3 of start seed): range 0–15, default 0
- **Seed step**: increment between consecutive seeds in the sampling loop: range 1–15, default 1
- **Start seed** (read-only): computed as `(msb << 28) | lsb`, displayed in hex (`0x` + 8-digit uppercase)

Seed for run i = `((startSeed + i * step) >>> 0)`. Defaults reproduce original behaviour (seeds 0..K-1).

Heatmap card (internal):
- **Color scale**: dropdown inside the heatmap card — YlGnBu (default), Viridis, Plasma, Inferno, Magma, Warm, Cool, RdYlGn; left/right arrow keys cycle through scales when focused

---

## D3-in-Vue pattern

D3 and Vue's reactivity can conflict if both try to manage the DOM.
Use this pattern:

```ts
// In Heatmap.vue / Scatter.vue
const svgRef = ref<SVGSVGElement | null>(null)

onMounted(() => render())
watch(() => props.data, () => render(), { deep: true })

function render() {
  const svg = d3.select(svgRef.value)
  // D3 owns everything inside the SVG
  // Use enter/update/exit pattern
}
```

- Vue template: `<svg ref="svgRef" />` plus a container `div` for ResizeObserver
- D3 handles all child elements (rects, circles, axes, tooltips)
- Props pass computed data (matrix or points array) from App.vue
- `ResizeObserver` on the container div drives a `containerWidth` ref; `render()` derives SVG dimensions from it — enables responsive sizing without fixed pixel widths

---

## Deployment

- GitHub Pages, repo: `ww24e018/lcg-viz`
- `vite.config.ts` `base: '/lcg-viz/'` — required for asset paths to resolve on Pages
- GitHub Actions workflow: `.github/workflows/deploy.yml`
  - Trigger: push to `main`
  - Steps: checkout → Node setup → `npm ci` → `npm run build` → deploy `dist/` to `gh-pages`
- Live URL: https://ww24e018.github.io/lcg-viz/
- After first deploy: enable in repo Settings → Pages → source: `gh-pages` branch
