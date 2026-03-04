<script setup lang="ts">
import { ref, computed } from 'vue'
import { seededShuffle } from './lcg'
import Heatmap from './components/Heatmap.vue'
import Scatter from './components/Scatter.vue'

const N = ref(52)
const K = ref(2000)
const seedMsb  = ref(0)   // 0–15, top nibble
const seedLsb  = ref(0)   // 0–15, bottom nibble
const seedStep = ref(1)   // 1–15
const lcgShift = ref(0)   // 0–31, right-shift applied to LCG output before modulo

const startSeed = computed(() => ((seedMsb.value << 28) | seedLsb.value) >>> 0)

// N×N frequency matrix: matrix[i][j] = how many times item i landed in slot j
const heatmapMatrix = computed<number[][]>(() => {
  const n = N.value
  const k = K.value
  const arr = Array.from({ length: n }, (_, i) => i)
  const matrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0))
  for (let i = 0; i < k; i++) {
    const seed = ((startSeed.value + i * seedStep.value) >>> 0)
    const shuffled = seededShuffle(arr, seed, lcgShift.value)
    for (let pos = 0; pos < n; pos++) {
      matrix[shuffled[pos]!]![pos]!++
    }
  }
  return matrix
})

// Scatter: for each seed index, where does item 0 land?
const scatterPoints = computed<Array<{ x: number; y: number }>>(() => {
  const n = N.value
  const k = K.value
  const arr = Array.from({ length: n }, (_, i) => i)
  const points: Array<{ x: number; y: number }> = []
  for (let i = 0; i < k; i++) {
    const seed = ((startSeed.value + i * seedStep.value) >>> 0)
    const shuffled = seededShuffle(arr, seed, lcgShift.value)
    points.push({ x: i, y: shuffled.indexOf(0) })
  }
  return points
})
</script>

<template>
  <header>
    <h1>LCG Shuffle Explorer</h1>
    <p class="subtitle">Probe the seeded Fisher-Yates shuffle across the 32-bit seed space (Knuth LCG constants)</p>
  </header>

  <div class="controls">
    <div class="control-group">
      <label>N — array size</label>
      <input type="range" min="8" max="52" step="1" v-model.number="N" />
      <span class="control-value">{{ N }}</span>
    </div>
    <div class="control-group">
      <label>K — seed count</label>
      <input type="range" min="500" max="20000" step="500" v-model.number="K" />
      <span class="control-value">{{ K.toLocaleString() }}</span>
    </div>
    <div class="control-group">
      <label>Seed MSB nibble</label>
      <input type="range" min="0" max="15" step="1" v-model.number="seedMsb" />
      <span class="control-value">{{ seedMsb }}</span>
    </div>
    <div class="control-group">
      <label>Seed LSB nibble</label>
      <input type="range" min="0" max="15" step="1" v-model.number="seedLsb" />
      <span class="control-value">{{ seedLsb }}</span>
    </div>
    <div class="control-group">
      <label>Seed step</label>
      <input type="range" min="1" max="15" step="1" v-model.number="seedStep" />
      <span class="control-value">{{ seedStep }}</span>
    </div>
    <div class="control-group">
      <label>Start seed</label>
      <span class="control-value seed-hex">0x{{ startSeed.toString(16).toUpperCase().padStart(8, '0') }}</span>
    </div>
    <div class="control-group">
      <label>LCG bit shift</label>
      <input type="range" min="0" max="31" step="1" v-model.number="lcgShift" />
      <span class="control-value">{{ lcgShift }}</span>
    </div>
  </div>

  <div class="charts">
    <div class="chart-card">
      <div class="chart-title">Position Heatmap — item i → slot j frequency</div>
      <Heatmap :matrix="heatmapMatrix" :n="N" :k="K" />
    </div>
    <div class="chart-card">
      <div class="chart-title">Scatter — where does item 0 land per seed?</div>
      <Scatter :points="scatterPoints" :n="N" :k="K" />
    </div>
  </div>
</template>
