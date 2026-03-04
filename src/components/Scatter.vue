<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import * as d3 from 'd3'

const props = defineProps<{
  points: Array<{ x: number; y: number }>
  n: number
  k: number
}>()

const svgRef = ref<SVGSVGElement | null>(null)
const tooltipRef = ref<HTMLDivElement | null>(null)

const MARGIN = { top: 16, right: 16, bottom: 36, left: 44 }
const W = 540
const H = 300

function render() {
  const svg = d3.select(svgRef.value)
  if (!svgRef.value || props.points.length === 0) return

  const innerW = W - MARGIN.left - MARGIN.right
  const innerH = H - MARGIN.top - MARGIN.bottom

  svg.attr('width', W).attr('height', H)
  svg.selectAll('*').remove()

  const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)

  const xScale = d3.scaleLinear().domain([0, props.k - 1]).range([0, innerW])
  const yScale = d3.scaleLinear().domain([0, props.n - 1]).range([innerH, 0])

  // Axes
  const xAxis = d3.axisBottom<number>(xScale).ticks(6).tickSizeOuter(0)
  const yAxis = d3.axisLeft<number>(yScale).ticks(6).tickSizeOuter(0)

  g.append('g')
    .attr('transform', `translate(0,${innerH})`)
    .call(xAxis)
    .call(ax => ax.select('.domain').attr('stroke', '#333'))
    .call(ax => ax.selectAll('.tick line').attr('stroke', '#333'))

  g.append('g')
    .call(yAxis)
    .call(ax => ax.select('.domain').attr('stroke', '#333'))
    .call(ax => ax.selectAll('.tick line').attr('stroke', '#333'))

  // Axis labels
  g.append('text')
    .attr('x', innerW / 2)
    .attr('y', innerH + 30)
    .attr('text-anchor', 'middle')
    .text('seed index')

  g.append('text')
    .attr('x', -innerH / 2)
    .attr('y', -32)
    .attr('text-anchor', 'middle')
    .attr('transform', 'rotate(-90)')
    .text('position of item 0')

  const tooltip = d3.select(tooltipRef.value)

  // Dots — use small radius, semi-transparent for overplotting
  const r = props.points.length > 3000 ? 1 : 1.5

  g.append('g')
    .selectAll<SVGCircleElement, { x: number; y: number }>('circle')
    .data(props.points)
    .join('circle')
    .attr('cx', d => xScale(d.x))
    .attr('cy', d => yScale(d.y))
    .attr('r', r)
    .attr('fill', '#4f8ef7')
    .attr('opacity', 0.45)
    .on('mousemove', (event: MouseEvent, d) => {
      tooltip
        .text(`seed index: ${d.x}, position: ${d.y}`)
        .classed('visible', true)
        .style('left', `${event.clientX + 14}px`)
        .style('top', `${event.clientY - 28}px`)
    })
    .on('mouseleave', () => {
      tooltip.classed('visible', false)
    })
}

onMounted(render)
watch(() => [props.points, props.n, props.k], render, { deep: true })
</script>

<template>
  <div style="position: relative">
    <svg ref="svgRef" />
    <div ref="tooltipRef" class="tooltip" />
  </div>
</template>
