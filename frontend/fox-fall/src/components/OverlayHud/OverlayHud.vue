<template>
	<div class="Hud__container" :style="{ 'z-index': LAYER.HUD }">
		<div class="Hud__banner" v-if="artillery.unitSelector.value != null">
			{{
				artillery.unitSelector.value.prompt ?? 'Click on a unit to select it'
			}}
		</div>

		<CompassIcon
			class="Hud__compass"
			:style="{
				'--viewport-deg': artillery.viewport.value.rotation,
				opacity: settings.compassOpacity,
				'pointer-events': settings.compassOpacity > 0 ? 'auto' : 'none',
			}"
			alt="Reset rotation"
			:model-value="-artillery.viewport.value.rotation"
			@pointerdown.stop="onCompassClicked()"
		/>

		<div class="Hud__viewport-controls">
			<PrimeButton
				class="Dock__button"
				raised
				:severity="settings.lockPan ? 'danger' : 'secondary'"
				@pointerdown.stop="settings.lockPan = !settings.lockPan"
				v-prime-tooltip.left="'Lock pan'"
			>
				<DragIcon />
			</PrimeButton>
			<!--
			<PrimeButton
				class="Dock__button"
				raised
				:severity="settings.lockRotate ? 'danger' : 'secondary'"
				@pointerdown.stop="settings.lockRotate = !settings.lockRotate"
				v-prime-tooltip.left="'Lock rotation'"
			>
				<RotateIcon />
			</PrimeButton>
			-->
			<PrimeButton
				class="Dock__button"
				raised
				:severity="settings.lockZoom ? 'danger' : 'secondary'"
				@pointerdown.stop="settings.lockZoom = !settings.lockZoom"
				v-prime-tooltip.left="'Lock zoom'"
			>
				<ZoomIcon />
			</PrimeButton>
		</div>

		<div class="Hud__debug-info">
			<div>
				cursor: x{{ Math.round(resolvedCursor.x) }}m y{{
					Math.round(resolvedCursor.y)
				}}m
			</div>
			<div>
				position: x{{ Math.round(position.x) }}m y{{ Math.round(position.y) }}m
			</div>
			<div>
				rotation:
				{{ wrapDegrees(artillery.viewport.value.rotation).toFixed(1) }}°
			</div>
			<div>zoom: {{ Math.round(artillery.viewport.value.zoom * 100) }}%</div>
		</div>

		<UnitSettings
			:unit-id="artillery.selectedUnit.value || undefined"
			:persist-position-id="`unit-settings`"
			:visible="true"
			@update:visible="!$event && (artillery.selectedUnit.value = null)"
			:is-base-unit="true"
		/>

		<UnitSettings
			v-for="unitId in separatedUnits"
			:key="unitId"
			:unit-id="unitId"
			:default-position-override="{
				top: 50,
				left: 50,
				centerX: true,
				centerY: true,
			}"
			:visible="true"
			@update:visible="
				!$event &&
					separatedUnits.delete(unitId) &&
					artillery.selectedUnit.value === unitId &&
					(artillery.selectedUnit.value = null)
			"
		/>

		<WindSettings />
		<FiringSolution />

		<Dock />
	</div>
</template>

<style lang="scss">
	.Hud__container {
		display: contents;
	}

	.Hud__banner {
		position: fixed;
		top: 1em;
		left: 50%;
		transform: translateX(-50%);

		padding: 1em;
		border: 1px solid;

		background: black;
		opacity: 0.8;

		pointer-events: none;
	}

	.Hud__compass {
		position: fixed;
		top: 1em;
		right: 1em;

		width: 10em;
		height: 10em;
		border-radius: 50%;

		transform: rotate(calc(var(--viewport-deg) * 1deg));
		transform-origin: 50% 50%;

		cursor: pointer;
		user-select: none;
		filter: url(#outline-black);
	}

	.Hud__viewport-controls {
		position: fixed;
		top: 1em;
		right: 12em;
		height: 10em;

		display: flex;
		flex-direction: column;
		justify-content: space-around;
		gap: 0.5em;
		filter: url(#outline-black);

		.Dock__button {
			flex: 1 0 0;
		}
	}

	.Hud__debug-info {
		position: fixed;
		bottom: 1em;
		left: 1em;

		user-select: none;
		filter: url(#outline-black);
	}
</style>

<script setup lang="ts">
	import PrimeButton from 'primevue/button';
	import vPrimeTooltip from 'primevue/tooltip';
	import { computed, ref, watch } from 'vue';
	import { wrapDegrees } from '@packages/data/dist/artillery/angle';
	import CompassIcon from '@packages/frontend-libs/dist/icons/CompassIcon.vue';
	import DragIcon from '@packages/frontend-libs/dist/icons/DragIcon.vue';
	// import RotateIcon from '@packages/frontend-libs/dist/icons/RotateIcon.vue';
	import ZoomIcon from '@packages/frontend-libs/dist/icons/ZoomIcon.vue';
	import { useScopePerSetEntry } from '@packages/frontend-libs/dist/scope';
	import Dock from '@/components/OverlayHud/Dock.vue';
	import FiringSolution from '@/components/OverlayHud/FiringSolution.vue';
	import UnitSettings from '@/components/OverlayHud/UnitSettings.vue';
	import WindSettings from '@/components/OverlayHud/WindSettings.vue';
	import { LAYER } from '@/lib/constants/ui';
	import { artillery } from '@/lib/globals';
	import { settings } from '@/lib/settings';
import { provideUnitSettingsOpen } from '@/contexts/unit-settings-open';

	const resolvedCursor = computed(() => {
		return artillery.viewport.value.toWorldPosition(artillery.cursor.value);
	});

	const position = computed(() =>
		artillery.viewport.value
			.toWorldOffset(artillery.viewport.value.position)
			.scale(-1)
	);

	const onCompassClicked = async () => {
		await artillery.viewport.value.withSmoothing(async () => {
			artillery.resetViewport();
		});
	};

	const separatedUnits = ref<Set<string>>(new Set());
	provideUnitSettingsOpen(separatedUnits);

	useScopePerSetEntry(
		separatedUnits,
		(unitId) => {
			watch(
				() => artillery.sharedState.currentState.value.unitMap[unitId],
				(unit) => {
					if (unit == null) {
						separatedUnits.value.delete(unitId);
					}
				},
				{
					immediate: true,
					flush: 'sync',
				}
			);
		},
		'sync'
	);
</script>
