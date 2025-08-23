<template>
	<PositionedElement
		:layer="LAYER.FIRING_ARC_LINES"
		:x="resolvedVectorTo.x"
		:y="resolvedVectorTo.y"
	>
		<svg
			class="FiringArc__svg"
			xmlns="http://www.w3.org/2000/svg"
			:class="{
				'FiringArc__svg--primary': props.isPrimary,
			}"
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
		v-if="!props.hideLabel"
		:layer="LAYER.FIRING_ARC_LABELS"
		:x="labelPosition.x"
		:y="labelPosition.y"
		cancel-viewport-rotation
	>
		<div
			class="FiringArc__label"
			:style="{ opacity: settings.firingArcOpacity }"
		>
			<div class="FiringArc__label-row">
				<span>
					{{ getUnitLabel(artillery.unitMap.value, unitIdFrom) }} ->
					{{ getUnitLabel(artillery.unitMap.value, unitIdTo) }}
				</span>
			</div>
			<div class="FiringArc__label-row">
				<span>distance:</span>
				<span>{{ Math.round(firingVectorWithWind.distance) }}m</span>
			</div>
			<div class="FiringArc__label-row">
				<span>azimuth:</span
				><span>{{ firingVectorWithWind.azimuth.toFixed(1) }}°</span>
			</div>
		</div>
	</PositionedElement>
	<template v-if="specs">
		<RangeFinder
			v-if="settings.showMinMaxSpread"
			:position="resolvedVectorTo"
			:outer-radius="specs.MIN_SPREAD"
			:style="RangeFinderStyle.Transparent"
		/>
		<RangeFinder
			v-if="currentSpread != null"
			:position="resolvedVectorTo"
			:outer-radius="currentSpread"
			:style="RangeFinderStyle.Spread"
		/>
		<RangeFinder
			v-if="settings.showMinMaxSpread"
			:position="resolvedVectorTo"
			:outer-radius="specs.MAX_SPREAD"
			:style="RangeFinderStyle.Transparent"
		/>
	</template>
</template>

<style lang="scss">
	@keyframes FiringArc__dash {
		from {
			stroke-dashoffset: 0;
		}
		to {
			stroke-dashoffset: var(--_line-segment-size);
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

		stroke: var(--color-primary-contrast);
		stroke-width: 0.2em;
		stroke-dasharray: var(--_line-dash-size) var(--_line-gap-size);
		animation: FiringArc__dash 1s linear infinite;
		fill: transparent;
		filter: url(#outline);

		pointer-events: none;

		&--primary {
			stroke: var(--color-primary);
		}
	}

	.FiringArc__label {
		position: absolute;
		left: 0;
		top: 0;
		transform: translate(-50%, -50%);
		transform-origin: 50% 50%;

		padding: 0.25em;
		gap: 0.1em;

		display: grid;
		grid-template-columns: repeat(2, max-content);
		grid-auto-rows: min-content;

		background: var(--color-primary-contrast);
		border: 1px solid;
    border-radius: 0.3em;

    font-size:  calc((16px + 2vmin) / 2);

    line-height: 100%;

		pointer-events: none;
		user-select: none;

		.FiringArc__label-row {
			grid-column: 1 / -1;

      display: flex;
      gap: 0.5em;

      margin: auto;
		}

		.FiringArc__span {
      margin: auto;
		}
	}
</style>

<script setup lang="ts">
	import PositionedElement from '@/components/Viewport/PositionedElement.vue';
	import { RangeFinderStyle } from '@/components/Viewport/RangeFinders/enums';
	import RangeFinder from '@/components/Viewport/RangeFinders/RangeFinder.vue';
	import { LAYER } from '@/lib/constants/ui';
	import { artillery } from '@/lib/globals';
	import { settings } from '@/lib/settings';
	import {
		getUnitLabel,
		getUnitResolvedVector,
		getUnitSpecs,
	} from '@/lib/unit';
	import { Vector } from '@/lib/vector';
	import { computed } from 'vue';

	const props = defineProps<{
		unitIdFrom: string;
		unitIdTo: string;
		hideLabel?: boolean;
		isPrimary?: boolean;
	}>();

	const resolvedVectorFrom = computed(() =>
		getUnitResolvedVector(artillery.unitMap.value, props.unitIdFrom)
	);
	const resolvedVectorTo = computed(() =>
		getUnitResolvedVector(artillery.unitMap.value, props.unitIdTo)
	);
	const firingVector = computed(() =>
		resolvedVectorFrom.value.getRelativeOffset(resolvedVectorTo.value)
	);
	const firingVectorWithWind = computed(() => {
		let firingVectorWithWind = firingVector.value.clone();
		const specs = getUnitSpecs(artillery.unitMap.value, props.unitIdFrom);
		if (specs) {
			firingVectorWithWind = firingVectorWithWind.addVector(
				artillery.wind.value.scale(-specs.WIND_OFFSET)
			);
		}
		return firingVectorWithWind;
	});

	const lineVector = computed(() =>
		firingVector.value.scale(-artillery.viewport.value.resolvedZoom)
	);
	const elevationOffset = computed(() =>
		Vector.fromAngularVector({
			azimuth: -artillery.viewport.value.rotation,
			distance: lineVector.value.distance / 2,
		})
	);
	const labelPosition = computed(() =>
		resolvedVectorFrom.value
			.addVector(resolvedVectorTo.value)
			.scale(0.5)
			.addVector(
				elevationOffset.value.scale(
					0.75 / artillery.viewport.value.resolvedZoom
				)
			)
	);

	const specs = computed(() =>
		getUnitSpecs(artillery.unitMap.value, props.unitIdFrom)
	);

	const currentSpread = computed(() => {
		if (specs.value == null || specs.value.MAX_RANGE === 0) return null;
		const clampedFiringDistance = Math.min(
			specs.value.MAX_RANGE,
			Math.max(specs.value.MIN_RANGE, firingVectorWithWind.value.distance)
		);
		const spreadPercent =
			(clampedFiringDistance - specs.value.MIN_RANGE) /
			(specs.value.MAX_RANGE - specs.value.MIN_RANGE);

		return (
			specs.value.MIN_SPREAD +
			(specs.value.MAX_SPREAD - specs.value.MIN_SPREAD) * spreadPercent
		);
	});
</script>
