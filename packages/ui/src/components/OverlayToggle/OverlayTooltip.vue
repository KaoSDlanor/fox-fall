<template>
	<div
		class="OverlayTooltip__container"
		:class="{
			OverlayTooltip__danger:
				artilleryUnits.length > 1 || targetUnits.length > 1,
		}"
		v-if="firingVector"
	>
		<div class="OverlayTooltip__row">
			<span>distance:</span
			><span>{{ Math.round(firingVector.distance) }}m</span>
		</div>
		<div class="OverlayTooltip__row">
			<span>azimuth:</span><span>{{ firingVector.azimuth.toFixed(1) }}°</span>
		</div>
	</div>
</template>

<style lang="scss">
	.OverlayTooltip__container {
		display: grid;
		grid-template-columns: auto;
		grid-template-rows: repeat(2, auto);
		padding: 0.25em;
		line-height: 100%;

		min-width: 8em;

		background: var(--p-button-secondary-background);
		border: 1px solid var(--p-button-secondary-color);
		border-radius: calc(0.15 * var(--button-size));

		&.OverlayTooltip__danger {
			border-color: var(--p-button-danger-border-color);
		}
	}

	.OverlayTooltip__row {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		gap: 0.5em;
	}
</style>

<script setup lang="ts">
	import { artillery } from '@/lib/globals';
	import { UnitType } from '@/lib/unit';
	import { usePrimaryUnitsByType } from '@/mixins/focused-units';
	import { computed } from 'vue';

	const artilleryUnits = computed(() => {
		return Object.values(artillery.unitMap.value).filter(
			(unit) => unit != null && unit.type === UnitType.Artillery
		);
	});

	const targetUnits = computed(() => {
		return Object.values(artillery.unitMap.value).filter(
			(unit) => unit != null && unit.type === UnitType.Target
		);
	});

	const primaryUnitsByType = usePrimaryUnitsByType();

	const firingVector = computed(() => {
		if (
			primaryUnitsByType.value[UnitType.Artillery] == null ||
			primaryUnitsByType.value[UnitType.Target] == null
		)
			return undefined;
		return artillery.getFiringVector(
			primaryUnitsByType.value[UnitType.Artillery].id,
			primaryUnitsByType.value[UnitType.Target].id
		);
	});
</script>
