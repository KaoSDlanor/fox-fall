<template>
	<BitmapDisplay
		v-show="
			artillery.overlayOpen.value &&
			!artillery.viewportControl.calibrating.value &&
			!artillery.viewportControl.screenShotting.value
		"
		class="App__screen-canvas"
		:style="{
			opacity: settings.screenshotOpacity,
		}"
		:image="artillery.viewportControl.screenShot.value"
	/>

	<div
		:ref="(el) => (artillery.containerElement.value = el as HTMLDivElement)"
		class="App__container"
		:class="{
			App__transparent: isOverlay && settings.transparentOverlay,
			App__hidden:
				!artillery.overlayOpen.value && !settings.overlayAlwaysVisible,
			App__calibrating: artillery.viewportControl.calibrating.value,
			App__screenshot: artillery.viewportControl.screenShotting.value,
		}"
		@touchstart.prevent
		@pointerdown.stop="
			artillery.containerElement.value?.focus();
			artillery.selectedUnit.value = null;
			contextMenuPosition = null;
		"
		@pointermove="onPointerMove"
		@contextmenu.prevent="onContextMenu"
		@pointerdown="contextMenuPosition = null"
		tabindex="-1"
	>
		<Grid v-if="settings.backdropMode === BackdropMode.Grid" />

		<Viewport>
			<PositionedElement
				v-if="contextMenuPosition != null"
				:layer="LAYER.HUD"
				:x="contextMenuPosition.x"
				:y="contextMenuPosition.y"
			>
				<ContextRadial
					@submit="
						($event) =>
							artillery.sharedState.produceUpdate(() =>
								onContextMenuSubmit($event.value)
							)
					"
					@cancel="() => (contextMenuPosition = null)"
				/>
			</PositionedElement>
		</Viewport>

		<OverlayHud />

		<svg>
			<defs>
				<filter id="outline-black">
					<feMorphology
						in="SourceGraphic"
						result="DILATED"
						operator="dilate"
						radius="2"
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
				<filter id="outline-white">
					<feMorphology
						in="SourceGraphic"
						result="DILATED"
						operator="dilate"
						radius="2"
					/>
					<feColorMatrix
						in="DILATED"
						result="OUTLINED"
						type="matrix"
						values="
						1 1 1 0 0
						1 1 1 0 0
						1 1 1 0 0
						0 0 0 1 0
					"
					/>

					<feMerge>
						<feMergeNode in="OUTLINED" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
				<filter id="outline-black-inset">
					<feFlood flood-color="black" result="inside-color" />
					<feComposite in2="SourceAlpha" operator="in" result="inside-stroke" />
					<!--fill-area-->
					<feMorphology in="SourceAlpha" operator="erode" radius="2" />
					<feComposite in="SourceGraphic" operator="in" result="fill-area" />

					<feMerge>
						<feMergeNode in="inside-stroke" />
						<feMergeNode in="fill-area" />
					</feMerge>
				</filter>
				<filter id="outline-white-inset">
					<feFlood flood-color="white" result="inside-color" />
					<feComposite in2="SourceAlpha" operator="in" result="inside-stroke" />
					<!--fill-area-->
					<feMorphology in="SourceAlpha" operator="erode" radius="2" />
					<feComposite in="SourceGraphic" operator="in" result="fill-area" />

					<feMerge>
						<feMergeNode in="inside-stroke" />
						<feMergeNode in="fill-area" />
					</feMerge>
				</filter>
			</defs>
		</svg>
	</div>

	<OverlayToggle v-model:overlayOpen="artillery.overlayOpen.value" />
</template>

<style lang="scss">
	.App__container {
		contain: content;
		position: fixed;
		left: 0;
		top: 0;
		width: 100dvw;
		height: 100dvh;
		cursor: initial;

		color: var(--color-primary);
		outline: none;

		will-change: transform;
		transform: translateZ(0);

		&:not(.App__transparent) {
			background-color: var(--color-primary-contrast);
		}

		&.App__hidden {
			filter: opacity(0);
			pointer-events: none;
		}

		&.App__screenshot {
			cursor: none;
		}

		&.App__calibrating,
		&.App__screenshot {
			opacity: 0;
			pointer-events: none;
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
	import { ref, watch } from 'vue';
	import { Vector } from '@packages/data/dist/artillery/vector';
	import BitmapDisplay from '@/components/BitmapDisplay.vue';
	import Grid from '@/components/Grid.vue';
	import ContextRadial, {
		type Payload,
	} from './components/inputs/ContextRadial.vue';
	import OverlayHud from '@/components/OverlayHud/OverlayHud.vue';
	import OverlayToggle from '@/components/OverlayToggle/OverlayToggle.vue';
	import Viewport from '@/components/Viewport/Viewport.vue';
	import { isOverlay } from '@/lib/constants';
	import { artillery } from '@/lib/globals';
	import { BackdropMode, settings } from '@/lib/settings';
	import { getUnitResolvedVector } from '@/lib/unit';
	import PositionedElement from '@/components/Viewport/PositionedElement.vue';
	import { LAYER } from '@/lib/constants/ui';

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
		} else if (!artillery.viewportControl.canRotate.value) {
			contextMenuPosition.value = artillery.viewport.value.toWorldPosition(
				artillery.cursor.value.clone()
			);
			// contextMenu.value?.show(event);
		}
	};
	const onContextMenuSubmit = (payload: Payload) => {
		let newUnitPosition = contextMenuPosition.value!.clone();

		if (artillery.selectedUnit.value != null) {
			newUnitPosition = newUnitPosition.addVector(
				getUnitResolvedVector(
					artillery.sharedState.currentState.value.unitMap,
					artillery.selectedUnit.value
				).scale(-1)
			);
		}

		artillery.addUnit(
			payload.type,
			undefined,
			ref(newUnitPosition),
			artillery.selectedUnit.value || undefined,
			payload
		);

		contextMenuPosition.value = null;
	};

	watch(
		() => settings.value.fontScale,
		() => {
			document.documentElement.style.setProperty(
				'--_ui-scale',
				String(settings.value.fontScale)
			);
		},
		{ immediate: true }
	);
</script>
