<template>
	<PrimeDialog
		append-to=".App__container"
		v-model:visible="visible"
		header="Wind"
		position="bottomleft"
		@pointerdown.stop
		@wheel.stop
		:style="{ animation: 'none', transition: 'none' }"
	>
		<div class="Wind__information">
			<div class="Wind__information__item">
				<label>Wind direction:</label>
				<DirectionInput v-model="artillery.wind.value.azimuth" @update:model-value="syncedRoom.updateWind()" autofocus />
			</div>
			<div class="Wind__information__item">
				<label>Wind tier:</label>
				<PrimeInputNumber
					ref="primeInputNumber"
					v-model="artillery.wind.value.distance"
					@input="artillery.wind.value.distance = Number($event.value); syncedRoom.updateWind()"
					locale="en-UK"
					:allowEmpty="false"
					highlightOnFocus
					:minFractionDigits="0"
					:maxFractionDigits="1"
					:min="0"
				/>
			</div>
			<PrimeButton
				class="Wind__information__button"
				label="Reset"
				@pointerdown.stop="artillery.resetWind()"
			/>
		</div>
	</PrimeDialog>
</template>

<style lang="scss">
	.Wind__information {
		display: grid;
		grid-template-columns: max-content 1fr;
		gap: 1rem;
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
	import PrimeDialog from 'primevue/dialog';
	import PrimeInputNumber from 'primevue/inputnumber';
	import DirectionInput from '@/components/inputs/DirectionInput/DirectionInput.vue';
	import { artillery, syncedRoom } from '@/lib/globals';

	const visible = defineModel('visible', { type: Boolean, required: true });
</script>
