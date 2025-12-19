<template>
	<PositionedElement
		:x="position.x"
		:y="position.y"
		:layer="LAYER.RANGE_FINDERS"
	>
		<svg
			class="RangeFinder__indicator"
			:class="{
				RangeFinder__spread: props.style === RangeFinderStyle.Spread,
				RangeFinder__spotter: props.style === RangeFinderStyle.Spotting,
				RangeFinder__artillery: props.style === RangeFinderStyle.Artillery,
			}"
			xmlns="http://www.w3.org/2000/svg"
			preserve-aspect-ratio="none"
		>
			<Disk
				:outerRadius="props.outerRadius * artillery.viewport.value.resolvedZoom"
				:innerRadius="props.innerRadius * artillery.viewport.value.resolvedZoom"
			/>
		</svg>
	</PositionedElement>
</template>

<style lang="scss">
	.RangeFinder__indicator {
		position: absolute;
		inset: 0;
		overflow: visible;

		fill: none;
		stroke: black;
		stroke-width: 2px;
		opacity: 0.25;

		&.RangeFinder__artillery {
			fill: var(--p-red-500);
		}
		&.RangeFinder__spotter {
			fill: var(--p-blue-500);
		}
		&.RangeFinder__spread {
			fill: var(--p-orange-500);
		}
	}
</style>

<script setup lang="ts">
	import { Vector } from '@packages/data/dist/artillery/vector';
	import Disk from '@/components/svg/Disk.vue';
	import PositionedElement from '@/components/Viewport/PositionedElement.vue';
	import { LAYER } from '@/lib/constants/ui';
	import { artillery } from '@/lib/globals';
	import { RangeFinderStyle } from './enums';

	const props = withDefaults(
		defineProps<{
			style: RangeFinderStyle;
			position: Vector;
			outerRadius: number;
			innerRadius?: number;
		}>(),
		{
			innerRadius: 0,
		}
	);
</script>
