<template>
	<PositionedElement
		:layer="LAYER.FIRING_ARC_LINES"
		:x="firingSolution.resolvedVectorTo.x"
		:y="firingSolution.resolvedVectorTo.y"
	>
		<svg
			class="FiringArc__svg"
			xmlns="http://www.w3.org/2000/svg"
			preserve-aspect-ratio="none"
		>
			<path
				:d="`M ${0} ${0} C ${elevationOffset.x} ${elevationOffset.y}, ${
					lineVector.x + elevationOffset.x
				} ${lineVector.y + elevationOffset.y}, ${lineVector.x} ${lineVector.y}`"
			/>
		</svg>
	</PositionedElement>
	<PositionedElement
		:layer="LAYER.FIRING_ARC_LABELS"
		:x="labelPosition.x"
		:y="labelPosition.y"
		cancel-viewport-rotation
	>
		<div class="FiringArc__label">
			<div class="FiringArc__label-row">
				<span class="FiringArc__span">
					{{ getUnitLabel(artillery.unitMap.value, unitIdFrom) }} ->
					{{ getUnitLabel(artillery.unitMap.value, unitIdTo) }}
				</span>
			</div>
			<div class="FiringArc__label-row">
				<span>distance:</span>
				<span>{{ Math.round(firingSolution.firingVectorWithWind.distance) }}m</span>
			</div>
			<div class="FiringArc__label-row">
				<span>azimuth:</span
				><span>{{ firingSolution.firingVectorWithWind.azimuth.toFixed(1) }}°</span>
			</div>
		</div>
	</PositionedElement>
</template>

<style lang="scss">
	@keyframes FiringArc__dash {
		from {
			stroke-dashoffset: var(--_line-segment-size);
		}
		to {
			stroke-dashoffset: 0;
		}
	}

	.FiringArc__svg {
		position: absolute;
		left: 0;
		top: 0;
		/*
		width: 0;
		height: 0;
		*/

		overflow: visible;

		--_line-dash-size: 2em;
		--_line-gap-size: 0.5em;
		--_line-segment-size: calc(var(--_line-dash-size) + var(--_line-gap-size));

		stroke: currentColor;
		stroke-width: 0.2em;
		stroke-dasharray: var(--_line-dash-size) var(--_line-gap-size);
		animation: FiringArc__dash 1s linear infinite;
		fill: transparent;
		filter: url(#outline);

		pointer-events: none;
	}

	.FiringArc__label {
		position: absolute;
		left: 0;
		top: 0;
		transform: translate(-50%, -50%);
		transform-origin: 50% 50%;

		padding: 0.5em;
		gap: 0.5em;

		display: grid;
		grid-template-columns: repeat(2, max-content);
		grid-auto-rows: min-content;

		background: var(--color-primary-contrast);
		border: 1px solid;

		pointer-events: none;
		user-select: none;

		.FiringArc__label-row {
			grid-column: 1 / -1;

			display: grid;
			grid-template-columns: subgrid;
			grid-template-rows: subgrid;
			justify-items: end;
		}

		.FiringArc__span {
			grid-column: 1 / -1;
		}
	}
</style>

<script setup lang="ts">
	import PositionedElement from '@/components/Viewport/PositionedElement.vue';
	import { LAYER } from '@/lib/constants/ui';
	import { getFiringSolution } from '@/lib/firing-calculations';
	import { artillery } from '@/lib/globals';
	import { getUnitLabel } from '@/lib/unit';
	import { Vector } from '@/lib/vector';
	import { computed } from 'vue';

	const props = defineProps<{
		unitIdFrom: string;
		unitIdTo: string;
	}>();

	const firingSolution = computed(() =>
		getFiringSolution(
			artillery.unitMap.value,
			props.unitIdFrom,
			props.unitIdTo,
			artillery.wind.value
		)
	);

	const lineVector = computed(() =>
		firingSolution.value.firingVector.scale(
			-artillery.viewport.value.resolvedZoom
		)
	);
	const elevationOffset = computed(() =>
		Vector.fromAngularVector({
			azimuth: artillery.viewport.value.rotation,
			distance: lineVector.value.distance / 2,
		})
	);
	const labelPosition = computed(() =>
		firingSolution.value.resolvedVectorFrom
			.addVector(firingSolution.value.resolvedVectorTo)
			.scale(0.5)
			.addVector(
				elevationOffset.value.scale(
					0.75 / artillery.viewport.value.resolvedZoom
				)
			)
	);
</script>
