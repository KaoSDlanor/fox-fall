<template>
	<PositionedElement
		:x="position.x"
		:y="position.y"
		:layer="LAYER.RANGE_FINDERS"
	>
		<FragmentShader
			class="DetailedRangeFinder__canvas"
			:style="{
				'--outer-radius':
					props.outerRadius * artillery.viewport.value.resolvedZoom,
				'--inner-radius':
					props.innerRadius * artillery.viewport.value.resolvedZoom,
			}"
			:uniforms="
				(gl, shaderProgram) => {
					gl.uniform1f(
						gl.getUniformLocation(shaderProgram, 'resolvedZoom'),
						artillery.viewport.value.resolvedZoom
					);
					gl.uniform1f(
						gl.getUniformLocation(shaderProgram, 'outerRadius'),
						props.outerRadius
					);
					gl.uniform1f(
						gl.getUniformLocation(shaderProgram, 'innerRadius'),
						props.innerRadius
					);
					gl.uniform2f(
						gl.getUniformLocation(shaderProgram, 'windVector'),
						Vector.fromAngularVector(
							artillery.sharedState.currentState.value.wind
						).x,
						-Vector.fromAngularVector(
							artillery.sharedState.currentState.value.wind
						).y
					);
					gl.uniform1f(
						gl.getUniformLocation(shaderProgram, 'windPerMeter'),
						props.windPerMeter ?? 0.0
					);
				}
			"
			:fragment-shader-source="`
				precision highp float;

				uniform float resolvedZoom;
				uniform float outerRadius;
				uniform float innerRadius;
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

					float windMagnitude = length(p) * windPerMeter;
					vec2 normalisedWind = length(windVector) > 0.0 ? normalize(windVector) : windVector;
					vec2 windOffsetVector = normalisedWind * windMagnitude;

					float outerDistance = sdCircle(p - windOffsetVector, outerRadius);
					float innerDistance = sdCircle(p - windOffsetVector, innerRadius);
					if (abs(outerDistance) < 0.5 || abs(innerDistance) < 0.5) {
						gl_FragColor = vec4(0.0, 0.0, 0.0, 0.8);
						return;
					}

					gl_FragColor = vec4(${color}, outerDistance < 0.0 && innerDistance > 0.0 ? 0.5 : 0.0);
				}
			`"
		/>
	</PositionedElement>
</template>

<style lang="scss">
	.DetailedRangeFinder__indicator {
		position: absolute;
		inset: 0;
		overflow: visible;

		fill: none;
		stroke: black;
		stroke-width: 2px;
		opacity: 0.25;

		&.DetailedRangeFinder__artillery {
			fill: var(--p-red-500);
		}
		&.DetailedRangeFinder__spotter {
			fill: var(--p-blue-500);
		}
		&.DetailedRangeFinder__spread {
			fill: var(--p-orange-500);
		}
	}

	.DetailedRangeFinder__canvas {
		position: absolute;
		top: 0;
		left: 0;
		width: calc(var(--outer-radius) * 6px);
		height: calc(var(--outer-radius) * 6px);
		overflow: visible;
		transform: translate(-50%, -50%);
	}
</style>

<script setup lang="ts">
	import { Vector } from '@packages/data/dist/artillery/vector';
	import FragmentShader from '@/components/FragmentShader.vue';
	import PositionedElement from '@/components/Viewport/PositionedElement.vue';
	import { LAYER } from '@/lib/constants/ui';
	import { artillery } from '@/lib/globals';
	import { RangeFinderStyle } from './enums';
	import { computed } from 'vue';

	const props = withDefaults(
		defineProps<{
			style: RangeFinderStyle;
			position: Vector;
			outerRadius: number;
			innerRadius?: number;
			windPerMeter?: number;
		}>(),
		{
			innerRadius: 0,
		}
	);

	const color = computed(() => {
		switch (props.style) {
			case RangeFinderStyle.Spread:
				return [249, 115, 22].map((c) => (c / 255).toFixed(3)).join(', ');
			case RangeFinderStyle.Spotting:
				return [59, 130, 246].map((c) => (c / 255).toFixed(3)).join(', ');
			case RangeFinderStyle.Artillery:
				return [239, 68, 68].map((c) => (c / 255).toFixed(3)).join(', ');
			case RangeFinderStyle.Transparent:
				return [0, 0, 0].map((c) => (c / 255).toFixed(3)).join(', ');
		}
	});
</script>
