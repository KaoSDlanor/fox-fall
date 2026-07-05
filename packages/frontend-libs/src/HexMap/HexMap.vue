<template>
	<div
		class="HexMap__outer"
		:style="{
			'--hex-size': `${HEX_SIZE.width}px`,
			'--viewport-rotation': `${viewport.rotation}deg`,
		}"
	>
		<div class="HexMap__container">
			<div
				class="HexMap__row"
				:class="{
					'HexMap__row--even': y % 2 === 0,
					'HexMap__row--odd': y % 2 !== 0,
				}"
				v-for="(row, y) in HEX_POSITIONS"
				:key="y"
			>
				<div
					class="HexMap__hex"
					:class="{ 'HexMap__hex--blank': !hex }"
					v-for="(hex, x) in row"
					:key="x"
				>
					<img class="HexMap__hex-image" v-if="hex && hexAssets" :src="hexAssets[hex]" />
					<div
						class="HexMap__hex-label"
						v-show="viewport.resolvedZoom <= 0.1"
					>
						{{ hex }}
					</div>
					<slot v-if="hex" name="hex" :hex="hex" :x="x" :y="y" />
				</div>
			</div>
			<div class="HexMap__row"></div>
		</div>
	</div>
</template>

<style lang="scss">
	.HexMap__outer {
		display: grid;
		pointer-events: none;
	}

	.HexMap__container {
		display: grid;
		grid-template-columns: max-content;
		grid-auto-rows: max-content;
		grid-auto-flow: row;

		transform-origin: 50% 50%;
		transform-box: fill-box;
		transform: translate(-50%, -50%);
	}

	.HexMap__row {
		display: grid;
		grid-template-rows: max-content;
		grid-auto-columns: max-content;
		grid-auto-flow: column;
		gap: calc(var(--hex-size) / 2);
		height: calc(var(--hex-size) * 0.866 / 2);
	}

	.HexMap__row--odd {
		transform: translateX(calc(var(--hex-size) * 0.75));
	}

	.HexMap__hex {
		position: relative;
		width: var(--hex-size);
		height: calc(var(--hex-size) * 0.866);
		flex: 0 0 auto;
		overflow: hidden;
	}

	.HexMap__hex--blank {
		visibility: hidden;
	}

	.HexMap__hex-image {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		filter: url(#outline-black-inset);
	}

	.HexMap__hex-label {
		position: absolute;
		top: 50%;
		left: 50%;
		transform-origin: 50% 50%;
		transform: translate(-50%, -50%) rotate(calc(var(--viewport-rotation) * -1));
		text-align: center;
		font-size: 12px;
		font-weight: bold;
		color: #fff;
		filter: url(#outline-black);
	}
</style>

<script setup lang="ts">
	import { HEX_SIZE } from '@packages/data/dist/artillery/map';
	import { shallowRef, watch } from "vue";
	import { HEX_MAPS, MapSource } from "@/assets/images/hex-maps";
	import { Hex, HEX_POSITIONS } from "@packages/data/dist/hex-map";
	import { injectViewport } from '@/viewport/viewport';

	const viewport = injectViewport();

	const props = defineProps<{
			mapSource?: MapSource;
		}>();

	const hexAssets = shallowRef<Record<Hex, string> | null>(null);

	watch(() => props.mapSource, async (newMapSource) => {
		const newAssets = await (newMapSource && HEX_MAPS[newMapSource] || HEX_MAPS[MapSource.Vanilla])();
		if (newMapSource === props.mapSource) {
			hexAssets.value = newAssets;
		}
	}, { immediate: true });
</script>
