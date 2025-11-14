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
					{{
						getUnitLabel(
							artillery.sharedState.currentState.value.unitMap,
							unitIdFrom
						)
					}}
					->
					{{
						getUnitLabel(
							artillery.sharedState.currentState.value.unitMap,
							unitIdTo
						)
					}}
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
	<template v-if="specs && settings.spreadMode !== SpreadMode.None">
		<template v-if="settings.spreadMode === SpreadMode.Circular">
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
		<PositionedElement
			v-else-if="specs && settings.spreadMode === SpreadMode.Detailed"
			:x="resolvedVectorTo.x"
			:y="resolvedVectorTo.y"
			:layer="LAYER.RANGE_FINDERS"
		>
			<FragmentShader
				class="FiringArc__spread"
				:style="{
					'--_current-spread':
						(currentSpread ?? specs.MIN_SPREAD) *
						artillery.viewport.value.resolvedZoom,
					'--_max-spread':
						specs.MAX_SPREAD * artillery.viewport.value.resolvedZoom,
					'--_min-spread':
						specs.MIN_SPREAD * artillery.viewport.value.resolvedZoom,
				}"
				:uniforms="
					(gl, shaderProgram) => {
						const windVector = Vector.fromAngularVector(
							artillery.sharedState.currentState.value.wind
						).scale(specs!.WIND_OFFSET_PER_METER);

						gl.uniform1f(
							gl.getUniformLocation(shaderProgram, 'resolvedZoom'),
							artillery.viewport.value.resolvedZoom
						);
						gl.uniform1f(
							gl.getUniformLocation(shaderProgram, 'maxSpread'),
							specs!.MAX_SPREAD
						);
						gl.uniform1f(
							gl.getUniformLocation(shaderProgram, 'minSpread'),
							specs!.MIN_SPREAD
						);
						gl.uniform1f(
							gl.getUniformLocation(shaderProgram, 'maxRange'),
							specs!.MAX_RANGE
						);
						gl.uniform1f(
							gl.getUniformLocation(shaderProgram, 'minRange'),
							specs!.MIN_RANGE
						);
						gl.uniform1f(
							gl.getUniformLocation(shaderProgram, 'firingDistance'),
							firingVectorWithWind.distance
						);
						gl.uniform1f(
							gl.getUniformLocation(shaderProgram, 'firingAzimuth'),
							toRadians(firingVectorWithWind.azimuth)
						);
						gl.uniform2f(
							gl.getUniformLocation(shaderProgram, 'firingVector'),
							firingVectorWithWind.x,
							-firingVectorWithWind.y
						);
						gl.uniform1f(
							gl.getUniformLocation(shaderProgram, 'windOffset'),
							windVector.distance
						);
						gl.uniform1f(
							gl.getUniformLocation(shaderProgram, 'windAzimuth'),
							toRadians(windVector.azimuth)
						);
						gl.uniform2f(
							gl.getUniformLocation(shaderProgram, 'windVector'),
							windVector.x,
							-windVector.y
						);
						gl.uniform1f(
							gl.getUniformLocation(shaderProgram, 'windPerMeter'),
							artillery.sharedState.currentState.value.wind.distance *
								specs!.WIND_OFFSET_PER_METER
						);
					}
				"
				:fragment-shader-source="`
					precision highp float;

					uniform float resolvedZoom;
					uniform float maxSpread;
					uniform float minSpread;
					uniform float maxRange;
					uniform float minRange;
					uniform float firingDistance;
					uniform float firingAzimuth;
					uniform vec2 firingVector;
					uniform float windOffset;
					uniform float windAzimuth;
					uniform vec2 windVector;
					uniform float windPerMeter;

					uniform ivec2 iResolution;
					uniform vec2 scaleFactor;

					float sdCircle( vec2 p, float r )
					{
						return length(p) - r;
					}

					void main() {
						vec2 p = (gl_FragCoord.xy - vec2(iResolution) / 2.0) / resolvedZoom / scaleFactor;
						vec2 uv = gl_FragCoord.xy / vec2(iResolution) / scaleFactor;

						float distanceToGun = length(p + firingVector) - length(firingVector);
						float windMagnitude = distanceToGun * windPerMeter;
						vec2 normalisedWind = length(windVector) > 0.0 ? normalize(windVector) : windVector;
						vec2 windOffsetVector = normalisedWind * windMagnitude;

						// float firingPercentage = (clamp(firingDistance, minRange, maxRange) - minRange) / (maxRange - minRange);
						float firingPercentage = (firingDistance - minRange) / (maxRange - minRange);
						float currentSpread = firingPercentage * (maxSpread - minSpread) + minSpread;

						float minSpreadDistance = sdCircle(p - windOffsetVector, minSpread);
						float maxSpreadDistance = sdCircle(p - windOffsetVector, maxSpread);
						float currentSpreadDistance = sdCircle(p - windOffsetVector, currentSpread);

						if (abs(minSpreadDistance) < 0.5) {
							gl_FragColor = vec4(0.0, 0.0, 0.0, 0.8);
							return;
						}
						if (abs(maxSpreadDistance) < 0.5) {
							gl_FragColor = vec4(0.0, 0.0, 0.0, 0.8);
							return;
						}

						gl_FragColor = vec4(currentSpreadDistance < 0.0 ? vec3(${[249, 115, 22].map((c) => (c / 255).toFixed(3)).join(', ')}) : vec3(0.0, 0.0, 0.0), maxSpreadDistance < 0.0 ? 0.5 : 0.0);
					}
				`"
			/>
		</PositionedElement>
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
		filter: url(#outline-black);

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

		font-size: calc((16px + 2vmin) / 2);

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

	.FiringArc__spread {
		position: absolute;
		top: 0;
		left: 0;
		width: calc(var(--_max-spread) * 6px);
		height: calc(var(--_max-spread) * 6px);
		overflow: visible;
		transform: translate(-50%, -50%);
	}
</style>

<script setup lang="ts">
	import { computed } from 'vue';
	import { toRadians } from '@packages/data/dist/artillery/angle';
	import { Vector } from '@packages/data/dist/artillery/vector';
	import FragmentShader from '@/components/FragmentShader.vue';
	import PositionedElement from '@/components/Viewport/PositionedElement.vue';
	import { RangeFinderStyle } from '@/components/Viewport/RangeFinders/enums';
	import RangeFinder from '@/components/Viewport/RangeFinders/RangeFinder.vue';
	import { LAYER } from '@/lib/constants/ui';
	import { artillery } from '@/lib/globals';
	import { settings, SpreadMode } from '@/lib/settings';
	import {
		getUnitLabel,
		getUnitResolvedVector,
		getUnitSpecs,
	} from '@/lib/unit';

	const props = defineProps<{
		unitIdFrom: string;
		unitIdTo: string;
		hideLabel?: boolean;
		isPrimary?: boolean;
	}>();

	const resolvedVectorFrom = computed(() =>
		getUnitResolvedVector(
			artillery.sharedState.currentState.value.unitMap,
			props.unitIdFrom
		)
	);
	const resolvedVectorTo = computed(() =>
		getUnitResolvedVector(
			artillery.sharedState.currentState.value.unitMap,
			props.unitIdTo
		)
	);
	const firingVector = computed(() =>
		resolvedVectorFrom.value.getRelativeOffset(resolvedVectorTo.value)
	);
	const firingVectorWithWind = computed(() =>
		firingVector.value.addVector(
			artillery.getWindOffset(props.unitIdFrom, firingVector.value.distance).scale(-1)
		)
	);

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
		getUnitSpecs(
			artillery.sharedState.currentState.value.unitMap,
			props.unitIdFrom
		)
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
