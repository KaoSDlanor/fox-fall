<template>
	<div
		class="PositionedElement__container"
		:style="{
			'--layer': props.layer,
			'--positioned-x': props.x,
			'--positioned-y': props.y,
			'--positioned-rotation': props.rotation,
			'--viewport-rotation': cancelViewportRotation ? artillery.viewport.value.rotation : 0,
			'--viewport-zoom': artillery.viewport.value.resolvedZoom,
		}"
	>
		<slot />
	</div>
</template>

<style lang="scss">
	.PositionedElement__container {
		position: absolute;
		left: 0;
		top: 0;
		width: 0;
		height: 0;
		overflow: visible;
		z-index: var(--layer);

		transform-origin: 50% 50%;
		transform: translate(calc(var(--positioned-x) * 1px), calc(var(--positioned-y) * 1px)) rotate(calc((var(--positioned-rotation) * 1deg) + (var(--viewport-rotation) * -1deg)))
			scale(calc(1 / var(--viewport-zoom)));
	}
</style>

<script setup lang="ts">
	import type { LAYER } from '@/lib/constants/ui';
	import { artillery } from '@/lib/globals';

	const props = withDefaults(
		defineProps<{
			layer: LAYER;
			x: number;
			y: number;
			cancelViewportRotation?: boolean;
			rotation?: number;
		}>(),
		{
			rotation: 0,
		}
	);
</script>
