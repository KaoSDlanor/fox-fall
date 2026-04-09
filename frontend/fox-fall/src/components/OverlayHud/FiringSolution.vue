<template>
	<FoxDialog
		persist-position-id="firing-solution"
		:default-position-override="{ top: 0, left: 50, centerX: true }"
		:disable-close="true"
		:visible="pinned || artillery.overlayOpen.value"
		v-model:pinned="pinned"
		class="FiringSolution__dialog"
	>
		<template #header>
			<span v-if="artillery.selectedFiringPair.value">
				{{
					getUnitLabel(
						artillery.sharedState.currentState.value.unitMap,
						artillery.selectedFiringPair.value.artillery
					)
				}}
				->
				{{
					getUnitLabel(
						artillery.sharedState.currentState.value.unitMap,
						artillery.selectedFiringPair.value.target
					)
				}}
			</span>
			<span v-else>Firing Solution</span>
		</template>
		<div class="FiringSolution__information">
			<div class="FiringSolution__information__item">
				<label>Distance:</label>
				<DistanceInput
					ref="distanceInput"
					:class="{
						'FiringSolution__distance--invalid':
							specs != null &&
							(specs.MAX_RANGE <
								(artillery.selectedFiringVector.value?.distance ?? 0) ||
								specs.MIN_RANGE >
									(artillery.selectedFiringVector.value?.distance ?? 0)),
					}"
					:model-value="artillery.selectedFiringVector.value?.distance ?? 0"
					@update:model-value="
						artillery.sharedState.produceUpdate(() => {
							artillery.selectedFiringVector.value = Vector.fromAngularVector({
								distance: $event,
								azimuth: artillery.selectedFiringVector.value?.azimuth ?? 0,
							});
						})
					"
				/>
			</div>
			<div class="FiringSolution__information__item">
				<label>Azimuth:</label>
				<DirectionInput
					ref="azimuthInput"
					:model-value="artillery.selectedFiringVector.value?.azimuth ?? 0"
					@update:model-value="
						artillery.sharedState.produceUpdate(() => {
							artillery.selectedFiringVector.value = Vector.fromAngularVector({
								distance: artillery.selectedFiringVector.value?.distance ?? 0,
								azimuth: $event,
							});
						})
					"
				/>
			</div>
		</div>
	</FoxDialog>
</template>

<style lang="scss">
	.FiringSolution__dialog {
		top: auto;
		right: auto;
	}

	.FiringSolution__information {
		display: grid;
		grid-template-columns: max-content 1fr;
		gap: 0.5em;
		padding: 0.5em;
		align-items: center;
	}

	.FiringSolution__information__item {
		grid-column: auto / span 2;
		display: grid;
		grid-template-columns: subgrid;
		align-items: inherit;
	}

	.FiringSolution__information__item__angle-input {
		margin: 0 !important;
	}

	.FiringSolution__distance--invalid {
		--_border-color_1: red;
	}
</style>

<script setup lang="ts">
	import { computed, shallowRef } from 'vue';
	import { Vector } from '@packages/data/dist/artillery/vector';
	import FoxDialog from '@packages/frontend-libs/dist/FoxDialog.vue';
	import DirectionInput from '@packages/frontend-libs/dist/inputs/DirectionInput/DirectionInput.vue';
	import DistanceInput from '@packages/frontend-libs/dist/inputs/DistanceInput.vue';
	import { artillery } from '@/lib/globals';
	import { getUnitLabel, getUnitSpecs } from '@/lib/unit';
	import { useFieldGroup } from '@/mixins/form';

	const distanceInput = shallowRef<InstanceType<typeof DistanceInput>>(null!);
	const azimuthInput = shallowRef<InstanceType<typeof DirectionInput>>(null!);

	const pinned = shallowRef(true);

	const specs = computed(() => {
		const artilleryId = artillery.selectedFiringPair.value?.artillery;
		if (artilleryId == null) return null;
		return getUnitSpecs(
			artillery.sharedState.currentState.value.unitMap,
			artilleryId
		);
	});

	useFieldGroup({
		inputs: computed(() => [distanceInput.value, azimuthInput.value]),
		onLastSubmit() {
			artillery.checkWindowFocus();
		},
	});
</script>
