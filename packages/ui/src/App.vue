<template>
	<BitmapDisplay
		v-show="
			!viewportControl.calibrating.value &&
			!viewportControl.screenShotting.value
		"
		class="App__screen-canvas"
		:style="{
			opacity: settings.screenshotOpacity,
		}"
		:image="viewportControl.screenShot.value"
	/>

	<div
		ref="containerElement"
		class="App__container"
		:class="{
			App__transparent: isTransparent,
			App__screenshot: viewportControl.screenShotting.value,
		}"
		@touchstart.prevent
		@pointerdown.stop="($event.target as HTMLDivElement).focus()"
		@pointermove="onPointerMove"
		@contextmenu.prevent="onContextMenu"
		tabindex="-1"
	>
		<template
			v-if="
				!viewportControl.calibrating.value &&
				!viewportControl.screenShotting.value
			"
		>
			<Grid @contextMenu="onContextMenu" />

			<Viewport />

			<OverlayHud />

			<ContextMenu
				ref="contextMenu"
				:model="contextMenuOptions"
				@hide="() => (contextMenuPosition = null)"
			/>
		</template>

		<svg>
			<defs>
				<filter id="outline">
					<feMorphology
						in="SourceGraphic"
						result="DILATED"
						operator="dilate"
						radius="1"
					/>
					<feColorMatrix
						in="DILATED"
						result="OUTLINED"
						type="matrix"
						values="
						-1 0  0  0 0
						0  -1 0  0 0
						0  0  -1 0 0
						0  0  0  1 0
					"
					/>

					<feMerge>
						<feMergeNode in="OUTLINED" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
			</defs>
		</svg>
	</div>
</template>

<style lang="scss">
	.App__container {
		contain: content;
		position: fixed;
		left: 0;
		top: 0;
		width: 100dvw;
		height: 100dvh;
		font-size: 2vmin;

		color: var(--color-primary);
		outline: none;

		&:not(.App__transparent) {
			background-color: var(--color-primary-contrast);
		}

		&.App__screenshot {
			cursor: none;
		}
	}
	.App__screen-canvas {
		contain: content;
		position: fixed;
		left: 0;
		top: 0;
		width: 100dvw;
		height: 100dvh;
	}
</style>

<script setup lang="ts">
	import ContextMenu from 'primevue/contextmenu';
	import type { MenuItem } from 'primevue/menuitem';
	import { computed, ref } from 'vue';
	import Grid from '@/components/Grid.vue';
	import OverlayHud from '@/components/OverlayHud/OverlayHud.vue';
	import BitmapDisplay from '@/components/BitmapDisplay.vue';
	import Viewport from '@/components/Viewport/Viewport.vue';
	import { artillery, containerElement, viewportControl } from '@/lib/globals';
	import { settings } from '@/lib/settings';
	import { getUnitResolvedVector, UnitType } from '@/lib/unit';
	import { Vector } from '@/lib/vector';

	const contextMenu = ref<null | InstanceType<typeof ContextMenu>>(null);

	const onPointerMove = (event: PointerEvent) => {
		artillery.cursor.value.cartesianVector = {
			x: event.clientX - artillery.viewport.value.viewportSize.x / 2,
			y: event.clientY - artillery.viewport.value.viewportSize.y / 2,
		};
	};

	const contextMenuPosition = ref<Vector | null>(null);
	const onContextMenu = (event: MouseEvent) => {
		if (artillery.unitSelector.value != null) {
			event.preventDefault();
			event.stopPropagation();
			artillery.unitSelector.value.selectUnit(null);
		} else if (!viewportControl.canRotate.value) {
			contextMenuPosition.value = artillery.cursor.value.clone();
			contextMenu.value?.show(event);
		}
	};
	const contextMenuOptions = computed(() => {
		const output: MenuItem[] = [
			{
				label:
					artillery.selectedUnits.value.length > 0
						? 'Add standalone unit'
						: 'Add unit',
				items: [
					UnitType.Artillery,
					UnitType.Spotter,
					UnitType.Location,
					UnitType.Target,
					UnitType.LandingZone,
				].map((unitType) => ({
					label: `${UnitType[unitType]}`,
					command: () => {
						artillery.addUnit(
							unitType,
							undefined,
							ref(
								artillery.viewport.value.toWorldPosition(
									contextMenuPosition.value!
								)
							)
						);
					},
				})),
			},
		];

		if (artillery.selectedUnits.value.length > 0) {
			output.push({
				label: 'Add linked unit',
				items: [
					UnitType.Artillery,
					UnitType.Spotter,
					UnitType.Location,
					UnitType.Target,
					UnitType.LandingZone,
				].map((unitType) => ({
					label: `${UnitType[unitType]}`,
					command: () => {
						artillery.addUnit(
							unitType,
							undefined,
							ref(
								artillery.viewport.value
									.toWorldPosition(contextMenuPosition.value!)
									.addVector(
										getUnitResolvedVector(
											artillery.unitMap.value,
											artillery.selectedUnits.value[0]
										).scale(-1)
									)
							),
							artillery.selectedUnits.value[0]
						);
					},
				})),
			});
		}

		return output;
	});

	const isTransparent =
		new URL(location.href).searchParams.get('overlay') != null;
</script>
