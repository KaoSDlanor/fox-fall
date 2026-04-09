<template>
	<FoxDialog
		persist-position-id="wind-settings"
		:default-position-override="{ bottom: 0, left: 0 }"
		:disable-close="true"
		:visible="pinned || artillery.overlayOpen.value"
		v-model:pinned="pinned"
		class="WindSettings__dialog"
		@pointerdown.stop
		@wheel.stop
		:style="{ animation: 'none', transition: 'none' }"
	>
		<template #header>Wind</template>
		<div class="Wind__information">
			<div class="Wind__information__item">
				<label>Direction:</label>
				<DirectionInput
					ref="directionInput"
					:model-value="artillery.sharedState.currentState.value.wind.azimuth"
					@update:model-value="
						artillery.sharedState.produceUpdate(() =>
							withHandling(() => {
								artillery.sharedState.currentState.value.wind.azimuth = $event;
								syncedRoom.updateWind();
							})
						);
						syncedRoom.updateWind();
					"
					autofocus
				/>
			</div>
			<div class="Wind__information__item">
				<label>Tier:</label>
				<NumberInput
					ref="tierInput"
					:model-value="artillery.sharedState.currentState.value.wind.distance"
					@update:model-value="
						artillery.sharedState.produceUpdate(() =>
							withHandling(() => {
								artillery.sharedState.currentState.value.wind.distance = $event;
								syncedRoom.updateWind();
							})
						)
					"
				/>
			</div>
			<div
				class="Wind__information__item"
				v-if="windMultiplier && settings.showWindMeters"
			>
				<label>Distance:</label>
				<DistanceInput
					:model-value="
						artillery.sharedState.currentState.value.wind.distance *
						windMultiplier
					"
					@update:model-value="
						artillery.sharedState.produceUpdate(() =>
							withHandling(() => {
								artillery.sharedState.currentState.value.wind.distance =
									$event / windMultiplier!;
								syncedRoom.updateWind();
							})
						)
					"
				/>
			</div>
			<PrimeButton
				v-if="artillery.overlayOpen.value"
				class="Wind__information__button"
				label="Reset"
				@pointerdown.stop="artillery.resetWind()"
			/>
		</div>
	</FoxDialog>
</template>

<style lang="scss">
	.WindSettings__dialog {
		top: auto;
		right: auto;
	}

	.Wind__information {
		display: grid;
		grid-template-columns: max-content 1fr;
		gap: 0.5em;
		padding: 0.5em;
		align-items: center;
	}

	.Wind__information__item {
		grid-column: auto / span 2;
		display: grid;
		grid-template-columns: subgrid;
		align-items: inherit;
	}

	.Wind__information__item__angle-input {
		margin: 0 !important;
	}

	.Wind__information__button {
		grid-column: auto / span 2;
	}
</style>

<script setup lang="ts">
	import PrimeButton from 'primevue/button';
	import { computed, shallowRef } from 'vue';
	import { withHandling } from '@packages/frontend-libs/dist/error';
	import FoxDialog from '@packages/frontend-libs/dist/FoxDialog.vue';
	import DirectionInput from '@packages/frontend-libs/dist/inputs/DirectionInput/DirectionInput.vue';
	import DistanceInput from '@packages/frontend-libs/dist/inputs/DistanceInput.vue';
	import NumberInput from '@packages/frontend-libs/dist/inputs/NumberInput.vue';
	import { artillery, syncedRoom } from '@/lib/globals';
	import { settings } from '@/lib/settings';
	import { getUnitSpecs } from '@/lib/unit';
	import { useFieldGroup } from '@/mixins/form';

	const pinned = defineModel('pinned', { default: false, type: Boolean });
	const directionInput = shallowRef<InstanceType<typeof DirectionInput>>(null!);
	const tierInput = shallowRef<InstanceType<typeof NumberInput>>(null!);

	const windMultiplier = computed(() => {
		const windOffsets = Object.keys(
			artillery.sharedState.currentState.value.unitMap
		)
			.map(
				(unitId) =>
					getUnitSpecs(artillery.sharedState.currentState.value.unitMap, unitId)
						?.WIND_OFFSET
			)
			.filter((windOffset) => windOffset != null);
		if (windOffsets.length > 0)
			return windOffsets.reduce((a, b) => a + b, 0) / windOffsets.length;

		return null;
	});

	useFieldGroup({
		inputs: computed(() => [directionInput.value, tierInput.value]),
		onLastSubmit() {
			artillery.checkWindowFocus();
		},
	});
</script>
