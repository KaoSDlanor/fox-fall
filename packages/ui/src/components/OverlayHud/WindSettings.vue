<template>
	<FoxDialog
		persist-position-id="wind-settings"
		:default-position-override="{ bottom: 0, left: 0 }"
		:disable-close="true"
		:visible="true"
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
						artillery.sharedState.produceUpdate(() => {
							artillery.sharedState.currentState.value.wind.azimuth = $event;
							syncedRoom.updateWind();
						});
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
						artillery.sharedState.produceUpdate(() => {
							artillery.sharedState.currentState.value.wind.distance = $event;
							syncedRoom.updateWind();
						})
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
	import FoxDialog from '@/components/FoxDialog.vue';
	import DirectionInput from '@/components/inputs/DirectionInput/DirectionInput.vue';
	import NumberInput from '@/components/inputs/NumberInput.vue';
	import { artillery, syncedRoom } from '@/lib/globals';
	import { useFieldGroup } from '@/mixins/form';

	const directionInput = shallowRef<InstanceType<typeof DirectionInput>>(null!);
	const tierInput = shallowRef<InstanceType<typeof NumberInput>>(null!);

	useFieldGroup({
		inputs: computed(() => [directionInput.value, tierInput.value]),
		onLastSubmit() {
			artillery.checkWindowFocus();
		},
	});
</script>
