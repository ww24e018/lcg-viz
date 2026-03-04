<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import * as d3 from 'd3'

const props = defineProps<{
  matrix: number[][]
  n: number
  k: number
}>()

const svgRef = ref<SVGSVGElement | null>(null)
const tooltipRef = ref<HTMLDivElement | null>(null)

const MARGIN = { top: 10, right: 10, bottom: 10, left: 10 }
const MAX_SIZE = 520

function render() {
  const svg = d3.select(svgRef.value)
  if (!svgRef.value || props.matrix.length === 0) return

  const n = props.n
  const cellSize = Math.floor((MAX_SIZE - MARGIN.left - MARGIN.right) / n)
  const size = cellSize * n
  const totalW = size + MARGIN.left + MARGIN.right
  const totalH = size + MARGIN.top + MARGIN.bottom

  svg.attr('width', totalW).attr('height', totalH)
  svg.selectAll('*').remove()

  const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)

  const flat = props.matrix.flat()
  const maxVal = d3.max(flat) ?? 1
  const minVal = d3.min(flat) ?? 0

  const color = d3.scaleSequential(d3.interpolateYlGnBu).domain([minVal, maxVal])

  const tooltip = d3.select(tooltipRef.value)

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const count = props.matrix[i]?.[j] ?? 0
      g.append('rect')
        .attr('x', j * cellSize)
        .attr('y', i * cellSize)
        .attr('width', cellSize - 1)
        .attr('height', cellSize - 1)
        .attr('fill', color(count))
        .on('mousemove', (event: MouseEvent) => {
          tooltip
            .text(`item ${i} → slot ${j}: ${count}×`)
            .classed('visible', true)
            .style('left', `${event.clientX + 14}px`)
            .style('top', `${event.clientY - 28}px`)
        })
        .on('mouseleave', () => {
          tooltip.classed('visible', false)
        })
    }
  }
}

onMounted(render)
watch(() => [props.matrix, props.n, props.k], render, { deep: true })
</script>

<template>
  <div style="position: relative; display: inline-block">
    <svg ref="svgRef" />
    <div ref="tooltipRef" class="tooltip" />
  </div>
</template>
